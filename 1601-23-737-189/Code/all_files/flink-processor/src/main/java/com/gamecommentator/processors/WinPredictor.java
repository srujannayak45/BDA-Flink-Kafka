package com.gamecommentator.processors;

import com.gamecommentator.models.GameEvent;
import com.gamecommentator.models.Commentary;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

/**
 * Calculates win probability per player based on weighted scoring.
 * Factors: kills, deaths, streak, aggression, recent momentum.
 */
public class WinPredictor extends KeyedProcessFunction<String, GameEvent, Commentary> {
    private static final long serialVersionUID = 1L;
    private transient ValueState<Integer> killsState;
    private transient ValueState<Integer> deathsState;
    private transient ValueState<Integer> streakState;
    private transient ValueState<Double> lastProbState;
    private transient ValueState<Long> lastCommentaryState;

    private static final long COMMENTARY_COOLDOWN_MS = 20000;

    @Override
    public void open(Configuration parameters) {
        killsState = getRuntimeContext().getState(new ValueStateDescriptor<>("wpKills", Integer.class, 0));
        deathsState = getRuntimeContext().getState(new ValueStateDescriptor<>("wpDeaths", Integer.class, 0));
        streakState = getRuntimeContext().getState(new ValueStateDescriptor<>("wpStreak", Integer.class, 0));
        lastProbState = getRuntimeContext().getState(new ValueStateDescriptor<>("lastProb", Double.class, 0.2));
        lastCommentaryState = getRuntimeContext().getState(new ValueStateDescriptor<>("lastWpCommentary", Long.class, 0L));
    }

    @Override
    public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
        if (event.isKill()) {
            killsState.update(killsState.value() + 1);
            streakState.update(streakState.value() + 1);
        } else if (event.isDeath()) {
            deathsState.update(deathsState.value() + 1);
            streakState.update(0);
        }

        int kills = killsState.value();
        int deaths = deathsState.value();
        int streak = streakState.value();

        // Weighted win probability calculation
        double kdScore = deaths > 0 ? (double) kills / (kills + deaths) : (kills > 0 ? 0.8 : 0.2);
        double streakBonus = Math.min(streak * 0.05, 0.25);
        double winProb = Math.min(0.95, Math.max(0.05, kdScore * 0.7 + streakBonus + 0.1));

        double lastProb = lastProbState.value();
        long lastCommentary = lastCommentaryState.value();
        long now = event.timestamp;

        // Generate commentary on significant probability changes
        if (now - lastCommentary > COMMENTARY_COOLDOWN_MS) {
            double change = winProb - lastProb;
            if (change > 0.15) {
                out.collect(new Commentary(
                    String.format("Win probability surging for %s! Now at %.0f%% — they could take this match!",
                        event.playerName, winProb * 100),
                    event.playerId, event.playerName, "prediction", "HYPE", 7));
                lastCommentaryState.update(now);
            } else if (change < -0.15) {
                out.collect(new Commentary(
                    String.format("%s's win probability dropping to %.0f%%. The tide is turning against them!",
                        event.playerName, winProb * 100),
                    event.playerId, event.playerName, "prediction", "CRITICAL", 6));
                lastCommentaryState.update(now);
            } else if (winProb > 0.7 && lastProb <= 0.7) {
                out.collect(new Commentary(
                    String.format("%s is now the FAVORITE to win with %.0f%% probability!",
                        event.playerName, winProb * 100),
                    event.playerId, event.playerName, "prediction", "CLUTCH", 9));
                lastCommentaryState.update(now);
            }
        }

        lastProbState.update(winProb);
    }
}
