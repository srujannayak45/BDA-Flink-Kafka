"""
Dataset Preparation - Segments audio and creates LJSpeech-format dataset.
Uses faster-whisper for auto-transcription.
"""
import os, sys, subprocess, argparse, csv

def ensure_deps():
    try:
        import soundfile
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "soundfile", "pydub"])

ensure_deps()
import soundfile as sf
import numpy as np

def segment_audio(wav_path, output_dir, min_dur=3.0, max_dur=15.0):
    """Split audio into segments based on silence detection."""
    os.makedirs(output_dir, exist_ok=True)
    data, sr = sf.read(wav_path, dtype='float32')
    total_dur = len(data) / sr

    if total_dur <= max_dur:
        out_path = os.path.join(output_dir, "segment_0001.wav")
        sf.write(out_path, data, sr)
        return [("segment_0001", out_path)]

    # Simple energy-based segmentation
    segments = []
    frame_size = int(0.025 * sr)
    hop = int(0.01 * sr)
    energy = []
    for i in range(0, len(data) - frame_size, hop):
        energy.append(np.sqrt(np.mean(data[i:i+frame_size]**2)))
    energy = np.array(energy)
    threshold = np.percentile(energy, 15)

    # Find silence regions
    is_silent = energy < threshold
    seg_start = 0
    seg_idx = 0
    i = 0
    while i < len(is_silent):
        # Find silence gap
        if is_silent[i]:
            gap_start = i
            while i < len(is_silent) and is_silent[i]:
                i += 1
            gap_center = (gap_start + i) // 2
            time_pos = gap_center * hop / sr
            seg_time = time_pos - (seg_start * hop / sr if seg_idx > 0 else 0)
            if seg_time >= min_dur:
                start_sample = seg_start * hop
                end_sample = gap_center * hop
                seg_data = data[start_sample:end_sample]
                if len(seg_data) / sr >= min_dur:
                    seg_idx += 1
                    name = f"segment_{seg_idx:04d}"
                    out_path = os.path.join(output_dir, f"{name}.wav")
                    sf.write(out_path, seg_data, sr)
                    segments.append((name, out_path))
                seg_start = gap_center
        else:
            i += 1

    # Last segment
    remaining = data[seg_start * hop:]
    if len(remaining) / sr >= min_dur:
        seg_idx += 1
        name = f"segment_{seg_idx:04d}"
        out_path = os.path.join(output_dir, f"{name}.wav")
        sf.write(out_path, remaining, sr)
        segments.append((name, out_path))

    return segments

def transcribe_segments(segments):
    """Auto-transcribe using faster-whisper if available, else use placeholders."""
    try:
        from faster_whisper import WhisperModel
        print("🎤 Using faster-whisper for transcription...")
        model = WhisperModel("base", device="cpu", compute_type="int8")
        results = []
        for name, path in segments:
            segs, _ = model.transcribe(path, language="en")
            text = " ".join(s.text.strip() for s in segs)
            results.append((name, text or "[inaudible]"))
            print(f"  📝 {name}: {text[:80]}...")
        return results
    except ImportError:
        print("⚠️  faster-whisper not installed. Using placeholder transcriptions.")
        placeholders = [
            "Dhoni finishes off in style, a magnificent strike.",
            "What a shot, the crowd goes absolutely wild.",
            "India wins the World Cup, an incredible moment.",
            "The ball sails over the boundary for six.",
            "And that is the winning moment, unbelievable scenes."
        ]
        return [(name, placeholders[i % len(placeholders)]) for i, (name, _) in enumerate(segments)]

def create_metadata(segments_with_text, output_dir):
    """Create LJSpeech-format metadata.csv."""
    csv_path = os.path.join(output_dir, "metadata.csv")
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='|')
        for name, text in segments_with_text:
            writer.writerow([name, text, text])
    print(f"✅ Created metadata: {csv_path} ({len(segments_with_text)} entries)")
    return csv_path

def main():
    parser = argparse.ArgumentParser(description="Dataset Preparation (LJSpeech format)")
    parser.add_argument("--input", "-i", default="../data/reference", help="Directory with clean WAV files")
    parser.add_argument("--output", "-o", default="../data/dataset", help="Output dataset directory")
    args = parser.parse_args()

    wavs_dir = os.path.join(args.output, "wavs")
    os.makedirs(wavs_dir, exist_ok=True)

    wav_files = [f for f in os.listdir(args.input) if f.endswith(".wav")]
    if not wav_files:
        print("❌ No WAV files found in input directory!")
        return

    all_segments = []
    for wf in wav_files:
        print(f"\n🔪 Segmenting: {wf}")
        segs = segment_audio(os.path.join(args.input, wf), wavs_dir)
        print(f"  → {len(segs)} segments created")
        all_segments.extend(segs)

    print(f"\n🎤 Transcribing {len(all_segments)} segments...")
    transcribed = transcribe_segments(all_segments)
    create_metadata(transcribed, args.output)

if __name__ == "__main__":
    main()
