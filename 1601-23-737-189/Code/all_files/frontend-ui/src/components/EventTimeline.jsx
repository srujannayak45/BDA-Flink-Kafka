export default function EventTimeline({ events }) {
  const recentEvents = events.slice(-30);
  
  const getActionIcon = (action) => {
    switch (action) {
      case 'runs': return '🏏';
      case 'wicket': return '💀';
      case 'dot_ball': return '⚫';
      case 'bowl': return '🎯';
      case 'kill': return '⚔️';
      case 'death': return '💀';
      case 'heal': return '💊';
      case 'ability_use': return '✨';
      case 'move': return '🏃';
      case 'idle': return '😴';
      case 'respawn': return '🔄';
      default: return '📌';
    }
  };

  const getActionClass = (action) => {
    switch (action) {
      case 'runs': return 'action-kill';
      case 'wicket': return 'action-death';
      case 'dot_ball': return 'action-default';
      case 'bowl': return 'action-ability';
      case 'kill': return 'action-kill';
      case 'death': return 'action-death';
      case 'heal': return 'action-heal';
      default: return 'action-default';
    }
  };

  const getDetail = (event) => {
    if (event.action === 'runs' && event.details) {
      const r = event.details.runs;
      if (r === 6) return '💥 SIX!';
      if (r === 4) return '🏏 FOUR!';
      return `${r} run${r > 1 ? 's' : ''}`;
    }
    if (event.action === 'wicket' && event.details) return `(${event.details.type})`;
    if (event.action === 'bowl' && event.details) return `${event.details.speed} ${event.details.bowl_type}`;
    if (event.action === 'kill' && event.details?.victim_name) {
      return `→ ${event.details.victim_name} ${event.details.killed ? '(eliminated!)' : `(${event.details.damage} dmg)`}`;
    }
    return '';
  };

  return (
    <div className="glass-card event-timeline" id="event-timeline">
      <div className="card-header">
        <h2>⏱️ Event Timeline</h2>
        <span className="badge">{events.length} total</span>
      </div>
      <div className="timeline-scroll">
        {recentEvents.length === 0 ? (
          <div className="empty-state"><p>Awaiting events...</p></div>
        ) : (
          recentEvents.map((event, i) => (
            <div key={`${event.timestamp}-${i}`} className={`timeline-item ${getActionClass(event.action)}`}>
              <span className="timeline-icon">{getActionIcon(event.action)}</span>
              <div className="timeline-content">
                <span className="timeline-player" style={{ color: event.color }}>
                  {event.player_name}
                </span>
                <span className="timeline-action">{event.action}</span>
                <span className="timeline-detail">{getDetail(event)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
