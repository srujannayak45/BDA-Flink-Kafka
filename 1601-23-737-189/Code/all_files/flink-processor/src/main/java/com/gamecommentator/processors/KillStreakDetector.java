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
 * Detects kill streaks using Flink keyed state.
 * Tracks consecutive kills per player and generates commentary when streaks are achieved.
 */
public class KillStreakDetector extends KeyedProcessFunction<String, GameEvent, Commentary> {
    private static final Logger LOG = LoggerFactory.getLogger(KillStreakDetector.class);
    private static final long serialVersionUID = 1L;

    private transient ValueState<Integer> currentStreakState;
    private transient ValueState<Integer> maxStreakState;
    private transient ValueState<Long> lastKillTimeState;

    // Streak timeout - if no kill within 15 seconds, streak resets
    private static final long STREAK_TIMEOUT_MS = 15000;

    @Override
    public void open(Configuration parameters) {
        currentStreakState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("currentStreak", Integer.class, 0));
        maxStreakState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("maxStreak", Integer.class, 0));
        lastKillTimeState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("lastKillTime", Long.class, 0L));
    }

    @Override
    public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
        if (event.isKill()) {
            int currentStreak = currentStreakState.value() + 1;
            long lastKillTime = lastKillTimeState.value();

            // Reset streak if too much time has passed
            if (lastKillTime > 0 && (event.timestamp - lastKillTime) > STREAK_TIMEOUT_MS) {
                currentStreak = 1;
            }

            currentStreakState.update(currentStreak);
            lastKillTimeState.update(event.timestamp);

            int maxStreak = maxStreakState.value();
            if (currentStreak > maxStreak) {
                maxStreakState.update(currentStreak);
            }

            // Generate commentary based on streak level
            if (currentStreak >= 2) {
                Commentary commentary = generateStreakCommentary(event, currentStreak);
                if (commentary != null) {
                    out.collect(commentary);
                    LOG.info("🔥 Kill streak detected: {} has {} kills!", event.playerName, currentStreak);
                }
            }

            // Register timer for streak timeout
            ctx.timerService().registerProcessingTimeTimer(event.timestamp + STREAK_TIMEOUT_MS);
        } else if (event.isDeath()) {
            // Reset streak on death
            int finalStreak = currentStreakState.value();
            if (finalStreak >= 3) {
                Commentary endCommentary = new Commentary(
                    String.format("%s's incredible %d-kill streak has been ended!", event.playerName, finalStreak),
                    event.playerId, event.playerName, "kill_streak", "CRITICAL", 8
                );
                endCommentary.metadata.put("streak_ended", finalStreak);
                out.collect(endCommentary);
            }
            currentStreakState.update(0);
        }
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Commentary> out) throws Exception {
        // Streak timeout - reset if no recent kills
        long lastKill = lastKillTimeState.value();
        if (lastKill > 0 && (timestamp - lastKill) >= STREAK_TIMEOUT_MS) {
            currentStreakState.update(0);
        }
    }

    private Commentary generateStreakCommentary(GameEvent event, int streak) {
        String text;
        String emotion;
        int priority;

        String victimName = event.details != null ? event.details.victimName : "an opponent";

        switch (streak) {
            case 2:
                text = String.format("%s scores a double kill! Taking down %s!", event.playerName, victimName);
                emotion = "HYPE";
                priority = 5;
                break;
            case 3:
                text = String.format("TRIPLE KILL! %s is on fire with 3 consecutive eliminations!", event.playerName);
                emotion = "INTENSE";
                priority = 7;
                break;
            case 4:
                text = String.format("QUAD KILL! %s is absolutely dominating the battlefield!", event.playerName);
                emotion = "INTENSE";
                priority = 8;
                break;
            case 5:
                text = String.format("PENTAKILL! %s is UNSTOPPABLE with a 5-kill streak! This is legendary!", event.playerName);
                emotion = "CLUTCH";
                priority = 10;
                break;
            default:
                if (streak > 5) {
                    text = String.format("GODLIKE! %s has an insane %d-kill streak! No one can stop them!", event.playerName, streak);
                    emotion = "CLUTCH";
                    priority = 10;
                } else {
                    return null;
                }
                break;
        }

        Commentary commentary = new Commentary(text, event.playerId, event.playerName, "kill_streak", emotion, priority);
        commentary.metadata.put("streak_count", streak);
        commentary.metadata.put("victim", victimName);
        return commentary;
    }
}
