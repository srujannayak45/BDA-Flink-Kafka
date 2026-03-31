# Custom Sports Commentary Voice Engine

XTTS-v2 based voice cloning system for real-time cricket commentary.

## Architecture

```
Cricket Game → Backend → Commentary Engine → TTS Service (XTTS-v2)
                                                    ↓
                                              WAV Audio (base64)
                                                    ↓
                                        WebSocket → Browser (AudioContext playback)
```

## Quick Start (Docker)

```bash
# 1. Preprocess reference audio (run once)
cd tts-service/scripts
pip install soundfile noisereduce pydub scipy
python preprocess.py -i ../data/audio_samples -o ../data/reference

# 2. Start everything
cd ../..
docker-compose up --build -d

# 3. Open dashboard
# http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service status + model readiness |
| `/speak` | POST | Generate WAV audio (binary response) |
| `/speak/b64` | POST | Generate WAV audio (base64 JSON response) |
| `/params` | POST | Update voice params at runtime |

### Example: Generate Audio

```bash
curl -X POST http://localhost:5001/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "What a magnificent six!", "speed": 1.1}' \
  --output commentary.wav
```

### Runtime Parameters

```bash
curl -X POST http://localhost:5001/params \
  -H "Content-Type: application/json" \
  -d '{"speed": 1.2, "temperature": 0.7}'
```

## Training (Optional - Requires 12GB+ VRAM GPU)

RTX 3050 cannot fine-tune. Use zero-shot voice cloning instead.

```bash
# 1. Prepare dataset
cd tts-service/scripts
python prepare_dataset.py -i ../data/reference -o ../data/dataset

# 2. Train (requires RTX 3090/4080+ or cloud GPU)
python train.py --config ../config/train_config.json
```

## Voice Controls

| Parameter | Default | Description |
|-----------|---------|-------------|
| `speed` | 1.1 | Speech rate (0.5-2.0) |
| `temperature` | 0.65 | Randomness (lower = more consistent) |
| `top_k` | 50 | Top-k sampling |
| `top_p` | 0.85 | Nucleus sampling |

## Files

```
tts-service/
├── src/
│   ├── app.py              # Flask REST API
│   └── tts_engine.py       # XTTS-v2 engine
├── scripts/
│   ├── preprocess.py       # Audio preprocessing
│   ├── prepare_dataset.py  # Dataset formatter
│   └── train.py            # Fine-tuning script
├── config/
│   └── train_config.json   # Training configuration
├── data/
│   ├── audio_samples/      # Raw audio files
│   ├── reference/          # Processed reference WAVs
│   └── dataset/            # LJSpeech-format dataset
├── Dockerfile
├── requirements.txt
└── README_TTS.md
```

## Notes

- First run downloads XTTS-v2 model (~1.8GB). Cached in Docker volume.
- Model loads in ~30-60s on CPU, ~10-15s on GPU.
- Audio generation: ~2-5s per sentence on CPU, <1s on GPU.
- RTX 3050 can run inference via GPU passthrough (needs nvidia-container-toolkit).
