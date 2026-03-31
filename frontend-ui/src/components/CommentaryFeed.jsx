import { EMOTION_CONFIG } from '../utils/constants';
import { useEffect, useRef } from 'react';

export default function CommentaryFeed({ commentary }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [commentary]);

  const getTimeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="glass-card commentary-feed" id="commentary-feed">
      <div className="card-header">
        <h2>🎙️ Live Commentary</h2>
        <span className="badge">{commentary.length} messages</span>
      </div>
      <div className="feed-scroll" ref={feedRef}>
        {commentary.length === 0 ? (
          <div className="empty-state">
            <p>Waiting for game events...</p>
            <div className="pulse-loader"></div>
          </div>
        ) : (
          commentary.map((c, i) => {
            const emotion = EMOTION_CONFIG[c.emotion] || EMOTION_CONFIG.CALM;
            return (
              <div 
                key={c.id || i} 
                className={`commentary-item ${c.css_class || 'calm'}`}
                style={{ 
                  animationDelay: `${Math.min(i * 0.05, 0.5)}s`,
                  borderLeftColor: emotion.color 
                }}
              >
                <div className="commentary-meta">
                  <span className={`emotion-badge ${c.css_class || 'calm'}`}>
                    {emotion.emoji} {emotion.label}
                  </span>
                  <span className="commentary-time mono">{getTimeAgo(c.timestamp)}</span>
                </div>
                <p className="commentary-text">{c.text}</p>
                {c.player_name && (
                  <span className="commentary-player">— {c.player_name}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
