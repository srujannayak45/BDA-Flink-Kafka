// ===========================
// TTS Client - Sends commentary to TTS service
// ===========================

export class TTSClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.queue = [];
    this.processing = false;
  }

  async speak(text) {
    this.queue.push(text);
    if (!this.processing) this.processQueue();
  }

  async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const text = this.queue.shift();
      try {
        const response = await fetch(`${this.baseUrl}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, priority: 1 }),
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
          console.warn(`⚠️ TTS service returned ${response.status}`);
        }
      } catch (err) {
        // TTS service might not be available, that's ok
        if (!err.message.includes('aborted')) {
          console.warn('⚠️ TTS unavailable:', err.message);
        }
      }
    }
    this.processing = false;
  }
}
