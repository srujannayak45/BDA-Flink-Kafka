# Real-Time AI Cricket Commentator with Voice Output

## Assignment 2 Project Report

### Student Details
- Name: Maloth Srujan Nayak
- Roll No: 1601-23-737-189
- Course: Big Data Analytics (BDA)
- Project Title: Real-Time AI Cricket Commentator with Voice Output

## 1. Abstract
This project presents an end-to-end real-time streaming system that simulates cricket gameplay events, processes them using Apache Kafka and Apache Flink, generates context-aware AI commentary, and delivers both text and voice output to users through a live React dashboard. The architecture follows a microservices design and is deployed using Docker Compose. The system demonstrates low-latency event processing, parallel analytics over streams, WebSocket-based real-time delivery, and speech synthesis integration for immersive user interaction.

## 2. Problem Statement
Traditional live sports commentary requires skilled human commentators and dedicated broadcasting infrastructure. Many local or practice-level matches cannot afford this setup. The goal of this project is to automate live cricket commentary generation with:
- Real-time event ingestion
- Stream processing with meaningful analytics
- Emotion-tagged commentary generation
- Live dashboard visualization
- Voice narration through TTS

## 3. Objectives
- Build an interactive cricket event source from the browser.
- Stream events reliably through Kafka topics.
- Process events using Flink analyzers in parallel.
- Generate contextual commentary from game state and trends.
- Broadcast updates to frontend clients in real time.
- Convert important commentary to voice output.
- Containerize all services for reproducible deployment.

## 4. System Architecture
The project follows a distributed pipeline:
1. Frontend cricket game emits events over WebSocket.
2. Backend API forwards events to Kafka topic `game-events`.
3. Flink consumes the stream and runs multiple analyzers.
4. Processed commentary is published to Kafka topic `commentary`.
5. Backend consumes commentary and broadcasts to connected clients.
6. High-priority commentary is sent to TTS service.
7. Frontend displays text feed and plays generated audio.

### Core Components
- Frontend UI: React + Vite dashboard and game view
- Backend API: Node.js + Express + WebSocket + KafkaJS
- Stream Processor: Apache Flink (Java DataStream API)
- Message Broker: Apache Kafka + Zookeeper
- TTS Service: Python Flask-based voice synthesis service
- Deployment: Docker Compose

## 5. Technology Stack
| Layer | Technology | Purpose |
|------|------------|---------|
| Event Streaming | Apache Kafka | Decoupled, durable event transport |
| Stream Processing | Apache Flink | Stateful real-time analytics |
| Backend | Node.js, Express, ws, KafkaJS | Event routing and API/WebSocket hub |
| Frontend | React, Vite | Interactive visualization dashboard |
| Voice | Python, Flask, TTS engine | Speech generation for commentary |
| Containerization | Docker, Docker Compose | Multi-service orchestration |

## 6. Kafka Topics and Data Flow
### Topics
- `game-events`: Raw gameplay events from frontend/backend producer.
- `commentary`: Analytics-driven commentary emitted by Flink.
- `game-stats`: Aggregated player statistics.

### Event Flow Summary
- User actions in frontend create structured game event messages.
- Backend validates and publishes events to Kafka.
- Flink consumes and analyzes streams by player context and time.
- Commentary events are generated and pushed downstream.
- Backend relays commentary to UI and calls TTS for key messages.

## 7. Flink Processing Design
The Flink processor is organized into parallel analyzers, each focused on a specific behavior pattern:
- Kill/Streak detector: identifies rapid impactful sequences.
- Aggression analyzer: evaluates action intensity trends.
- Inactivity detector: flags idle or low-activity phases.
- Momentum detector: captures swings in performance.
- Win predictor: estimates likely match outcome from evolving state.

These analyzers produce commentary signals that are merged and sent to Kafka for downstream consumption.

## 8. Backend and Commentary Engine
The backend service provides three key roles:
- WebSocket gateway for live bidirectional frontend communication.
- Kafka producer/consumer bridge for event and commentary streams.
- Commentary enhancement and broadcast manager.

It also maintains in-memory player statistics and exposes REST endpoints:
- `/api/health`
- `/api/stats`
- `/api/events`

For important messages, backend invokes the TTS service and sends audio payloads to frontend clients.

## 9. Frontend Dashboard
The frontend offers a real-time cricket and analytics experience with:
- Live commentary feed
- Player stats cards
- Event timeline
- Win prediction panel
- Battle/impact heatmap visualization
- Browser-side audio playback for synthesized commentary

The design supports continuous updates from WebSocket streams without page refresh.

## 10. Text-to-Speech Integration
The TTS microservice receives commentary text via HTTP and returns audio output for playback. This enables voice-assisted commentary and improves accessibility and engagement. A readiness check is used so backend can gracefully skip TTS when service is still loading.

## 11. Deployment and Execution
Run from the project root:

```powershell
cd C:\Users\sruja\Documents\BDA-Flink+Kafka
docker compose up --build -d
docker compose ps
```

Important service URLs:
- Frontend UI: http://localhost:3000
- Backend Health: http://localhost:3001/api/health
- Flink Dashboard: http://localhost:8081
- TTS Health: http://localhost:5001/health

To stop:

```powershell
docker compose down
```

## 12. Results and Observations
- Real-time end-to-end flow is functional across all major services.
- Commentary appears with low latency on the dashboard.
- Flink job processes event streams continuously with checkpoint support.
- TTS adds audio narration, with occasional startup delay due to model load.
- Containerized setup improves reproducibility and simplifies demonstration.

## 13. Challenges Faced
- Synchronizing multiple services during startup.
- Managing stream schema consistency across producer and consumers.
- Balancing commentary quality with low-latency requirements.
- Handling TTS warm-up and resource usage in local environments.

## 14. Future Enhancements
- Add multi-language commentary generation and voice profiles.
- Integrate richer ML-based win prediction and adaptive templates.
- Persist long-term analytics in a database for post-match insights.
- Add authentication and user-specific match sessions.
- Optimize TTS latency with model caching and batching.

## 15. Conclusion
This project demonstrates a practical and scalable real-time analytics system for automated cricket commentary. By combining Kafka, Flink, Node.js, React, and Python TTS in a containerized architecture, it delivers an effective example of modern stream processing, event-driven design, and human-friendly output through both text and speech.

## 16. References
- Apache Kafka Documentation: https://kafka.apache.org/documentation/
- Apache Flink Documentation: https://nightlies.apache.org/flink/
- React Documentation: https://react.dev/
- Docker Documentation: https://docs.docker.com/
- Coqui TTS Documentation: https://docs.coqui.ai/
