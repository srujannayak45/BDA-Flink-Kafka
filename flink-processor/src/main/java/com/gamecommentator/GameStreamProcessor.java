package com.gamecommentator;

import com.gamecommentator.models.GameEvent;
import com.gamecommentator.models.Commentary;
import com.gamecommentator.processors.*;
import com.gamecommentator.serialization.*;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

/**
 * Main Flink Streaming Job: Real-Time AI Game Commentator
 * 
 * Pipeline:
 *   Kafka(game-events) → Parse → KeyBy(player_id) 
 *     → KillStreakDetector
 *     → AggressionAnalyzer
 *     → InactivityDetector
 *     → MomentumDetector
 *     → WinPredictor
 *   → Union all commentary → Kafka(commentary)
 */
public class GameStreamProcessor {
    private static final Logger LOG = LoggerFactory.getLogger(GameStreamProcessor.class);

    public static void main(String[] args) throws Exception {
        LOG.info("🎮 ============================================");
        LOG.info("🎮  FLINK GAME STREAM PROCESSOR v1.0");
        LOG.info("🎮 ============================================");

        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(10000);

        String kafkaBootstrap = System.getenv("KAFKA_BOOTSTRAP_SERVERS") != null 
            ? System.getenv("KAFKA_BOOTSTRAP_SERVERS") : "kafka:29092";
        String inputTopic = "game-events";
        String outputTopic = "commentary";

        LOG.info("📡 Kafka: {} | Input: {} | Output: {}", kafkaBootstrap, inputTopic, outputTopic);

        // === SOURCE: Kafka game-events ===
        KafkaSource<GameEvent> source = KafkaSource.<GameEvent>builder()
            .setBootstrapServers(kafkaBootstrap)
            .setTopics(inputTopic)
            .setGroupId("flink-game-processor")
            .setStartingOffsets(OffsetsInitializer.latest())
            .setValueOnlyDeserializer(new GameEventDeserializer())
            .build();

        DataStream<GameEvent> gameEvents = env.fromSource(
            source,
            WatermarkStrategy.<GameEvent>forBoundedOutOfOrderness(Duration.ofSeconds(2))
                .withTimestampAssigner((event, timestamp) -> event != null ? event.timestamp : System.currentTimeMillis()),
            "KafkaGameEvents"
        ).uid("kafka-source").filter(event -> event != null).uid("null-filter");

        // === KEY BY PLAYER ===
        // Each processor runs independently keyed by player_id

        // 1. Kill Streak Detection
        SingleOutputStreamOperator<Commentary> killStreakCommentary = gameEvents
            .keyBy(event -> event.playerId)
            .process(new KillStreakDetector())
            .uid("kill-streak-detector")
            .name("Kill Streak Detector");

        // 2. Aggression Analysis
        SingleOutputStreamOperator<Commentary> aggressionCommentary = gameEvents
            .keyBy(event -> event.playerId)
            .process(new AggressionAnalyzer())
            .uid("aggression-analyzer")
            .name("Aggression Analyzer");

        // 3. Inactivity Detection
        SingleOutputStreamOperator<Commentary> inactivityCommentary = gameEvents
            .keyBy(event -> event.playerId)
            .process(new InactivityDetector())
            .uid("inactivity-detector")
            .name("Inactivity Detector");

        // 4. Momentum Detection
        SingleOutputStreamOperator<Commentary> momentumCommentary = gameEvents
            .keyBy(event -> event.playerId)
            .process(new MomentumDetector())
            .uid("momentum-detector")
            .name("Momentum Detector");

        // 5. Win Prediction
        SingleOutputStreamOperator<Commentary> predictionCommentary = gameEvents
            .keyBy(event -> event.playerId)
            .process(new WinPredictor())
            .uid("win-predictor")
            .name("Win Predictor");

        // === UNION ALL COMMENTARY ===
        DataStream<Commentary> allCommentary = killStreakCommentary
            .union(aggressionCommentary)
            .union(inactivityCommentary)
            .union(momentumCommentary)
            .union(predictionCommentary);

        // === SINK: Kafka commentary topic ===
        KafkaSink<Commentary> commentarySink = KafkaSink.<Commentary>builder()
            .setBootstrapServers(kafkaBootstrap)
            .setRecordSerializer(
                KafkaRecordSerializationSchema.builder()
                    .setTopic(outputTopic)
                    .setValueSerializationSchema(new CommentarySerializer())
                    .build()
            )
            .build();

        allCommentary.sinkTo(commentarySink).uid("commentary-sink").name("Commentary Kafka Sink");

        // === Also sink raw events for stats (pass-through) ===
        // The backend will consume game-events directly for stats

        LOG.info("🚀 Starting Flink Game Stream Processor...");
        env.execute("Real-Time AI Game Commentator");
    }
}
