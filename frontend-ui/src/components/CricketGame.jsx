import { useRef, useEffect, useState, useCallback } from 'react';

const W = 800, H = 600;
const PITCH_X = 320, PITCH_Y = 100, PITCH_W = 160, PITCH_H = 400;
const CREASE_TOP = PITCH_Y + 40, CREASE_BOT = PITCH_Y + PITCH_H - 40;
const FIELD_POSITIONS = [
  {x:150,y:150,name:'Slip'},{x:650,y:150,name:'Point'},{x:100,y:300,name:'Mid-on'},
  {x:700,y:300,name:'Mid-off'},{x:150,y:500,name:'Fine Leg'},{x:650,y:500,name:'Sq Leg'},
  {x:400,y:80,name:'Cover'},{x:400,y:520,name:'Deep'},{x:250,y:450,name:'Short'}
];

export default function CricketGame({ sendEvent }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    phase: 'waiting', // waiting, bowling, result
    ball: { x: 400, y: CREASE_TOP, vx: 0, vy: 0, visible: false },
    batsman: { x: 400, y: CREASE_BOT - 10, swinging: false, swingAngle: -0.3 },
    score: { runs: 0, wickets: 0, balls: 0, fours: 0, sixes: 0, target: 120 },
    lastResult: '', resultTimer: 0,
    ballTrail: [], particles: [],
    autoTimer: 0,
    matchId: 'match_' + Date.now(),
    gameOver: false
  });
  const keysRef = useRef({});
  const animRef = useRef(null);
  const [scoreUI, setScoreUI] = useState({ runs:0, wickets:0, balls:0, fours:0, sixes:0, target:120 });
  const [statusMsg, setStatusMsg] = useState('⏳ Bowler running in...');

  const emitEvent = useCallback((action, details) => {
    if (!sendEvent) return;
    const s = stateRef.current;
    sendEvent({
      match_id: s.matchId, player_id: 'batsman_1', player_name: 'You',
      personality: 'batsman', color: '#4488FF', action,
      timestamp: Date.now(), game_tick: s.score.balls,
      x: Math.round(s.batsman.x), y: Math.round(s.batsman.y),
      details: { ...details, score: s.score.runs, wickets: s.score.wickets, overs: `${Math.floor(s.score.balls/6)}.${s.score.balls%6}` }
    });
  }, [sendEvent]);

  const spawnParticles = (x, y, color, count) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x, y, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.5)*8-3,
        size:2+Math.random()*3, life:25+Math.random()*20, maxLife:45, color
      });
    }
  };

  const startBowling = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'waiting' || s.gameOver) return;
    s.phase = 'bowling';
    s.ball.visible = true;
    s.ball.x = 400 + (Math.random()-0.5)*20;
    s.ball.y = CREASE_TOP;
    const swing = (Math.random()-0.5)*1.5;
    const speed = 3.5 + Math.random()*2;
    s.ball.vx = swing;
    s.ball.vy = speed;
    s.ballTrail = [];
    s.batsman.swinging = false;
    s.batsman.swingAngle = -0.3;
    setStatusMsg('🏏 Ball coming! Press SPACE to hit!');
    emitEvent('bowl', { bowl_type: Math.random()>0.5?'pace':'spin', speed: (120+Math.random()*30).toFixed(0)+'km/h' });
  }, [emitEvent]);

  const swingBat = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'bowling' || s.batsman.swinging) return;
    s.batsman.swinging = true;
    s.batsman.swingAngle = 1.2;

    const dist = Math.abs(s.ball.y - s.batsman.y);
    const timing = dist < 25 ? 'perfect' : dist < 60 ? 'good' : dist < 110 ? 'early' : 'miss';
    
    setTimeout(() => {
      let runs = 0, result = '';
      const r = Math.random();
      if (timing === 'miss' || dist > 120) {
        if (r < 0.35) { result = '💀 BOWLED!'; s.score.wickets++; emitEvent('wicket',{type:'bowled',timing}); spawnParticles(400,CREASE_BOT,'255,50,50',25); }
        else { result = '• Dot Ball'; emitEvent('dot_ball',{timing}); }
      } else if (timing === 'perfect') {
        if (r<0.3){runs=6;result='💥 MASSIVE SIX!';s.score.sixes++;spawnParticles(s.ball.x,s.ball.y,'255,215,0',35);}
        else if(r<0.6){runs=4;result='🏏 FOUR!';s.score.fours++;spawnParticles(s.ball.x,s.ball.y,'50,255,50',25);}
        else if(r<0.8){runs=2;result='↔ Two Runs';}
        else{runs=1;result='→ Single';}
      } else if (timing === 'good') {
        if(r<0.15){runs=6;result='💥 SIX!';s.score.sixes++;spawnParticles(s.ball.x,s.ball.y,'255,215,0',35);}
        else if(r<0.4){runs=4;result='🏏 FOUR!';s.score.fours++;spawnParticles(s.ball.x,s.ball.y,'50,255,50',25);}
        else if(r<0.6){runs=2;result='↔ Two Runs';}
        else if(r<0.8){runs=1;result='→ Single';}
        else{result='• Dot Ball';emitEvent('dot_ball',{timing});}
      } else {
        if(r<0.2){result='💀 CAUGHT!';s.score.wickets++;emitEvent('wicket',{type:'caught',timing});spawnParticles(400,CREASE_BOT,'255,50,50',25);}
        else if(r<0.4){runs=1;result='→ Single';}
        else if(r<0.55){runs=4;result='🏏 FOUR! (Edge)';s.score.fours++;}
        else{result='• Dot Ball';emitEvent('dot_ball',{timing});}
      }
      if(runs>0){s.score.runs+=runs;emitEvent('runs',{runs,timing,shot_type:timing==='perfect'?'drive':'defense'});}
      s.score.balls++;
      s.lastResult = result; s.resultTimer = 80;
      s.ball.visible = false; s.phase = 'result';
      setScoreUI({...s.score});

      if(s.score.runs>=s.target){s.gameOver=true;setStatusMsg('🏆 YOU WIN! Target chased!');emitEvent('runs',{runs:0,game_result:'win'});}
      else if(s.score.wickets>=10){s.gameOver=true;setStatusMsg('💀 ALL OUT! Game Over');emitEvent('wicket',{type:'all_out',game_result:'loss'});}
      else if(s.score.balls>=60){s.gameOver=true;setStatusMsg(s.score.runs>=s.target?'🏆 YOU WIN!':'😢 Overs finished');}
      else{setStatusMsg(`${result}  |  Press SPACE to continue`);setTimeout(()=>{s.phase='waiting';s.autoTimer=120;setStatusMsg('⏳ Bowler running in...');},2000);}
    }, timing==='miss'?600:250);
  }, [emitEvent]);

  // Input
  useEffect(()=>{
    const down=(e)=>{keysRef.current[e.key]=true;if(e.key===' '){e.preventDefault();const s=stateRef.current;if(s.phase==='waiting')startBowling();else if(s.phase==='bowling')swingBat();}};
    const up=(e)=>{keysRef.current[e.key]=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[startBowling,swingBat]);

  // Game loop
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');

    const loop=()=>{
      const s=stateRef.current; const k=keysRef.current;

      // Batsman movement with WASD
      if(s.phase!=='result'){
        if(k['w']||k['W']||k['ArrowUp']) s.batsman.y=Math.max(CREASE_BOT-60,s.batsman.y-2);
        if(k['s']||k['S']||k['ArrowDown']) s.batsman.y=Math.min(CREASE_BOT+10,s.batsman.y+2);
        if(k['a']||k['A']||k['ArrowLeft']) s.batsman.x=Math.max(PITCH_X+30,s.batsman.x-2);
        if(k['d']||k['D']||k['ArrowRight']) s.batsman.x=Math.min(PITCH_X+PITCH_W-30,s.batsman.x+2);
      }

      // Auto-bowl timer
      if(s.phase==='waiting'&&!s.gameOver){s.autoTimer--;if(s.autoTimer<=0){startBowling();}}

      // Ball movement
      if(s.phase==='bowling'&&s.ball.visible){
        s.ballTrail.push({x:s.ball.x,y:s.ball.y}); if(s.ballTrail.length>15)s.ballTrail.shift();
        s.ball.x+=s.ball.vx; s.ball.y+=s.ball.vy;
        if(s.ball.y>=CREASE_BOT+40){s.ball.visible=false;s.score.balls++;s.lastResult='• Dot Ball';s.resultTimer=60;s.phase='result';setScoreUI({...s.score});emitEvent('dot_ball',{timing:'left'});setStatusMsg('• Dot Ball  |  Press SPACE to continue');setTimeout(()=>{s.phase='waiting';s.autoTimer=120;setStatusMsg('⏳ Bowler running in...');},2000);}
      }

      if(s.resultTimer>0)s.resultTimer--;
      // Swing animation reset
      if(s.batsman.swinging&&s.batsman.swingAngle>-0.3)s.batsman.swingAngle-=0.05;
      if(s.batsman.swingAngle<=-0.3)s.batsman.swinging=false;

      // === DRAW ===
      // Ground
      const bg=ctx.createRadialGradient(W/2,H/2,50,W/2,H/2,450);
      bg.addColorStop(0,'#2d8a4e');bg.addColorStop(0.6,'#1e6b38');bg.addColorStop(1,'#0d4422');
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      // Outfield rings
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
      for(let r=100;r<400;r+=60){ctx.beginPath();ctx.arc(W/2,H/2,r,0,Math.PI*2);ctx.stroke();}
      // Boundary
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.setLineDash([10,5]);
      ctx.beginPath();ctx.arc(W/2,H/2,280,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      // 30-yard circle
      ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);
      ctx.beginPath();ctx.arc(W/2,H/2,180,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      // Pitch
      const pg=ctx.createLinearGradient(PITCH_X,0,PITCH_X+PITCH_W,0);
      pg.addColorStop(0,'#c4a95a');pg.addColorStop(0.5,'#d4b96a');pg.addColorStop(1,'#c4a95a');
      ctx.fillStyle=pg;ctx.fillRect(PITCH_X,PITCH_Y,PITCH_W,PITCH_H);
      ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(PITCH_X,PITCH_Y,PITCH_W,PITCH_H);
      // Creases
      ctx.strokeStyle='#fff';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(PITCH_X+20,CREASE_TOP);ctx.lineTo(PITCH_X+PITCH_W-20,CREASE_TOP);ctx.stroke();
      ctx.beginPath();ctx.moveTo(PITCH_X+20,CREASE_BOT);ctx.lineTo(PITCH_X+PITCH_W-20,CREASE_BOT);ctx.stroke();
      // Stumps
      for(let i=-1;i<=1;i++){ctx.fillStyle='#f5e6c8';ctx.fillRect(398+i*6,CREASE_TOP-5,4,12);ctx.fillRect(398+i*6,CREASE_BOT-5,4,12);}
      ctx.fillStyle='#e8d5a0';ctx.fillRect(391,CREASE_TOP-7,18,3);ctx.fillRect(391,CREASE_BOT-7,18,3);

      // Fielders
      FIELD_POSITIONS.forEach(f=>drawPlayer(ctx,f.x,f.y,'#e74c3c',f.name));
      // Bowler
      drawPlayer(ctx,400,CREASE_TOP-30,'#e74c3c','Bowler');
      // Batsman (YOU)
      drawBatsman(ctx,s.batsman.x,s.batsman.y,s.batsman.swingAngle);

      // Ball trail + ball
      if(s.ball.visible){
        s.ballTrail.forEach((t,i)=>{ctx.fillStyle=`rgba(200,50,50,${(i/s.ballTrail.length)*0.3})`;ctx.beginPath();ctx.arc(t.x,t.y,3,0,Math.PI*2);ctx.fill();});
        ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(s.ball.x,s.ball.y+8,6,3,0,0,Math.PI*2);ctx.fill();
        const bg2=ctx.createRadialGradient(s.ball.x-2,s.ball.y-2,1,s.ball.x,s.ball.y,7);
        bg2.addColorStop(0,'#ff4444');bg2.addColorStop(0.7,'#cc0000');bg2.addColorStop(1,'#880000');
        ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(s.ball.x,s.ball.y,6,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.ball.x,s.ball.y,4,0.5,2.5);ctx.stroke();
      }

      // Particles
      s.particles=s.particles.filter(p=>p.life>0);
      s.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;ctx.fillStyle=`rgba(${p.color},${p.life/p.maxLife})`;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();});

      // Scoreboard
      ctx.fillStyle='rgba(0,0,0,0.75)';ctx.beginPath();ctx.roundRect(10,10,220,85,8);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(10,10,220,85,8);ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='bold 32px "JetBrains Mono",monospace';ctx.textAlign='left';
      ctx.fillText(`${s.score.runs}/${s.score.wickets}`,20,52);
      ctx.font='13px Inter,sans-serif';ctx.fillStyle='#ccc';
      ctx.fillText(`Overs: ${Math.floor(s.score.balls/6)}.${s.score.balls%6}`,20,72);
      ctx.fillText(`4s: ${s.score.fours}  |  6s: ${s.score.sixes}  |  SR: ${s.score.balls>0?((s.score.runs/s.score.balls)*100).toFixed(0):'0'}`,20,88);
      // Target
      ctx.fillStyle='rgba(0,0,0,0.75)';ctx.beginPath();ctx.roundRect(570,10,220,50,8);ctx.fill();
      ctx.fillStyle='#f59e0b';ctx.font='bold 15px Inter,sans-serif';ctx.textAlign='right';
      ctx.fillText(`Target: ${s.score.target}`,780,32);
      ctx.fillStyle='#aaa';ctx.font='12px Inter,sans-serif';
      const need=s.score.target-s.score.runs;
      ctx.fillText(need>0?`Need ${need} from ${60-s.score.balls} balls`:'🏆 TARGET REACHED!',780,52);

      // Result popup
      if(s.resultTimer>0){
        const a=Math.min(1,s.resultTimer/40);
        ctx.save();ctx.globalAlpha=a;
        ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.roundRect(W/2-120,H/2-35,240,70,12);ctx.fill();
        ctx.fillStyle=s.lastResult.includes('SIX')||s.lastResult.includes('FOUR')?'#fbbf24':s.lastResult.includes('WICKET')||s.lastResult.includes('BOWLED')||s.lastResult.includes('CAUGHT')?'#f43f5e':'#fff';
        ctx.font='bold 22px Inter,sans-serif';ctx.textAlign='center';ctx.fillText(s.lastResult,W/2,H/2+6);
        ctx.restore();
      }

      // Controls HUD
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.beginPath();ctx.roundRect(10,H-48,380,38,8);ctx.fill();
      ctx.fillStyle='#bbb';ctx.font='12px Inter,sans-serif';ctx.textAlign='left';
      ctx.fillText('WASD / Arrows: Move Batsman  |  SPACE: Play Shot',20,H-24);

      animRef.current=requestAnimationFrame(loop);
    };

    // Start auto bowling
    stateRef.current.autoTimer = 90;
    animRef.current=requestAnimationFrame(loop);
    return()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};
  },[startBowling,emitEvent]);

  return (
    <div className="glass-card cricket-game-container" id="cricket-game">
      <div className="card-header">
        <h2>🏏 Live Cricket Match</h2>
        <span className="badge">{statusMsg}</span>
      </div>
      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} width={W} height={H} tabIndex={0} />
      </div>
    </div>
  );
}

function drawPlayer(ctx,x,y,color,label){
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x,y+14,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.beginPath();ctx.arc(x,y-2,5,0,Math.PI);ctx.fill();
  ctx.fillStyle='#f0d0a0';ctx.beginPath();ctx.arc(x,y-12,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y-13,7,Math.PI,0);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 8px Inter,sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y+26);
}

function drawBatsman(ctx,x,y,swingAngle){
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x,y+14,12,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3498db';ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.3)';ctx.beginPath();ctx.arc(x,y-2,5,0,Math.PI);ctx.fill();
  ctx.fillStyle='#f0d0a0';ctx.beginPath();ctx.arc(x,y-12,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2980b9';ctx.beginPath();ctx.arc(x,y-13,7,Math.PI,0);ctx.fill();
  // Bat
  ctx.save();ctx.translate(x+10,y);ctx.rotate(swingAngle);
  ctx.fillStyle='#d4a44a';ctx.fillRect(0,-2,22,4);
  ctx.fillStyle='#b8862d';ctx.fillRect(18,-5,10,10);
  ctx.restore();
  ctx.fillStyle='#4fc3f7';ctx.font='bold 9px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('YOU',x,y+26);
}
