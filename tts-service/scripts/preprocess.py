"""
Audio Preprocessing Pipeline (Python 3.13 compatible)
- Extract audio from MP4/MP3 using ffmpeg or soundfile
- Convert to WAV (22050Hz mono for XTTS-v2)
- Noise reduction
- Silence trimming
- Amplitude normalization
"""
import os, sys, subprocess, argparse
import numpy as np
import soundfile as sf
import noisereduce as nr

SAMPLE_RATE = 22050

def extract_audio_ffmpeg(input_path, output_path):
    """Extract audio from video/audio file using ffmpeg."""
    cmd = ["ffmpeg", "-y", "-i", input_path, "-vn", "-acodec", "pcm_s16le",
           "-ar", str(SAMPLE_RATE), "-ac", "1", output_path]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"  [OK] Extracted audio -> {output_path}")
        return True
    except FileNotFoundError:
        print("  [WARN] ffmpeg not found! Please install ffmpeg.")
        print("  Windows: winget install ffmpeg")
        print("  Or download from https://ffmpeg.org/download.html")
        return False
    except subprocess.CalledProcessError as e:
        print(f"  [ERR] ffmpeg error: {e.stderr[:200]}")
        return False

def remove_noise(audio_data, sr):
    """Apply noise reduction."""
    return nr.reduce_noise(y=audio_data, sr=sr, prop_decrease=0.7, stationary=True)

def trim_silence(audio_data, sr, threshold_db=-40):
    """Trim leading/trailing silence."""
    threshold = 10 ** (threshold_db / 20)
    abs_audio = np.abs(audio_data)
    max_val = np.max(abs_audio)
    if max_val == 0:
        return audio_data
    above = abs_audio > threshold * max_val
    indices = np.where(above)[0]
    if len(indices) == 0:
        return audio_data
    pad = int(0.1 * sr)  # 100ms padding
    start = max(0, indices[0] - pad)
    end = min(len(audio_data), indices[-1] + pad)
    return audio_data[start:end]

def normalize(audio_data, target_db=-3):
    """Normalize amplitude."""
    max_val = np.max(np.abs(audio_data))
    if max_val == 0:
        return audio_data
    target = 10 ** (target_db / 20)
    return audio_data * (target / max_val)

def process_file(input_path, output_dir):
    """Full preprocessing pipeline for one file."""
    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.splitext(os.path.basename(input_path))[0]
    ext = os.path.splitext(input_path)[1].lower()
    wav_path = os.path.join(output_dir, f"{basename}.wav")

    # Step 1: Convert to WAV using ffmpeg
    if ext in [".mp4", ".mp3", ".m4a", ".ogg", ".flac", ".webm", ".wav"]:
        print(f"[EXTRACT] Converting {ext} -> WAV ({SAMPLE_RATE}Hz mono)...")
        if not extract_audio_ffmpeg(input_path, wav_path):
            return None
    else:
        print(f"[ERR] Unsupported format: {ext}")
        return None

    # Step 2: Load and process
    print("[PROCESS] Removing noise...")
    data, sr = sf.read(wav_path, dtype='float32')
    if len(data.shape) > 1:
        data = data[:, 0]  # mono

    data = remove_noise(data, sr)

    print("[PROCESS] Trimming silence...")
    data = trim_silence(data, sr)

    print("[PROCESS] Normalizing amplitude...")
    data = normalize(data)

    # Step 3: Save processed
    processed_path = os.path.join(output_dir, f"{basename}_clean.wav")
    sf.write(processed_path, data, SAMPLE_RATE)

    duration = len(data) / sr
    print(f"[OK] Processed: {processed_path} ({duration:.1f}s, {SAMPLE_RATE}Hz mono)")
    return processed_path

def main():
    parser = argparse.ArgumentParser(description="Audio Preprocessing Pipeline")
    parser.add_argument("--input", "-i", default="../data/audio_samples", help="Input file or directory")
    parser.add_argument("--output", "-o", default="../data/reference", help="Output directory")
    args = parser.parse_args()

    if os.path.isfile(args.input):
        process_file(args.input, args.output)
    elif os.path.isdir(args.input):
        exts = {".mp4",".mp3",".wav",".m4a",".ogg",".flac",".webm"}
        files = [f for f in os.listdir(args.input) if os.path.splitext(f)[1].lower() in exts]
        if not files:
            print("[ERR] No audio files found!")
            return
        for f in files:
            print(f"\n{'='*50}\nProcessing: {f}\n{'='*50}")
            process_file(os.path.join(args.input, f), args.output)
    else:
        print(f"[ERR] Path not found: {args.input}")

if __name__ == "__main__":
    main()
