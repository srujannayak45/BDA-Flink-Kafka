// ===========================
// WebSocket Hook - Real-time bidirectional connection
// ===========================

import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [commentary, setCommentary] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [gameEvents, setGameEvents] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [audioQueue, setAudioQueue] = useState([]);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const MAX_COMMENTARY = 100;
  const MAX_EVENTS = 200;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('✅ WebSocket connected');
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'commentary':
              setCommentary(prev => {
                const next = [...prev, msg.data];
                return next.length > MAX_COMMENTARY ? next.slice(-MAX_COMMENTARY) : next;
              });
              break;
            case 'player_stats':
              setPlayerStats(msg.data || []);
              break;
            case 'game_event':
              setEventCount(prev => prev + 1);
              setGameEvents(prev => {
                const next = [...prev, msg.data];
                return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
              });
              break;
            case 'audio':
              // New: receive WAV audio from TTS service
              if (msg.data?.audio_b64) {
                setAudioQueue(prev => [...prev, msg.data]);
              }
              break;
            case 'system':
              console.log('📡 System:', msg.data.message);
              break;
          }
        } catch (e) { /* skip malformed */ }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('🔌 WebSocket disconnected, reconnecting...');
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => { ws.close(); };
    } catch (e) {
      reconnectRef.current = setTimeout(connect, 3000);
    }
  }, [url]);

  // Send game events TO the backend
  const sendEvent = useCallback((eventData) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'game_event', data: eventData }));
    }
  }, []);

  // Consume one audio item from queue
  const consumeAudio = useCallback(() => {
    setAudioQueue(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(1);
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { isConnected, commentary, playerStats, gameEvents, eventCount, sendEvent, audioQueue, consumeAudio };
}
