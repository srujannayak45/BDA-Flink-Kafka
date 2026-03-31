FROM python:3.11-slim

# Install system deps for audio processing
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 libsndfile1-dev \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps (coqui-tts is large, ~1GB)
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy source and data
COPY src/ ./src/
COPY config/ ./config/
COPY data/ ./data/
COPY scripts/ ./scripts/

EXPOSE 5000

# XTTS-v2 model downloads on first run (~1.8GB, cached in /root/.local)
ENV COQUI_TOS_AGREED=1
ENV TTS_PORT=5000
ENV REFERENCE_AUDIO=/app/data/reference/reference_commentary_clean.wav

CMD ["python", "src/app.py"]
