export default function Header({ isConnected, eventCount }) {
  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">🎮</span>
          <div>
            <h1 className="logo-title">
              <span className="text-gradient">AI Game Commentator</span>
            </h1>
            <p className="logo-subtitle">Real-Time Flink + Kafka Analytics</p>
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className="header-stat">
          <span className="header-stat-value mono">{eventCount.toLocaleString()}</span>
          <span className="header-stat-label">Events Processed</span>
        </div>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'live' : 'offline'}`}></span>
          <span>{isConnected ? 'LIVE' : 'RECONNECTING...'}</span>
        </div>
      </div>
    </header>
  );
}
