#!/bin/bash
# ===========================
# Kafka Topic Initialization
# ===========================

echo "⏳ Waiting for Kafka to be ready..."
cub kafka-ready -b kafka:29092 1 60

echo "📡 Creating Kafka topics..."

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:29092 \
  --replication-factor 1 \
  --partitions 3 \
  --topic game-events

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:29092 \
  --replication-factor 1 \
  --partitions 3 \
  --topic commentary

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:29092 \
  --replication-factor 1 \
  --partitions 3 \
  --topic game-stats

echo "✅ All topics created successfully!"
kafka-topics --list --bootstrap-server kafka:29092
