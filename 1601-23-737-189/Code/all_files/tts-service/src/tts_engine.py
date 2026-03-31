"""
TTS Engine - XTTS-v2 Zero-Shot Voice Cloning
Uses reference audio to clone voice characteristics.
"""
import os, io, logging, time, threading
import torch
import numpy as np

logger = logging.getLogger(__name__)

class XTTSEngine:
    def __init__(self, reference_wav=None, language="en", device=None):
        self.language = language
        self.model = None
        self.gpt_cond_latent = None
        self.speaker_embedding = None
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.lock = threading.Lock()
        self.ready = False
        self.reference_wav = reference_wav
        self.sample_rate = 24000  # XTTS-v2 output rate

        # Inference params (tuned for sports commentary)
        self.temperature = 0.65
        self.length_penalty = 1.0
        self.repetition_penalty = 2.0
        self.top_k = 50
        self.top_p = 0.85
        self.speed = 1.1  # Slightly faster for energetic commentary

        logger.info(f"🎮 Device: {self.device}")
        if self.device == "cuda":
            logger.info(f"   GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"   VRAM: {torch.cuda.get_device_properties(0).total_mem/1024**3:.1f}GB")

    def load_model(self):
        """Load XTTS-v2 model and compute speaker embedding from reference audio."""
        try:
            from TTS.api import TTS as CoquiTTS
            logger.info("📦 Loading XTTS-v2 model (this may take a minute on first run)...")
            start = time.time()

            self.tts = CoquiTTS("tts_models/multilingual/multi-dataset/xtts_v2").to(self.device)
            load_time = time.time() - start
            logger.info(f"✅ Model loaded in {load_time:.1f}s")

            # Pre-compute speaker embedding if reference audio exists
            if self.reference_wav and os.path.exists(self.reference_wav):
                logger.info(f"🎤 Computing speaker embedding from: {self.reference_wav}")
                self._compute_speaker_embedding()
            else:
                logger.warning(f"⚠️  No reference audio found at: {self.reference_wav}")
                logger.warning("   Will use default XTTS-v2 voice.")

            self.ready = True
            return True

        except ImportError as e:
            logger.error(f"❌ coqui-tts not installed! Error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False

    def _compute_speaker_embedding(self):
        """Pre-compute speaker conditioning for faster inference."""
        try:
            # XTTS-v2 computes conditioning internally when given speaker_wav
            # We just validate the file here
            import soundfile as sf
            data, sr = sf.read(self.reference_wav)
            duration = len(data) / sr
            logger.info(f"   Reference audio: {duration:.1f}s at {sr}Hz")
            if duration < 3:
                logger.warning("   ⚠️  Reference audio is very short (<3s). Quality may suffer.")
            elif duration > 30:
                logger.info("   ℹ️  Long reference audio. XTTS-v2 will use first ~30s.")
        except Exception as e:
            logger.error(f"   ❌ Error reading reference audio: {e}")

    def synthesize(self, text, speed=None, temperature=None):
        """Generate speech from text using XTTS-v2 voice cloning.
        Returns: (wav_data as numpy array, sample_rate)
        """
        if not self.ready:
            logger.error("Model not loaded!")
            return None, self.sample_rate

        speed = speed or self.speed
        temp = temperature or self.temperature

        with self.lock:
            try:
                start = time.time()

                if self.reference_wav and os.path.exists(self.reference_wav):
                    wav = self.tts.tts(
                        text=text,
                        speaker_wav=self.reference_wav,
                        language=self.language,
                        speed=speed,
                        temperature=temp
                    )
                else:
                    # No reference - use default voice
                    wav = self.tts.tts(text=text, language=self.language, speed=speed)

                gen_time = time.time() - start
                duration = len(wav) / self.sample_rate
                rtf = gen_time / duration if duration > 0 else 0
                logger.info(f"🔊 Generated {duration:.1f}s audio in {gen_time:.1f}s (RTF: {rtf:.2f})")

                return np.array(wav, dtype=np.float32), self.sample_rate

            except Exception as e:
                logger.error(f"❌ Synthesis error: {e}")
                return None, self.sample_rate

    def synthesize_to_wav_bytes(self, text, speed=None, temperature=None):
        """Generate speech and return as WAV bytes."""
        import soundfile as sf
        wav_data, sr = self.synthesize(text, speed, temperature)
        if wav_data is None:
            return None

        buf = io.BytesIO()
        sf.write(buf, wav_data, sr, format='WAV', subtype='PCM_16')
        buf.seek(0)
        return buf.read()

    def set_params(self, **kwargs):
        """Update inference parameters at runtime."""
        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)
                logger.info(f"  Updated {k} = {v}")
