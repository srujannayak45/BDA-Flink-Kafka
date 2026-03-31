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
 * Detects player inactivity using processing time timers.
 * If a player sends only idle events or no events for a threshold,
 * commentary is generated.
 */
public class InactivityDetector extends KeyedProcessFunction<String, GameEvent, Commentary> {
    private static final Logger LOG = LoggerFactory.getLogger(InactivityDetector.class);
    private static final long serialVersionUID = 1L;

    private transient ValueState<Long> lastActiveTimeState;
    private transient ValueState<Integer> idleCountState;
    private transient ValueState<Boolean> announcedInactiveState;
    private transient ValueState<String> playerNameState;

    // Inactivity threshold
    private static final long INACTIVITY_THRESHOLD_MS = 8000; // 8 seconds
    private static final int IDLE_COUNT_THRESHOLD = 4; // 4 consecutive idles

    @Override
    public void open(Configuration parameters) {
        lastActiveTimeState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("lastActiveTime", Long.class, 0L));
        idleCountState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("idleCount", Integer.class, 0));
        announcedInactiveState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("announcedInactive", Boolean.class, false));
        playerNameState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("playerName", String.class, "Unknown"));
    }

    @Override
    public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
        playerNameState.update(event.playerName);

        if (event.isIdle()) {
            int idleCount = idleCountState.value() + 1;
            idleCountState.update(idleCount);

            if (idleCount >= IDLE_COUNT_THRESHOLD && !announcedInactiveState.value()) {
                Commentary commentary = new Commentary(
                    String.format("%s appears to be AFK! No significant activity detected. Is something going on?", 
                        event.playerName),
                    event.playerId, event.playerName, "inactivity", "CALM", 3
                );
                commentary.metadata.put("idle_count", idleCount);
                out.collect(commentary);
                announcedInactiveState.update(true);
                LOG.info("😴 Inactivity detected: {}", event.playerName);
            }
        } else {
            // Player is active again
            if (announcedInactiveState.value()) {
                String actionDesc = event.isKill() ? "with a kill" : "making moves";
                Commentary commentary = new Commentary(
                    String.format("%s is back in action %s! The hiatus is over!", 
                        event.playerName, actionDesc),
                    event.playerId, event.playerName, "inactivity", "HYPE", 5
                );
                out.collect(commentary);
                announcedInactiveState.update(false);
            }
            idleCountState.update(0);
            lastActiveTimeState.update(event.timestamp);
        }

        // Register timer for extended inactivity check
        ctx.timerService().registerProcessingTimeTimer(
            System.currentTimeMillis() + INACTIVITY_THRESHOLD_MS);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Commentary> out) throws Exception {
        long lastActive = lastActiveTimeState.value();
        if (lastActive > 0 && !announcedInactiveState.value()) {
            long elapsed = System.currentTimeMillis() - lastActive;
            if (elapsed >= INACTIVITY_THRESHOLD_MS) {
                String playerName = playerNameState.value();
                Commentary commentary = new Commentary(
                    String.format("%s has gone completely silent for %d seconds! Are they strategizing or disconnected?", 
                        playerName, elapsed / 1000),
                    ctx.getCurrentKey(), playerName, "inactivity", "CALM", 4
                );
                commentary.metadata.put("inactive_seconds", elapsed / 1000);
                out.collect(commentary);
                announcedInactiveState.update(true);
            }
        }
    }
}
