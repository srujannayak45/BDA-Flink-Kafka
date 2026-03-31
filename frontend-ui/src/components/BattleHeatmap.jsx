import { useRef, useEffect } from 'react';

export default function BattleHeatmap({ events, players }) {
  const canvasRef = useRef(null);
  const MAP_SIZE = 1000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      const y = (i / 10) * h;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw kill events as heat points
    const killEvents = events.filter(e => e.action === 'kill' && e.details?.killed);
    
    for (const event of killEvents) {
      const x = (event.x / MAP_SIZE) * w;
      const y = (event.y / MAP_SIZE) * h;
      const color = event.color || '#6366f1';

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
      gradient.addColorStop(0, color + '60');
      gradient.addColorStop(0.5, color + '20');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 15, y - 15, 30, 30);

      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw current player positions
    if (players) {
      for (const player of players) {
        const x = ((player.x || 0) / MAP_SIZE) * w;
        const y = ((player.y || 0) / MAP_SIZE) * h;
        const color = player.color || '#fff';

        // Player marker
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = player.alive ? color : color + '40';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Name label
        ctx.fillStyle = '#fff';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.player_name || '', x, y - 10);
      }
    }
  }, [events, players]);

  return (
    <div className="glass-card heatmap-container" id="battle-heatmap">
      <div className="card-header">
        <h2>🗺️ Battle Heatmap</h2>
        <span className="badge">Live positions</span>
      </div>
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={400} height={400} />
      </div>
    </div>
  );
}
