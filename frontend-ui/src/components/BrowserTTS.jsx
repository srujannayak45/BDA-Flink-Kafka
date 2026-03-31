import { useEffect, useRef, useState } from 'react';

/**
 * Audio Commentary Player
 * Plays WAV audio received from XTTS-v2 TTS service via WebSocket.
 * Falls back to browser Web Speech API if no audio data available.
 */
export default function BrowserTTS({ commentary, audioQueue, consumeAudio }) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('neural'); // 'neural' (XTTS-v2) or 'browser' (Web Speech)
  const audioCtxRef = useRef(null);
  const playingRef = useRef(false);
  const queueRef = useRef([]);

  // Initialize AudioContext on first user interaction
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play WAV audio from base64 string
  const playWavB64 = async (b64Data) => {
    if (!enabled || playingRef.current) {
      // Queue it
      if (queueRef.current.length < 5) queueRef.current.push(b64Data);
      return;
    }
    try {
      playingRef.current = true;
      setPlaying(true);
      const ctx = getAudioCtx();
      const binaryStr = atob(b64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        playingRef.current = false;
        setPlaying(false);
        // Play next in queue
        if (queueRef.current.length > 0) {
          const next = queueRef.current.shift();
          playWavB64(next);
        }
      };
      source.start(0);
    } catch (e) {
      console.error('Audio playback error:', e);
      playingRef.current = false;
      setPlaying(false);
    }
  };

  // Watch for new audio data from WebSocket
  useEffect(() => {
    if (!enabled || !audioQueue || audioQueue.length === 0) return;
    const latest = audioQueue[0];
    if (latest?.audio_b64) {
      playWavB64(latest.audio_b64);
      if (consumeAudio) consumeAudio();
    }
  }, [audioQueue, enabled]);

  // Fallback: Browser Web Speech API for commentary text (when no neural audio)
  useEffect(() => {
    if (!enabled || mode !== 'browser' || commentary.length === 0) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const latest = commentary[commentary.length - 1];
    if (!latest?.text || (latest.priority || 5) < 5) return;

    const cleanText = latest.text.replace(/[^\w\s!.,?'"-]/g, '').trim();
    if (!cleanText || cleanText.length < 5) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1.05;
    utter.pitch = 0.95;
    utter.volume = 1;
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utter.voice = voice;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    synth.speak(utter);
  }, [commentary, enabled, mode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggle = () => {
    if (enabled) {
      window.speechSynthesis?.cancel();
      queueRef.current = [];
      if (audioCtxRef.current) audioCtxRef.current.close();
      audioCtxRef.current = null;
    } else {
      // Create AudioContext on user gesture
      getAudioCtx();
    }
    setEnabled(!enabled);
  };

  return (
    <div className="tts-controls">
      <button
        className={`tts-toggle ${enabled ? 'active' : ''} ${playing ? 'speaking' : ''}`}
        onClick={toggle}
        id="tts-toggle"
      >
        <span className="tts-icon">{enabled ? '🔊' : '🔇'}</span>
        <span className="tts-label">
          {enabled ? (playing ? 'Playing...' : 'Voice ON') : 'Voice OFF'}
        </span>
      </button>
      {enabled && (
        <select
          className="tts-mode-select"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          title="TTS Mode"
        >
          <option value="neural">🧠 Neural (XTTS-v2)</option>
          <option value="browser">💬 Browser TTS</option>
        </select>
      )}
    </div>
  );
}
