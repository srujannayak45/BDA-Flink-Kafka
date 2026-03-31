package com.gamecommentator.models;

import java.io.Serializable;
import java.util.Map;
import java.util.HashMap;

/**
 * POJO representing generated commentary with emotion tags.
 */
public class Commentary implements Serializable {
    private static final long serialVersionUID = 1L;

    public String id;
    public String text;
    public String playerId;
    public String playerName;
    public String type;       // "kill_streak", "aggression", "inactivity", "momentum", "prediction", "event"
    public String emotion;    // "INTENSE", "CALM", "CRITICAL", "CLUTCH", "HYPE"
    public int priority;      // 1-10, higher = more important
    public long timestamp;
    public Map<String, Object> metadata;

    public Commentary() {
        this.metadata = new HashMap<>();
        this.timestamp = System.currentTimeMillis();
        this.priority = 5;
        this.emotion = "CALM";
    }

    public Commentary(String text, String playerId, String playerName, String type, String emotion, int priority) {
        this();
        this.id = "c_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
        this.text = text;
        this.playerId = playerId;
        this.playerName = playerName;
        this.type = type;
        this.emotion = emotion;
        this.priority = priority;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("text", text);
        map.put("player_id", playerId);
        map.put("player_name", playerName);
        map.put("type", type);
        map.put("emotion", emotion);
        map.put("priority", priority);
        map.put("timestamp", timestamp);
        map.put("metadata", metadata);
        return map;
    }
}
