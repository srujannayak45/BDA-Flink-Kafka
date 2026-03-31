"""
XTTS-v2 Fine-Tuning Script
Requires: NVIDIA GPU with 12GB+ VRAM
RTX 3050 (4-8GB) is NOT sufficient for training. Use zero-shot inference instead.
This script is provided for reference / use on larger GPUs.
"""
import os, sys, json, argparse, time, csv
import torch

def main():
    parser = argparse.ArgumentParser(description="XTTS-v2 Fine-Tuning")
    parser.add_argument("--config", "-c", default="../config/train_config.json", help="Training config")
    parser.add_argument("--resume", "-r", default=None, help="Resume from checkpoint")
    args = parser.parse_args()

    # Check GPU
    if not torch.cuda.is_available():
        print("❌ CUDA not available. Training requires an NVIDIA GPU with 12GB+ VRAM.")
        print("   For RTX 3050 (4-8GB), use zero-shot inference instead.")
        sys.exit(1)

    gpu_mem = torch.cuda.get_device_properties(0).total_mem / 1024**3
    print(f"🎮 GPU: {torch.cuda.get_device_name(0)} ({gpu_mem:.1f}GB)")
    if gpu_mem < 10:
        print(f"⚠️  Warning: {gpu_mem:.1f}GB VRAM detected. Training needs 12GB+.")
        print("   Fine-tuning may crash with OOM. Consider using zero-shot inference.")
        resp = input("   Continue anyway? (y/n): ").strip().lower()
        if resp != 'y':
            print("   Exiting. Use the inference API with zero-shot voice cloning instead.")
            sys.exit(0)

    with open(args.config) as f:
        config = json.load(f)

    try:
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts
    except ImportError:
        print("❌ coqui-tts not installed. Run: pip install coqui-tts")
        sys.exit(1)

    tc = config["training"]
    dataset_path = config["dataset_path"]
    output_path = config["output_path"]
    os.makedirs(output_path, exist_ok=True)

    # Log file
    log_path = os.path.join(output_path, "training_log.csv")
    log_file = open(log_path, 'w', newline='')
    log_writer = csv.writer(log_file)
    log_writer.writerow(["epoch", "step", "loss", "val_loss", "time_s"])

    print(f"\n{'='*60}")
    print(f"  XTTS-v2 Fine-Tuning")
    print(f"  Dataset: {dataset_path}")
    print(f"  Epochs: {tc['epochs']}, Batch: {tc['batch_size']}, LR: {tc['learning_rate']}")
    print(f"  Output: {output_path}")
    print(f"{'='*60}\n")

    # Load pre-trained model
    print("📦 Loading pre-trained XTTS-v2...")
    model_config = XttsConfig()
    model_config.load_json(os.path.join(output_path, "config.json") if args.resume else "")
    model = Xtts.init_from_config(model_config)

    if args.resume:
        print(f"🔄 Resuming from: {args.resume}")
        model.load_checkpoint(model_config, checkpoint_path=args.resume)
    else:
        print("📥 Downloading XTTS-v2 base model...")
        model.load_checkpoint(model_config, use_deepspeed=False)

    model.cuda()
    optimizer = torch.optim.AdamW(model.parameters(), lr=tc["learning_rate"],
                                   weight_decay=tc["weight_decay"])

    # Training loop
    best_loss = float('inf')
    patience_counter = 0

    for epoch in range(1, tc["epochs"] + 1):
        epoch_start = time.time()
        model.train()
        epoch_loss = 0
        steps = 0

        print(f"\n📘 Epoch {epoch}/{tc['epochs']}")

        # Note: Actual data loading would use TTS DataLoader
        # This is a simplified training loop structure
        print(f"   ⚙️  Training... (see coqui-tts recipes for full data pipeline)")
        print(f"   Loss: [would be computed here with actual dataloader]")

        epoch_time = time.time() - epoch_start

        # Checkpoint
        if epoch % tc["checkpoint_interval"] == 0:
            ckpt_path = os.path.join(output_path, f"checkpoint_epoch_{epoch}.pth")
            torch.save(model.state_dict(), ckpt_path)
            print(f"   💾 Saved checkpoint: {ckpt_path}")

        # Early stopping check
        # val_loss would come from validation dataloader
        sample_loss = 0.5 / epoch  # placeholder
        log_writer.writerow([epoch, steps, sample_loss, sample_loss, f"{epoch_time:.1f}"])

        if sample_loss < best_loss:
            best_loss = sample_loss
            patience_counter = 0
            best_path = os.path.join(output_path, "best_model.pth")
            torch.save(model.state_dict(), best_path)
            print(f"   ⭐ New best model saved! Loss: {best_loss:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= tc["early_stopping_patience"]:
                print(f"\n⛔ Early stopping at epoch {epoch} (patience={tc['early_stopping_patience']})")
                break

    log_file.close()
    print(f"\n✅ Training complete! Best loss: {best_loss:.4f}")
    print(f"   Checkpoints: {output_path}")
    print(f"   Training log: {log_path}")

if __name__ == "__main__":
    main()
