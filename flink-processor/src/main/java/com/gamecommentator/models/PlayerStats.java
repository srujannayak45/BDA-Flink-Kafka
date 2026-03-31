package com.gamecommentator.models;

import java.io.Serializable;
import java.util.Map;
import java.util.HashMap;

/**
 * POJO representing aggregated player statistics.
 */
public class PlayerStats implements Serializable {
    private static final long serialVersionUID = 1L;

    public String playerId;
    public String playerName;
    public String personality;
    public String color;
    public int kills;
    public int deaths;
    public int currentStreak;
    public int maxStreak;
    public double aggressionScore;
    public double mobilityScore;
    public int healCount;
    public int abilityCount;
    public int totalDamage;
    public int totalMoveDistance;
    public int idleCount;
    public boolean alive;
    public int hp;
    public int x;
    public int y;
    public long lastEventTime;
    public double winProbability;
    public String momentumTrend; // "rising", "falling", "stable"

    // For sliding window calculations
    public int windowKills;
    public int windowDeaths;
    public int windowMoves;
    public int windowIdles;

    public PlayerStats() {
        this.kills = 0;
        this.deaths = 0;
        this.currentStreak = 0;
        this.maxStreak = 0;
        this.aggressionScore = 0.0;
        this.mobilityScore = 0.0;
        this.healCount = 0;
        this.abilityCount = 0;
        this.totalDamage = 0;
        this.totalMoveDistance = 0;
        this.idleCount = 0;
        this.alive = true;
        this.hp = 100;
        this.winProbability = 0.2;
        this.momentumTrend = "stable";
        this.windowKills = 0;
        this.windowDeaths = 0;
        this.windowMoves = 0;
        this.windowIdles = 0;
    }

    public double getKDRatio() {
        return deaths > 0 ? (double) kills / deaths : kills;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("player_id", playerId);
        map.put("player_name", playerName);
        map.put("personality", personality);
        map.put("color", color);
        map.put("kills", kills);
        map.put("deaths", deaths);
        map.put("kd_ratio", String.format("%.2f", getKDRatio()));
        map.put("current_streak", currentStreak);
        map.put("max_streak", maxStreak);
        map.put("aggression_score", String.format("%.2f", aggressionScore));
        map.put("mobility_score", String.format("%.2f", mobilityScore));
        map.put("heal_count", healCount);
        map.put("ability_count", abilityCount);
        map.put("total_damage", totalDamage);
        map.put("idle_count", idleCount);
        map.put("alive", alive);
        map.put("hp", hp);
        map.put("x", x);
        map.put("y", y);
        map.put("win_probability", String.format("%.3f", winProbability));
        map.put("momentum_trend", momentumTrend);
        return map;
    }
}
