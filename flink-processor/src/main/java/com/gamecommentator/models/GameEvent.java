package com.gamecommentator.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * POJO representing a game event from the simulator.
 * Follows Flink POJO requirements for efficient serialization.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("match_id")
    public String matchId;

    @JsonProperty("player_id")
    public String playerId;

    @JsonProperty("player_name")
    public String playerName;

    @JsonProperty("personality")
    public String personality;

    @JsonProperty("color")
    public String color;

    @JsonProperty("action")
    public String action;

    @JsonProperty("timestamp")
    public long timestamp;

    @JsonProperty("game_tick")
    public int gameTick;

    @JsonProperty("x")
    public int x;

    @JsonProperty("y")
    public int y;

    @JsonProperty("details")
    public EventDetails details;

    // Default constructor required by Flink
    public GameEvent() {}

    public boolean isKill() {
        return "kill".equals(action) && details != null && details.killed;
    }

    public boolean isDeath() {
        return "death".equals(action);
    }

    public boolean isIdle() {
        return "idle".equals(action);
    }

    public boolean isMove() {
        return "move".equals(action);
    }

    @Override
    public String toString() {
        return String.format("GameEvent{player=%s, action=%s, tick=%d}", playerName, action, gameTick);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventDetails implements Serializable {
        private static final long serialVersionUID = 1L;

        @JsonProperty("victim_id")
        public String victimId;

        @JsonProperty("victim_name")
        public String victimName;

        @JsonProperty("damage")
        public int damage;

        @JsonProperty("killed")
        public boolean killed;

        @JsonProperty("killer_kills")
        public int killerKills;

        @JsonProperty("killer_streak")
        public int killerStreak;

        @JsonProperty("victim_hp")
        public int victimHp;

        @JsonProperty("killer_id")
        public String killerId;

        @JsonProperty("killer_name")
        public String killerName;

        @JsonProperty("heal_amount")
        public int healAmount;

        @JsonProperty("current_hp")
        public int currentHp;

        @JsonProperty("ability_name")
        public String abilityName;

        @JsonProperty("distance")
        public int distance;

        @JsonProperty("duration")
        public int duration;

        public EventDetails() {}
    }
}
