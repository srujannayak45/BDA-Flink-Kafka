# Important Code Document

## Project
- Title: Real-Time AI Cricket Commentator
- Roll No: 1601-23-737-189
- Student: Maloth Srujan Nayak

## 1) Docker Orchestration (Service Topology)
Source: `docker-compose.yml`

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
  kafka:
    image: confluentinc/cp-kafka:7.5.0
  jobmanager:
    build:
      context: ./flink-processor
  taskmanager:
    build:
      context: ./flink-processor
  backend-api:
    build:
      context: ./backend-api
  tts-service:
    build:
      context: ./tts-service
  frontend-ui:
    build:
      context: ./frontend-ui
```

Why important:
- Defines full microservice pipeline and startup dependencies.
- Connects Kafka, Flink, Backend, TTS, and Frontend.

## 2) Backend Main Server (Express + WebSocket + Kafka Producer)
Source: `backend-api/src/index.js`

```javascript
wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === 'game_event' && msg.data) {
      const event = msg.data;
      await producer.send({
        topic: 'game-events',
        messages: [{
          key: event.player_id || 'player',
          value: JSON.stringify(event),
          timestamp: String(event.timestamp || Date.now())
        }]
      });

      updatePlayerStats(event);
      broadcast('game_event', event);
      broadcast('player_stats', Object.values(playerStats));

      const commentary = commentaryEngine.generateCricketCommentary(event);
      if (commentary) {
        broadcast('commentary', commentary);
        generateAudio(commentary.text, commentary.priority);
      }
    }
  });
});
```

Why important:
- Entry point for real-time gameplay events.
- Pushes event stream to Kafka and sends live updates to frontend clients.

## 3) Commentary Engine (Event -> Text + Emotion)
Source: `backend-api/src/commentaryEngine.js`

```javascript
generateCricketCommentary(event) {
  let text = '';
  let emotion = 'CALM';
  let priority = 5;

  switch (event.action) {
    case 'runs': {
      const runs = event.details?.runs || 0;
      if (runs === 6) { text = this.pick(CRICKET_COMMENTARY.runs_6); emotion = 'INTENSE'; priority = 9; }
      else if (runs === 4) { text = this.pick(CRICKET_COMMENTARY.runs_4); emotion = 'HYPE'; priority = 8; }
      else if (runs >= 2) { text = this.pick(CRICKET_COMMENTARY.runs_2); }
      else { text = this.pick(CRICKET_COMMENTARY.runs_1); priority = 4; }
      break;
    }
    case 'wicket':
      text = this.pick(CRICKET_COMMENTARY.wicket_bowled);
      emotion = 'CRITICAL';
      priority = 10;
      break;
    case 'dot_ball':
      text = this.pick(CRICKET_COMMENTARY.dot_ball);
      priority = 3;
      break;
    default:
      return null;
  }

  return { text, emotion, priority, timestamp: Date.now() };
}
```

Why important:
- Converts structured match events into human-readable commentary.
- Assigns emotion/priority for UI highlight and TTS decisions.

## 4) Kafka Consumer Manager (Backend)
Source: `backend-api/src/kafkaConsumer.js`

```javascript
const gameConsumer = this.kafka.consumer({ groupId: 'backend-game-events' });
await gameConsumer.connect();
await gameConsumer.subscribe({ topic: 'game-events', fromBeginning: false });
await gameConsumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    this.emit('game-event', event);
  }
});
```

Why important:
- Reads published stream events and commentary topic updates.
- Decouples ingestion and broadcast pipeline.

## 5) Flink Stream Job (Core Analytics Pipeline)
Source: `flink-processor/src/main/java/com/gamecommentator/GameStreamProcessor.java`

```java
DataStream<GameEvent> gameEvents = env.fromSource(
    source,
    WatermarkStrategy.<GameEvent>forBoundedOutOfOrderness(Duration.ofSeconds(2))
        .withTimestampAssigner((event, timestamp) -> event != null ? event.timestamp : System.currentTimeMillis()),
    "KafkaGameEvents"
).uid("kafka-source").filter(event -> event != null).uid("null-filter");

SingleOutputStreamOperator<Commentary> killStreakCommentary = gameEvents
    .keyBy(event -> event.playerId)
    .process(new KillStreakDetector());

DataStream<Commentary> allCommentary = killStreakCommentary
    .union(aggressionCommentary)
    .union(inactivityCommentary)
    .union(momentumCommentary)
    .union(predictionCommentary);

allCommentary.sinkTo(commentarySink);
```

Why important:
- Implements event-time stream processing with watermarks.
- Merges outputs of five parallel analyzers into commentary stream.

## 6) Stateful Flink Processor Example (Kill Streak)
Source: `flink-processor/src/main/java/com/gamecommentator/processors/KillStreakDetector.java`

```java
private transient ValueState<Integer> currentStreakState;

@Override
public void processElement(GameEvent event, Context ctx, Collector<Commentary> out) throws Exception {
    if (event.isKill()) {
        int currentStreak = currentStreakState.value() + 1;
        currentStreakState.update(currentStreak);

        if (currentStreak >= 2) {
            Commentary commentary = generateStreakCommentary(event, currentStreak);
            if (commentary != null) {
                out.collect(commentary);
            }
        }

        ctx.timerService().registerProcessingTimeTimer(event.timestamp + STREAK_TIMEOUT_MS);
    }
}
```

Why important:
- Demonstrates Flink keyed state and timer-based logic.
- Produces context-sensitive commentary from event history.

## 7) Frontend Cricket Simulator (Canvas + Event Emission)
Source: `frontend-ui/src/components/CricketGame.jsx`

```javascript
const emitEvent = useCallback((action, details) => {
  sendEvent({
    match_id: s.matchId,
    player_id: 'batsman_1',
    player_name: 'You',
    action,
    timestamp: Date.now(),
    details
  });
}, [sendEvent]);

if (runs > 0) {
  s.score.runs += runs;
  emitEvent('runs', { runs, timing, shot_type: timing === 'perfect' ? 'drive' : 'defense' });
}
```

Why important:
- Generates gameplay events and pushes them in real-time.
- Feeds the analytics pipeline with structured event data.

## 8) Frontend WebSocket Hook
Source: `frontend-ui/src/hooks/useWebSocket.js`

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'commentary':
      setCommentary(prev => [...prev, msg.data]);
      break;
    case 'player_stats':
      setPlayerStats(msg.data || []);
      break;
    case 'audio':
      if (msg.data?.audio_b64) {
        setAudioQueue(prev => [...prev, msg.data]);
      }
      break;
  }
};
```

Why important:
- Maintains live UI synchronization for text, stats, and audio.
- Handles reconnection and streaming robustness.

## 9) TTS Service API (Flask)
Source: `tts-service/src/app.py`

```python
@app.route('/speak/b64', methods=['POST'])
def speak_b64():
    e = get_engine()
    if not e or not e.ready:
        return jsonify({'error': 'Model still loading'}), 503

    data = request.get_json()
    text = data['text']
    wav_bytes = e.synthesize_to_wav_bytes(text, speed=data.get('speed', e.speed), temperature=data.get('temperature', e.temperature))
    b64 = base64.b64encode(wav_bytes).decode('utf-8')
    return jsonify({'audio_b64': b64, 'format': 'wav', 'sample_rate': e.sample_rate, 'text': text})
```

Why important:
- Converts commentary text into playable speech payload.
- Enables backend relay to browsers through WebSocket.

## 10) Complete Code Copy
- Full code/config copy is available in this folder:
  - `Code/all_files/`
- It includes backend, frontend, Flink processor source, simulator, TTS service, Docker and project configs.
