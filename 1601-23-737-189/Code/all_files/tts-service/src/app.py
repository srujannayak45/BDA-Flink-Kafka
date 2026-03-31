"""
TTS Service - Flask REST API
XTTS-v2 voice cloning inference with sports commentary voice.
Endpoints:
  POST /speak       - Generate WAV audio from text (returns binary WAV)
  POST /speak/b64   - Generate WAV audio (returns base64-encoded)
  GET  /health      - Service health check
  POST /params      - Update voice parameters at runtime
"""
import os, logging, base64, threading, time
from flask import Flask, request, jsonify, Response

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Lazy-load engine to avoid blocking Flask startup
engine = None
engine_loading = False

def get_engine():
    global engine, engine_loading
    if engine is not None and engine.ready:
        return engine
    if engine_loading:
        return None

    engine_loading = True
    from tts_engine import XTTSEngine

    ref_path = os.environ.get('REFERENCE_AUDIO', '/app/data/reference/reference_commentary_clean.wav')
    if not os.path.exists(ref_path):
        # Try alternative paths
        alt_paths = [
            '/app/data/reference/reference_commentary.wav',
            '/app/data/audio_samples/reference_commentary.mp4',
            'data/reference/reference_commentary_clean.wav'
        ]
        for p in alt_paths:
            if os.path.exists(p):
                ref_path = p
                break

    logger.info(f"🎤 Reference audio: {ref_path}")
    engine = XTTSEngine(reference_wav=ref_path, language="en")

    def load():
        engine.load_model()
        logger.info("✅ TTS Engine ready for inference!")

    threading.Thread(target=load, daemon=True).start()
    return None

# Start loading on import
threading.Timer(2.0, get_engine).start()

@app.route('/health', methods=['GET'])
def health():
    e = get_engine()
    return jsonify({
        'status': 'ok' if e and e.ready else 'loading',
        'model': 'xtts_v2',
        'device': e.device if e else 'unknown',
        'ready': e.ready if e else False
    })

@app.route('/speak', methods=['POST'])
def speak():
    """Generate WAV audio from text. Returns binary WAV."""
    e = get_engine()
    if not e or not e.ready:
        return jsonify({'error': 'Model still loading. Try again in ~30s.'}), 503

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field'}), 400

    text = data['text']
    speed = data.get('speed', e.speed)
    temperature = data.get('temperature', e.temperature)

    logger.info(f"🎙️ Synthesizing: '{text[:80]}...'")
    wav_bytes = e.synthesize_to_wav_bytes(text, speed=speed, temperature=temperature)

    if wav_bytes is None:
        return jsonify({'error': 'Synthesis failed'}), 500

    return Response(wav_bytes, mimetype='audio/wav',
                    headers={'Content-Disposition': 'inline; filename="commentary.wav"'})

@app.route('/speak/b64', methods=['POST'])
def speak_b64():
    """Generate WAV audio, return as base64-encoded string (for WebSocket relay)."""
    e = get_engine()
    if not e or not e.ready:
        return jsonify({'error': 'Model still loading'}), 503

    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field'}), 400

    text = data['text']
    speed = data.get('speed', e.speed)
    temperature = data.get('temperature', e.temperature)

    wav_bytes = e.synthesize_to_wav_bytes(text, speed=speed, temperature=temperature)
    if wav_bytes is None:
        return jsonify({'error': 'Synthesis failed'}), 500

    b64 = base64.b64encode(wav_bytes).decode('utf-8')
    return jsonify({
        'audio_b64': b64,
        'format': 'wav',
        'sample_rate': e.sample_rate,
        'text': text
    })

@app.route('/params', methods=['POST'])
def update_params():
    """Update voice parameters at runtime."""
    e = get_engine()
    if not e:
        return jsonify({'error': 'Engine not ready'}), 503

    data = request.get_json() or {}
    allowed = ['speed', 'temperature', 'top_k', 'top_p', 'repetition_penalty']
    updated = {}
    for k in allowed:
        if k in data:
            e.set_params(**{k: data[k]})
            updated[k] = data[k]

    return jsonify({'updated': updated})

@app.route('/stop', methods=['POST'])
def stop():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('TTS_PORT', '5000'))
    logger.info(f"🔊 TTS Service starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
