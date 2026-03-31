import Header from './components/Header';
import CricketGame from './components/CricketGame';
import CommentaryFeed from './components/CommentaryFeed';
import PlayerStats from './components/PlayerStats';
import EventTimeline from './components/EventTimeline';
import WinPrediction from './components/WinPrediction';
import BrowserTTS from './components/BrowserTTS';
import { useWebSocket } from './hooks/useWebSocket';
import { WS_URL } from './utils/constants';
import './App.css';

function App() {
  const { isConnected, commentary, playerStats, gameEvents, eventCount, sendEvent, audioQueue, consumeAudio } = useWebSocket(WS_URL);

  return (
    <div className="app">
      <div className="bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <Header isConnected={isConnected} eventCount={eventCount} />

      <main className="dashboard">
        <div className="game-section">
          <CricketGame sendEvent={sendEvent} />
          <BrowserTTS commentary={commentary} audioQueue={audioQueue} consumeAudio={consumeAudio} />
        </div>

        <div className="dashboard-grid">
          <div className="col-left">
            <CommentaryFeed commentary={commentary} />
          </div>
          <div className="col-center">
            <PlayerStats players={playerStats} />
          </div>
          <div className="col-right">
            <WinPrediction players={playerStats} />
            <EventTimeline events={gameEvents} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>🏏 Real-Time AI Cricket Commentator | Apache Flink + Kafka | XTTS-v2 Voice Engine</p>
      </footer>
    </div>
  );
}

export default App;
