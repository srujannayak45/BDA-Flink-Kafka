# 🎮 Real-Time AI Game Commentator with Voice Output

> A production-grade, distributed real-time streaming system that simulates live gameplay, processes events with Apache Flink + Kafka, generates intelligent AI commentary, and delivers output via a stunning React dashboard + text-to-speech audio.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-7.5.0-red)
![Flink](https://img.shields.io/badge/Apache%20Flink-1.18.1-orange)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20-339933)
![Python](https://img.shields.io/badge/Python-3.11-3776AB)

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Services](#-services)
- [API Reference](#-api-reference)
- [Screenshots](#-screenshots)

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│  Game Simulator  │────▶│    Kafka     │────▶│     Apache Flink        │
│   (Node.js)      │     │  game-events │     │  ┌─────────────────┐   │
│  5 AI Players    │     │              │     │  │Kill Streak Det. │   │
│  500ms events    │     │              │     │  │Aggression Anal. │   │
└─────────────────┘     │              │     │  │Inactivity Det.  │   │
                         │              │     │  │Momentum Det.    │   │
                         │  commentary  │◀────│  │Win Predictor    │   │
                         │              │     │  └─────────────────┘   │
                         └──────┬───────┘     └─────────────────────────┘
                                │
                         ┌──────▼───────┐
                         │  Backend API  │
                         │  (Node.js)    │──────┐
                         │  WebSocket    │      │
                         └──────┬───────┘      │
                                │               │
                    ┌───────────┴──────┐  ┌────▼──────┐
                    │  React Dashboard  │  │TTS Service│
                    │  Live Commentary  │  │  (Python) │
                    │  Player Stats     │  │  pyttsx3  │
                    │  Battle Heatmap   │  └───────────┘
                    │  Win Predictions  │
                    └──────────────────┘
```

---

## ✨ Features

### Core Pipeline
- **Real-time game simulation** with 5 AI players (Aggressive, Defensive, Balanced, Sniper, Rusher)
- **Apache Kafka** event streaming with 3 topics (game-events, commentary, game-stats)
- **Apache Flink** DataStream processing with 5 parallel analyzers
- **WebSocket** real-time frontend updates

### Flink Analytics
| Analyzer | What it Detects |
|----------|----------------|
| Kill Streak Detector | Double, Triple, Quad, Penta, Godlike kill streaks |
| Aggression Analyzer | Kill-to-movement ratio per sliding window |
| Inactivity Detector | AFK players using processing-time timers |
| Momentum Detector | Rising/falling performance trends |
| Win Predictor | Bayesian-style win probability calculation |

### Commentary System
- 🔥 **INTENSE** — Kill streaks, high aggression
- 😌 **CALM** — Defensive play, inactivity
- ⚡ **CRITICAL** — Game-changing moments
- 🎯 **CLUTCH** — Record-breaking plays
- 🚀 **HYPE** — Momentum shifts

### Dashboard Components
- **Live Commentary Feed** with emotion-tagged entries
- **Player Stats Cards** with K/D, streaks, damage
- **Battle Heatmap** (Canvas-based kill location visualization)
- **Win Probability Chart** (animated bars)
- **Event Timeline** (scrolling event log)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Event Streaming | Apache Kafka (Confluent 7.5.0) |
| Stream Processing | Apache Flink 1.18.1 (DataStream API, Java) |
| Game Simulator | Node.js 20 + KafkaJS |
| Backend API | Node.js 20 + Express + WebSocket |
| Frontend | React 18 + Vite 5 |
| TTS | Python 3.11 + pyttsx3 |
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx (production frontend) |

---

## 📁 Project Structure

```
BDA-Flink+Kafka/
├── docker-compose.yml          # Orchestrates all 9 services
├── .env                        # Environment variables
├── README.md
│
├── game-simulator/             # Node.js game event producer
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Kafka producer + game loop
│       ├── gameEngine.js       # Core simulation logic
│       └── players.js          # 5 AI player personalities
│
├── flink-processor/            # Java Flink streaming job
│   ├── Dockerfile              # Multi-stage: Maven build → Flink image
│   ├── pom.xml
│   └── src/main/java/com/gamecommentator/
│       ├── GameStreamProcessor.java
│       ├── models/             # GameEvent, PlayerStats, Commentary POJOs
│       ├── processors/         # 5 keyed process functions
│       └── serialization/      # Kafka de/serializers
│
├── backend-api/                # Node.js WebSocket hub
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Express + WS + Kafka consumer
│       ├── kafkaConsumer.js    # Multi-topic consumer
│       ├── commentaryEngine.js # Commentary enhancement
│       └── ttsClient.js        # TTS REST client
│
├── frontend-ui/                # React dashboard
│   ├── Dockerfile              # Multi-stage: Vite build → Nginx
│   ├── nginx.conf              # Reverse proxy config
│   ├── package.json
│   └── src/
│       ├── App.jsx             # Main layout
│       ├── App.css             # Component styles
│       ├── index.css           # Design system
│       ├── hooks/              # useWebSocket hook
│       ├── components/         # 6 dashboard components
│       └── utils/              # Constants
│
├── tts-service/                # Python TTS microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── app.py              # Flask REST API
│       ├── tts_engine.py       # pyttsx3 wrapper
│       └── audio_queue.py      # Non-blocking queue
│
└── kafka/
    └── create-topics.sh        # Topic initialization
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** installed and running
- At least **8GB RAM** allocated to Docker
- **Ports available**: 3000, 3001, 5000, 8081, 9092, 2181

### 1. Clone & Start

```bash
# Navigate to project directory
cd BDA-Flink+Kafka

# Start everything with one command
docker-compose up -d
```

If you change source code or dependency files and want a fresh rebuild, run `docker-compose up --build -d` instead.

This will:
1. Start Zookeeper + Kafka
2. Create Kafka topics (game-events, commentary, game-stats)
3. Build & start Flink cluster (JobManager + TaskManager)
4. Build the Flink Java job and submit it
5. Start the game simulator (producing events)
6. Start the backend API (WebSocket + Kafka consumer)
7. Start the TTS service
8. Build & serve the React dashboard

### 2. Access the Dashboard

| Service | URL |
|---------|-----|
| **Dashboard** | [http://localhost:3000](http://localhost:3000) |
| **Flink UI** | [http://localhost:8081](http://localhost:8081) |
| **Backend API** | [http://localhost:3001/api/health](http://localhost:3001/api/health) |
| **TTS Health** | [http://localhost:5000/health](http://localhost:5000/health) |

### 3. Stop

```bash
docker-compose down
```

---

## 📡 Services

### Game Simulator (Port: N/A - internal)
Generates game events every 500-1000ms with 5 AI players. Each player has a unique personality affecting their behavior probabilities.

### Flink Processor (Port: 8081)
DataStream job consuming `game-events`, processing through 5 parallel keyed functions, and producing `commentary` to Kafka.

### Backend API (Port: 3001)
- `GET /api/health` — Service health check
- `GET /api/stats` — Current player statistics
- `GET /api/events?limit=50` — Recent game events
- `WS /ws` — WebSocket for real-time updates

### TTS Service (Port: 5000)
- `GET /health` — Service health + queue status
- `POST /speak` — Queue text for speech (`{"text": "...", "priority": 1}`)
- `POST /stop` — Clear audio queue

### Frontend (Port: 3000)
React dashboard with Nginx reverse proxy. WebSocket connects to backend via `/ws` path.

---

## 📊 Example Commentary Output

```
🔥 INTENSE  | TRIPLE KILL! PhantomX is on fire with 3 consecutive eliminations!
🚀 HYPE     | MOMENTUM SHIFT! BlitzKrieg is heating up with 4 kills!
😌 CALM     | IronShield is playing very defensively, focusing on survival with 5 heals!
🎯 CLUTCH   | PhantomX is now the FAVORITE to win with 72% probability!
⚡ CRITICAL | ShadowBlade's incredible 4-kill streak has been ended!
😌 CALM     | DeadEye appears to be AFK! No significant activity detected.
🚀 HYPE     | DeadEye is back in action with a kill! The hiatus is over!
```

---

## 🧑‍💻 Development

### Run individual services locally:

```bash
# Game Simulator
cd game-simulator && npm install && npm start

# Backend API
cd backend-api && npm install && npm start

# TTS Service
cd tts-service && pip install -r requirements.txt && python src/app.py

# Frontend (dev mode)
cd frontend-ui && npm install && npm run dev
```

---

## 📜 License

This project is built for educational purposes as part of a Big Data Analysis (BDA) course.

---

**Built with ❤️ using Apache Flink + Kafka + React + Node.js + Python**
