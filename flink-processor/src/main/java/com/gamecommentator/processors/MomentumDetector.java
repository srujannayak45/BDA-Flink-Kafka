package com.gamecommentator.processors;

import com.gamecommentator.models.GameEvent;
import com.gamecommentator.models.Commentary;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

/**
 * Detects momentum shifts by comparing consecutive performance windows.
 */
public class MomentumDetector extends KeyedProcessFunction<String, GameEvent, Commentary> {
    private static final long serialVersionUID = 1L;
    private transient ValueState<Integer> prevWindowKillsState;
    private transient ValueState<Integer> currWindowKillsState;
    private transient ValueState<Integer> prevWindowDeathsState;
    private transient ValueState<Integer> currWindowDeathsState;
    private transient ValueState<Long> windowStartState;
    private transient ValueState<String> lastTrendState;
    private transient ValueState<Integer> trendCountState;
    private static final long WINDOW_MS = 12000;

    @Override
    public void open(Configuration parameters) {
        prevWindowKillsState = getRuntimeContext().getState(new ValueStateDescriptor<>("prevKills", Integer.class, 0));
        currWindowKillsState = getRuntimeContext().getState(new ValueStateDescriptor<>("currKills", Integer.class, 0));
        prevWindowDeathsState = getRuntimeContext().getState(new ValueStateDescriptor<>("prevDeaths", Integer.class, 0));
        currWindowDeathsState = getRuntimeContext().getState(new ValueStateDescriptor<>("currDeaths", Integer.class, 0));
        windowStartState = getRuntimeContext().getState(new ValueStateDescriptor<>("momWindowStart", Long.class, 0L));
        lastTrendState = getRuntimeContext().getState(new ValueStateDescriptor<>("lastTrend", String.class, "stable"));
        trendCountState = getRuntimeContext().getState(new ValueStateDescriptor<>("trendCount", Integer.class, 0));
    }

    @Override
    public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
        long windowStart = windowStartState.value();
        if (windowStart == 0L) { windowStartState.update(event.timestamp); windowStart = event.timestamp; }

        if (event.timestamp - windowStart >= WINDOW_MS) {
            int currKills = currWindowKillsState.value();
            int prevKills = prevWindowKillsState.value();
            int currDeaths = currWindowDeathsState.value();
            double currPerf = currDeaths > 0 ? (double) currKills / currDeaths : currKills;
            double prevPerf = prevWindowDeathsState.value() > 0 ? (double) prevKills / prevWindowDeathsState.value() : prevKills;

            String trend = (currKills > prevKills + 1 || currPerf > prevPerf * 1.5) ? "rising"
                : (currKills < prevKills - 1 || (prevPerf > 0 && currPerf < prevPerf * 0.5)) ? "falling" : "stable";

            String lastTrend = lastTrendState.value();
            if (!trend.equals(lastTrend)) {
                if ("rising".equals(trend)) {
                    out.collect(new Commentary(
                        String.format("MOMENTUM SHIFT! %s is heating up with %d kills, up from %d!", event.playerName, currKills, prevKills),
                        event.playerId, event.playerName, "momentum", "HYPE", 7));
                } else if ("falling".equals(trend)) {
                    out.collect(new Commentary(
                        String.format("%s's momentum is fading! Only %d kills vs %d previously.", event.playerName, currKills, prevKills),
                        event.playerId, event.playerName, "momentum", "CALM", 4));
                }
                trendCountState.update(1);
            } else if ("rising".equals(trend) && trendCountState.value() >= 2) {
                out.collect(new Commentary(
                    String.format("%s has sustained rising momentum for 3+ windows! UNSTOPPABLE!", event.playerName),
                    event.playerId, event.playerName, "momentum", "CLUTCH", 8));
            } else { trendCountState.update(trendCountState.value() + 1); }

            lastTrendState.update(trend);
            prevWindowKillsState.update(currKills); prevWindowDeathsState.update(currDeaths);
            currWindowKillsState.update(0); currWindowDeathsState.update(0);
            windowStartState.update(event.timestamp);
        }

        if (event.isKill()) currWindowKillsState.update(currWindowKillsState.value() + 1);
        else if (event.isDeath()) currWindowDeathsState.update(currWindowDeathsState.value() + 1);
    }
}
