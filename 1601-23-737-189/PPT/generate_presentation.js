const path = require('path');
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Maloth Srujan Nayak';
pptx.subject = 'BDA Assignment 2';
pptx.title = 'Real-Time AI Cricket Commentator';
pptx.company = 'BDA Course Project';
pptx.lang = 'en-US';

const root = path.resolve(__dirname, '..', '..');
const img = (name) => path.join(root, 'images', name);

function addTitle(slide, title, subtitle) {
  slide.background = { color: 'F6F8FC' };
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.4, y: 0.3, w: 12.5, h: 0.75,
    fill: { color: '0F4C81' },
    line: { color: '0F4C81' },
    radius: 0.08
  });
  slide.addText(title, {
    x: 0.6, y: 0.43, w: 12.1, h: 0.35,
    fontSize: 24, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 0.86, w: 12.1, h: 0.4,
      fontSize: 13, color: '2F3A4A', fontFace: 'Calibri'
    });
  }
}

let slide = pptx.addSlide();
addTitle(slide, 'Real-Time AI Cricket Commentator', 'Assignment 2 Presentation | Roll No: 1601-23-737-189 | Maloth Srujan Nayak');
slide.addText('Distributed stream processing pipeline using Kafka + Flink + React + XTTS-v2', {
  x: 0.8, y: 1.5, w: 11.8, h: 0.5, fontSize: 18, color: '0F4C81', bold: true
});
slide.addImage({ path: img('frontend_dashboard.jpg'), x: 1.0, y: 2.1, w: 5.2, h: 3.4 });
slide.addImage({ path: img('system_architecture_1777743769425.png'), x: 6.4, y: 2.1, w: 5.8, h: 3.4 });

slide = pptx.addSlide();
addTitle(slide, 'Problem Statement and Objectives', 'Automate live cricket commentary with real-time analytics and voice output');
slide.addText([
  { text: '1. Simulate live cricket events in browser\n', options: { bullet: { indent: 20 } } },
  { text: '2. Stream events to Kafka and process using Flink\n', options: { bullet: { indent: 20 } } },
  { text: '3. Generate emotion-aware commentary in Node.js\n', options: { bullet: { indent: 20 } } },
  { text: '4. Convert text to speech using XTTS-v2\n', options: { bullet: { indent: 20 } } },
  { text: '5. Display live insights in React dashboard', options: { bullet: { indent: 20 } } }
], { x: 0.9, y: 1.4, w: 6.3, h: 3.6, fontSize: 16, color: '1F2937' });
slide.addImage({ path: img('cricket_game_engine_1777743926445.png'), x: 7.0, y: 1.5, w: 5.0, h: 3.8 });

slide = pptx.addSlide();
addTitle(slide, 'System Architecture', 'Microservices deployment with Kafka, Flink, Backend API, Frontend, and TTS');
slide.addImage({ path: img('system_architecture_1777743769425.png'), x: 0.7, y: 1.3, w: 12.0, h: 4.8 });

slide = pptx.addSlide();
addTitle(slide, 'Data Flow Pipeline', 'End-to-end path from gameplay event to text/audio commentary');
slide.addImage({ path: img('data_flow_pipeline_1777743783686.png'), x: 0.7, y: 1.2, w: 12.0, h: 5.0 });

slide = pptx.addSlide();
addTitle(slide, 'Flowchart: Runtime Processing Steps', 'Logical flow used in implementation');
const boxes = [
  { x: 0.8, y: 1.8, t: 'Cricket Game Event\n(WebSocket)' },
  { x: 3.3, y: 1.8, t: 'Kafka Topic\ngame-events' },
  { x: 5.8, y: 1.8, t: 'Flink Processors\n(5 analyzers)' },
  { x: 8.3, y: 1.8, t: 'Kafka Topic\ncommentary' },
  { x: 10.8, y: 1.8, t: 'Backend + TTS\nBroadcast' }
];
boxes.forEach((b, i) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: b.x, y: b.y, w: 2.1, h: 1.1,
    fill: { color: i % 2 === 0 ? 'E3F2FD' : 'FFF3E0' },
    line: { color: '0F4C81', pt: 1 }, radius: 0.05
  });
  slide.addText(b.t, { x: b.x + 0.08, y: b.y + 0.2, w: 1.95, h: 0.7, align: 'center', fontSize: 12, bold: true, color: '0F172A' });
  if (i < boxes.length - 1) {
    slide.addShape(pptx.ShapeType.chevron, {
      x: b.x + 2.15, y: b.y + 0.4, w: 0.25, h: 0.3,
      fill: { color: '0F4C81' }, line: { color: '0F4C81' }
    });
  }
});
slide.addImage({ path: img('kafka_event_flow_1777743860188.png'), x: 1.1, y: 3.5, w: 5.1, h: 2.1 });
slide.addImage({ path: img('websocket_realtime_1777743907214.png'), x: 6.8, y: 3.5, w: 5.1, h: 2.1 });

slide = pptx.addSlide();
addTitle(slide, 'Apache Flink Analytics', 'Five parallel processors with stateful/event-time analysis');
slide.addImage({ path: img('flink_processing_1777743825933.png'), x: 0.8, y: 1.5, w: 6.2, h: 3.8 });
slide.addText('Processors:\n• Kill Streak Detector\n• Aggression Analyzer\n• Inactivity Detector\n• Momentum Detector\n• Win Predictor', {
  x: 7.2, y: 1.8, w: 5.0, h: 2.9, fontSize: 16, color: '1F2937'
});

slide = pptx.addSlide();
addTitle(slide, 'Frontend and Commentary Experience', 'Live field, dashboard, and emotion-aware commentary feed');
slide.addImage({ path: img('frontend_cricket_field.jpg'), x: 0.8, y: 1.5, w: 5.8, h: 3.9 });
slide.addImage({ path: img('frontend_dashboard.jpg'), x: 6.8, y: 1.5, w: 5.6, h: 3.9 });

slide = pptx.addSlide();
addTitle(slide, 'Text-to-Speech Voice Pipeline', 'XTTS-v2 zero-shot voice cloning for commentary audio');
slide.addImage({ path: img('tts_voice_pipeline_1777743843494.png'), x: 0.8, y: 1.5, w: 6.2, h: 3.8 });
slide.addText('Key points:\n• Flask API endpoints: /speak, /speak/b64\n• Reference-audio-based voice cloning\n• Audio delivered via WebSocket\n• Browser playback with AudioContext', {
  x: 7.2, y: 1.8, w: 5.1, h: 2.8, fontSize: 14, color: '1F2937'
});

slide = pptx.addSlide();
addTitle(slide, 'Results and Performance', 'Observed latency and throughput summary');
slide.addShape(pptx.ShapeType.roundRect, {
  x: 0.9, y: 1.6, w: 11.8, h: 3.7,
  fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', pt: 1 }
});
slide.addText('Latency Highlights', { x: 1.2, y: 1.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: '0F4C81' });
slide.addText('• End-to-end text commentary: 80-280 ms\n• TTS on CPU: 2-5 seconds\n• Kafka publish: <10 ms\n• Flink processing: 50-200 ms\n• WebSocket broadcast: <20 ms', {
  x: 1.2, y: 2.4, w: 5.3, h: 2.5, fontSize: 14, color: '1F2937'
});
slide.addText('Outcome', { x: 7.0, y: 1.9, w: 4.0, h: 0.5, fontSize: 18, bold: true, color: '0F4C81' });
slide.addText('Real-time dashboard commentary achieved with robust distributed architecture and clear extensibility for GPU-accelerated TTS.', {
  x: 7.0, y: 2.4, w: 4.9, h: 2.0, fontSize: 14, color: '1F2937'
});

slide = pptx.addSlide();
addTitle(slide, 'Deployment and Execution', 'Dockerized services and commands used during project execution');
slide.addImage({ path: img('docker_architecture_1777743798253.png'), x: 0.8, y: 1.5, w: 6.3, h: 3.7 });
slide.addText('Core commands:\n• docker compose up --build -d\n• docker compose logs -f backend-api\n• docker compose ps\n• docker compose down', {
  x: 7.3, y: 1.8, w: 4.8, h: 2.0, fontSize: 14, color: '1F2937'
});

slide = pptx.addSlide();
addTitle(slide, 'Conclusion and Future Scope', 'Scalable reference architecture for AI-powered live sports commentary');
slide.addText('Future enhancements:\n• GPU inference for near real-time TTS\n• LLM-assisted dynamic commentary\n• Multilingual narration\n• Cloud-native scaling with Kubernetes', {
  x: 0.9, y: 1.6, w: 6.2, h: 2.6, fontSize: 16, color: '1F2937'
});
slide.addImage({ path: img('frontend_component_tree_1777743959998.png'), x: 7.0, y: 1.4, w: 5.2, h: 3.9 });
slide.addText('Thank You', { x: 0.9, y: 4.8, w: 3.0, h: 0.6, fontSize: 28, bold: true, color: '0F4C81' });

pptx.writeFile({ fileName: path.join(__dirname, 'AI_Cricket_Commentator_Assignment2.pptx') })
  .then(() => {
    console.log('Presentation generated successfully.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
