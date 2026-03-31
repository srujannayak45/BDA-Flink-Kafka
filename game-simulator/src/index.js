// ===========================
// Game Simulator - Main Entry Point
// Produces game events to Kafka
// ===========================

import { Kafka, Partitioners, logLevel } from 'kafkajs';
import { createPlayers } from './players.js';
import { GameEngine } from './gameEngine.js';

const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'game-events';
const TICK_MIN = parseInt(process.env.GAME_TICK_MIN_MS || '500');
const TICK_MAX = parseInt(process.env.GAME_TICK_MAX_MS || '1000');
const NUM_PLAYERS = parseInt(process.env.GAME_NUM_PLAYERS || '5');
const MAP_SIZE = parseInt(process.env.GAME_MAP_SIZE || '1000');

console.log('🎮 =======================================');
console.log('🎮  REAL-TIME AI GAME COMMENTATOR');
console.log('🎮  Game Event Simulator v1.0');
console.log('🎮 =======================================');
console.log(`📡 Kafka Brokers: ${KAFKA_BROKERS}`);
console.log(`📡 Topic: ${KAFKA_TOPIC}`);
console.log(`⏱️  Tick Rate: ${TICK_MIN}-${TICK_MAX}ms`);
console.log(`👥 Players: ${NUM_PLAYERS}`);

// Initialize Kafka producer
const kafka = new Kafka({
  clientId: 'game-simulator',
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 3000,
    retries: 20
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner
});

// Initialize game
const players = createPlayers(NUM_PLAYERS, MAP_SIZE);
const engine = new GameEngine(players, MAP_SIZE);

async function start() {
  console.log('⏳ Connecting to Kafka...');
  await producer.connect();
  console.log('✅ Connected to Kafka!');
  console.log('🚀 Starting game simulation...\n');

  let eventCount = 0;

  const gameLoop = async () => {
    try {
      const events = engine.tick();
      
      // Send each event to Kafka
      const messages = events.filter(Boolean).map(event => ({
        key: event.player_id,
        value: JSON.stringify(event),
        timestamp: String(event.timestamp)
      }));

      if (messages.length > 0) {
        await producer.send({
          topic: KAFKA_TOPIC,
          messages
        });

        eventCount += messages.length;

        // Log summary every 10 ticks
        if (engine.tickCount % 10 === 0) {
          const stats = engine.getPlayerStats();
          const topKiller = stats.reduce((a, b) => a.kills > b.kills ? a : b);
          console.log(`📊 Tick ${engine.tickCount} | Events sent: ${eventCount} | Top: ${topKiller.player_name} (${topKiller.kills} kills)`);
        }
      }
    } catch (err) {
      console.error('❌ Error in game loop:', err.message);
    }

    // Schedule next tick with random jitter
    const delay = TICK_MIN + Math.floor(Math.random() * (TICK_MAX - TICK_MIN));
    setTimeout(gameLoop, delay);
  };

  gameLoop();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down game simulator...');
  await producer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down game simulator...');
  await producer.disconnect();
  process.exit(0);
});

start().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
