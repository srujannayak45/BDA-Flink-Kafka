package com.gamecommentator.processors;

import com.gamecommentator.models.GameEvent;
import com.gamecommentator.models.Commentary;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Analyzes player aggression by computing a kills-to-movement ratio.
 * High aggression = lots of kills relative to movement.
 * Low aggression = mostly moving/healing with few kills.
 */
public class AggressionAnalyzer extends KeyedProcessFunction<String, GameEvent, Commentary> {
    private static final Logger LOG = LoggerFactory.getLogger(AggressionAnalyzer.class);
    private static final long serialVersionUID = 1L;

    private transient ValueState<Integer> killCountState;
    private transient ValueState<Integer> moveCountState;
    private transient ValueState<Integer> healCountState;
    private transient ValueState<Double> lastAggressionState;
    private transient ValueState<Long> windowStartState;
    private transient ValueState<Boolean> lastCommentaryHighState;

    // Window duration for aggression calculation
    private static final long WINDOW_MS = 10000; // 10 seconds

    @Override
    public void open(Configuration parameters) {
        killCountState = getRuntimeContext().getState(new ValueStateDescriptor<>("aggrKills", Integer.class, 0));
        moveCountState = getRuntimeContext().getState(new ValueStateDescriptor<>("aggrMoves", Integer.class, 0));
        healCountState = getRuntimeContext().getState(new ValueStateDescriptor<>("aggrHeals", Integer.class, 0));
        lastAggressionState = getRuntimeContext().getState(new ValueStateDescriptor<>("lastAggression", Double.class, 0.0));
        windowStartState = getRuntimeContext().getState(new ValueStateDescriptor<>("aggrWindowStart", Long.class, 0L));
        lastCommentaryHighState = getRuntimeContext().getState(new ValueStateDescriptor<>("lastCommentaryHigh", Boolean.class, false));
    }

    @Override
    public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
        long windowStart = windowStartState.value();

        // Initialize or reset window
        if (windowStart == 0L) {
            windowStartState.update(event.timestamp);
            windowStart = event.timestamp;
        }

        // Check if window has elapsed
        if (event.timestamp - windowStart >= WINDOW_MS) {
            // Calculate aggression score
            int kills = killCountState.value();
            int moves = moveCountState.value();
            int heals = healCountState.value();
            int totalActions = kills + moves + heals;

            if (totalActions > 0) {
                double aggression = (double) kills / totalActions;
                double previousAggression = lastAggressionState.value();
                boolean wasHigh = lastCommentaryHighState.value();

                // Generate commentary on significant changes
                if (aggression > 0.5 && !wasHigh) {
                    Commentary commentary = new Commentary(
                        String.format("%s is playing extremely aggressively! Aggression score: %.0f%%", 
                            event.playerName, aggression * 100),
                        event.playerId, event.playerName, "aggression", "INTENSE", 6
                    );
                    commentary.metadata.put("aggression_score", aggression);
                    commentary.metadata.put("window_kills", kills);
                    out.collect(commentary);
                    lastCommentaryHighState.update(true);
                } else if (aggression < 0.15 && heals > 2) {
                    Commentary commentary = new Commentary(
                        String.format("%s is playing very defensively, focusing on survival with %d heals!", 
                            event.playerName, heals),
                        event.playerId, event.playerName, "aggression", "CALM", 4
                    );
                    commentary.metadata.put("aggression_score", aggression);
                    commentary.metadata.put("heal_count", heals);
                    out.collect(commentary);
                    lastCommentaryHighState.update(false);
                } else if (Math.abs(aggression - previousAggression) > 0.3) {
                    String trend = aggression > previousAggression ? "ramping up" : "cooling down";
                    Commentary commentary = new Commentary(
                        String.format("%s is %s their aggression! Score shifted from %.0f%% to %.0f%%", 
                            event.playerName, trend, previousAggression * 100, aggression * 100),
                        event.playerId, event.playerName, "aggression", 
                        aggression > previousAggression ? "HYPE" : "CALM", 5
                    );
                    commentary.metadata.put("aggression_score", aggression);
                    commentary.metadata.put("previous_aggression", previousAggression);
                    out.collect(commentary);
                    lastCommentaryHighState.update(aggression > 0.5);
                }

                lastAggressionState.update(aggression);
            }

            // Reset window
            killCountState.update(0);
            moveCountState.update(0);
            healCountState.update(0);
            windowStartState.update(event.timestamp);
        }

        // Accumulate counts
        if (event.isKill()) {
            killCountState.update(killCountState.value() + 1);
        } else if (event.isMove()) {
            moveCountState.update(moveCountState.value() + 1);
        } else if ("heal".equals(event.action)) {
            healCountState.update(healCountState.value() + 1);
        }
    }
}
