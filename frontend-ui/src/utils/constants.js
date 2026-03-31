export const WS_URL = window.location.hostname === 'localhost'
  ? 'ws://localhost:3001/ws'
  : `ws://${window.location.host}/ws`;

export const PLAYER_COLORS = {
  player_1: '#FF4444',
  player_2: '#4488FF',
  player_3: '#44FF88',
  player_4: '#FF8844',
  player_5: '#FF44FF'
};

export const EMOTION_CONFIG = {
  INTENSE: { emoji: '🔥', color: '#f43f5e', label: 'INTENSE' },
  CALM: { emoji: '😌', color: '#06b6d4', label: 'CALM' },
  CRITICAL: { emoji: '⚡', color: '#f59e0b', label: 'CRITICAL' },
  CLUTCH: { emoji: '🎯', color: '#a78bfa', label: 'CLUTCH' },
  HYPE: { emoji: '🚀', color: '#10b981', label: 'HYPE' }
};
