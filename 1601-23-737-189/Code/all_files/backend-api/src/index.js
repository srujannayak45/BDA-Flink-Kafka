// ===========================
// Backend API - Main Server
// Express + WebSocket + Kafka Consumer + Producer
// ===========================

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { Kafka, Partitioners, logLevel } from 'kafkajs';
import { KafkaConsumerManager } from './kafkaConsumer.js';
import { CommentaryEngine } from './commentaryEngine.js';

const PORT = parseInt(process.env.PORT || '3001');
const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');

console.log('🎙️ =======================================');
console.log('🎙️  AI GAME COMMENTATOR - BACKEND API');
console.log('🎙️ =======================================');

// === Kafka Producer (for browser game events) ===
const kafka = new Kafka({
  clientId: 'backend-producer',
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.WARN,
  retry: { initialRetryTime: 3000, retries: 20 }
});
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

// === Express Setup ===
const app = express();
app.use(cors());
app.use(express.json());
const server = createServer(app);

// === WebSocket Setup ===
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 WebSocket client connected (total: ${clients.size})`);

  ws.send(JSON.stringify({
    type: 'system',
    data: { message: 'Connected to AI Game Commentator!', timestamp: Date.now() }
  }));

  // Handle messages FROM the browser (game events)
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'game_event' && msg.data) {
        const event = msg.data;
        // Forward to Kafka
        await producer.send({
          topic: 'game-events',
          messages: [{
            key: event.player_id || 'player',
            value: JSON.stringify(event),
            timestamp: String(event.timestamp || Date.now())
          }]
        });
        // Process locally for stats
        updatePlayerStats(event);
        broadcast('game_event', event);
        broadcast('player_stats', Object.values(playerStats));
        // Generate cricket commentary directly
        const commentary = commentaryEngine.generateCricketCommentary(event);
        if (commentary) {
          broadcast('commentary', commentary);
          console.log(`🏏 ${commentary.emotion_emoji} ${commentary.text}`);
          // Send to TTS service for audio generation (non-blocking)
          generateAudio(commentary.text, commentary.priority);
        }
      }
    } catch (e) {
      // skip malformed
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 WebSocket client disconnected (total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    clients.delete(ws);
  });
});

function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === 1) {
      try { client.send(message); } catch (e) { /* ignore */ }
    }
  }
}

// === Services ===
const commentaryEngine = new CommentaryEngine();
const TTS_URL = process.env.TTS_URL || 'http://tts-service:5000';
let ttsReady = false;

// Check TTS readiness periodically
async function checkTTS() {
  try {
    const res = await fetch(`${TTS_URL}/health`);
    const data = await res.json();
    if (data.ready && !ttsReady) {
      console.log('🔊 TTS Service is READY (XTTS-v2 loaded)');
    }
    ttsReady = data.ready;
  } catch (e) { ttsReady = false; }
}
setInterval(checkTTS, 10000);
setTimeout(checkTTS, 5000);

// Generate audio from commentary text (non-blocking)
async function generateAudio(text, priority = 5) {
  if (!ttsReady || priority < 5) return; // Only speak important commentary
  try {
    const res = await fetch(`${TTS_URL}/speak/b64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speed: 1.1, temperature: 0.65 })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.audio_b64) {
      broadcast('audio', { audio_b64: data.audio_b64, format: 'wav', text });
      console.log(`🔊 Audio sent to clients (${(data.audio_b64.length / 1024).toFixed(0)}KB)`);
    }
  } catch (e) {
    // TTS service unavailable - browser TTS fallback handles it
  }
}

// === Player Stats Aggregation ===
const playerStats = {};
const recentEvents = [];
const MAX_RECENT_EVENTS = 200;

function updatePlayerStats(event) {
  const id = event.player_id;
  if (!playerStats[id]) {
    playerStats[id] = {
      player_id: id,
      player_name: event.player_name || id,
      personality: event.personality || 'balanced',
      color: event.color || '#6366f1',
      kills: 0, deaths: 0, streak: 0, max_streak: 0,
      total_damage: 0, heal_count: 0, ability_count: 0,
      move_distance: 0, idle_count: 0,
      hp: 100, alive: true, x: 0, y: 0,
      win_probability: 0.2,
      // Cricket stats
      runs: 0, balls_faced: 0, fours: 0, sixes: 0,
      wickets_taken: 0, dots: 0, strike_rate: 0
    };
  }

  const stats = playerStats[id];
  stats.x = event.x || stats.x;
  stats.y = event.y || stats.y;

  // Handle cricket events
  switch (event.action) {
    case 'runs':
      stats.runs += event.details?.runs || 0;
      stats.balls_faced++;
      if (event.details?.runs === 4) stats.fours++;
      if (event.details?.runs === 6) stats.sixes++;
      stats.strike_rate = stats.balls_faced > 0 ? ((stats.runs / stats.balls_faced) * 100).toFixed(1) : 0;
      break;
    case 'dot_ball':
      stats.balls_faced++;
      stats.dots++;
      stats.strike_rate = stats.balls_faced > 0 ? ((stats.runs / stats.balls_faced) * 100).toFixed(1) : 0;
      break;
    case 'wicket':
      stats.deaths++;
      stats.alive = false;
      break;
    case 'bowl':
      stats.ability_count++;
      break;
    // Legacy game events
    case 'kill':
      if (event.details?.killed) { stats.kills++; stats.streak++; stats.max_streak = Math.max(stats.max_streak, stats.streak); }
      stats.total_damage += event.details?.damage || 0;
      break;
    case 'death':
      stats.deaths++; stats.streak = 0; stats.alive = false; stats.hp = 0;
      break;
    case 'respawn':
      stats.alive = true; stats.hp = 100;
      break;
    case 'heal':
      stats.heal_count++; stats.hp = event.details?.current_hp || stats.hp;
      break;
    case 'move':
      stats.move_distance += event.details?.distance || 0;
      break;
    case 'idle':
      stats.idle_count++;
      break;
  }

  // Win probability for cricket
  const totalRuns = Object.values(playerStats).reduce((s, p) => s + (p.runs || 0), 0);
  if (totalRuns > 0) {
    stats.win_probability = Math.min(0.95, Math.max(0.05, (stats.runs / Math.max(totalRuns, 1)) * 0.8 + 0.1));
  }

  recentEvents.push({ ...event, received_at: Date.now() });
  if (recentEvents.length > MAX_RECENT_EVENTS) recentEvents.shift();
}

// === Kafka Consumer ===
const kafkaManager = new KafkaConsumerManager();

kafkaManager.on('game-event', (event) => {
  updatePlayerStats(event);
  broadcast('game_event', event);
  broadcast('player_stats', Object.values(playerStats));
});

kafkaManager.on('commentary', (commentary) => {
  const enhanced = commentaryEngine.enhance(commentary);
  broadcast('commentary', enhanced);
});

// === REST Endpoints ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), clients: clients.size });
});

app.get('/api/stats', (req, res) => {
  res.json({ players: Object.values(playerStats), event_count: recentEvents.length });
});

app.get('/api/events', (req, res) => {
  const limit = parseInt(req.query.limit || '50');
  res.json(recentEvents.slice(-limit));
});

// === Start ===
async function start() {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected');
    await kafkaManager.connect();
    server.listen(PORT, () => {
      console.log(`✅ Backend API running on port ${PORT}`);
      console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    setTimeout(start, 5000);
  }
}

process.on('SIGINT', async () => {
  await producer.disconnect();
  await kafkaManager.disconnect();
  server.close();
  process.exit(0);
});

start();
