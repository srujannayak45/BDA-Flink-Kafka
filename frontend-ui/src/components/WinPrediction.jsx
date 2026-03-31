export default function WinPrediction({ players }) {
  if (!players || players.length === 0) return null;

  const sorted = [...players].sort((a, b) => 
    (b.win_probability || 0) - (a.win_probability || 0)
  );

  const maxProb = Math.max(...sorted.map(p => p.win_probability || 0.2));

  return (
    <div className="glass-card win-prediction" id="win-prediction">
      <div className="card-header">
        <h2>📊 Win Probability</h2>
      </div>
      <div className="prediction-bars">
        {sorted.map(player => {
          const prob = ((player.win_probability || 0.2) * 100).toFixed(0);
          const isLeader = (player.win_probability || 0) === maxProb;
          return (
            <div key={player.player_id} className={`prediction-row ${isLeader ? 'leader' : ''}`}>
              <div className="prediction-label">
                <span className="prediction-avatar" style={{ background: player.color }}>
                  {player.player_name?.[0]}
                </span>
                <span className="prediction-name">{player.player_name}</span>
              </div>
              <div className="prediction-bar-wrapper">
                <div className="prediction-bar" style={{
                  width: `${prob}%`,
                  background: `linear-gradient(90deg, ${player.color}44, ${player.color})`,
                  boxShadow: isLeader ? `0 0 12px ${player.color}60` : 'none'
                }}>
                  <span className="prediction-value mono">{prob}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
