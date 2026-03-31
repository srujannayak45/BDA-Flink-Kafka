export default function PlayerStats({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="glass-card player-stats" id="player-stats">
        <div className="card-header"><h2>🏏 Match Stats</h2></div>
        <div className="empty-state"><p>Play the game to see stats...</p></div>
      </div>
    );
  }

  // Filter to only show cricket-relevant players (batsman)
  const cricketPlayers = players.filter(p => 
    p.player_name === 'You' || p.runs > 0 || p.balls_faced > 0
  );
  
  // If no cricket players yet, show all
  const displayPlayers = cricketPlayers.length > 0 ? cricketPlayers : players.slice(0, 3);

  return (
    <div className="glass-card player-stats" id="player-stats">
      <div className="card-header">
        <h2>🏏 Match Stats</h2>
        <span className="badge">{displayPlayers.length} players</span>
      </div>
      <div className="players-grid">
        {displayPlayers.map((player, i) => {
          const runs = player.runs || 0;
          const balls = player.balls_faced || 0;
          const sr = balls > 0 ? ((runs / balls) * 100).toFixed(0) : '0';
          const fours = player.fours || 0;
          const sixes = player.sixes || 0;
          const dots = player.dots || 0;
          const wickets = player.deaths || 0;

          return (
            <div key={player.player_id} className="player-card" style={{ '--player-color': player.color || '#4488FF' }}>
              <div className="player-rank">#{i + 1}</div>
              <div className="player-header">
                <div className="player-avatar" style={{ background: player.color || '#4488FF' }}>
                  {player.player_name?.[0] || '?'}
                </div>
                <div className="player-info">
                  <h3>{player.player_name || 'Player'}</h3>
                  <span className="player-personality">🏏 Batsman</span>
                </div>
                <div className="player-status">
                  {wickets >= 10 ? '💀' : '🏏'}
                </div>
              </div>

              <div className="stat-grid">
                <div className="stat">
                  <span className="stat-value" style={{ color: '#10b981' }}>{runs}</span>
                  <span className="stat-label">Runs</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#94a3b8' }}>{balls}</span>
                  <span className="stat-label">Balls</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#f59e0b' }}>{fours}</span>
                  <span className="stat-label">4s</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#f43f5e' }}>{sixes}</span>
                  <span className="stat-label">6s</span>
                </div>
              </div>

              <div className="win-prob-bar">
                <div className="win-prob-header">
                  <span>Strike Rate</span>
                  <span className="mono" style={{ color: '#6366f1' }}>{sr}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${Math.min(100, parseFloat(sr) / 2)}%`,
                    background: `linear-gradient(90deg, #6366f188, #6366f1)`
                  }}></div>
                </div>
              </div>

              <div className="player-extras">
                <span>⚫ {dots} dots</span>
                <span>💀 {wickets} wkts</span>
                <span>📊 SR: {sr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
