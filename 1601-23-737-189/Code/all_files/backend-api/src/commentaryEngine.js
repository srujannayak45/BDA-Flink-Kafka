// ===========================
// Cricket Commentary Engine
// ===========================

const CRICKET_COMMENTARY = {
  runs_6: [
    "MASSIVE SIX! That went straight out of the ground!",
    "What a shot! That's been deposited into the stands!",
    "SIX! Incredible power from the batsman!",
    "That's gone all the way! Maximum runs!",
    "Huge hit! The crowd is on its feet!",
    "That's a monster hit for SIX!",
    "Out of the park! What a magnificent strike!"
  ],
  runs_4: [
    "FOUR! Racing away to the boundary!",
    "Beautifully timed! That's a boundary!",
    "FOUR runs! Superb shot through the gap!",
    "Piercing the field! That's four all the way!",
    "Cracking drive to the boundary!",
    "What timing! That's raced to the fence!",
    "Classic shot for FOUR!"
  ],
  runs_2: [
    "Good running between the wickets! Two taken.",
    "Sharp single turned into two! Well run!",
    "They come back for the second. Good cricket!",
    "Two runs, keeping the scoreboard ticking."
  ],
  runs_1: [
    "Single taken. Rotation of strike.",
    "Quick single, good awareness between the wickets.",
    "One run, keeping things moving.",
    "Nudged away for a single."
  ],
  dot_ball: [
    "Dot ball. Good bowling, tight line.",
    "No run. The bowler is on top here.",
    "Defended solidly. No run scored.",
    "Left alone outside off stump. Dot ball.",
    "Good length delivery, the batsman watches it through."
  ],
  wicket_bowled: [
    "BOWLED! The stumps are shattered!",
    "Clean bowled! What a delivery!",
    "TIMBER! Right through the gate!",
    "The middle stump goes cartwheeling! OUT!",
    "Bowled him! The batsman had no answer!"
  ],
  wicket_caught: [
    "CAUGHT! Taken cleanly in the field!",
    "OUT! A stunning catch ends the innings!",
    "Edged and caught! The fielder held on!",
    "Gone! Caught at the boundary! Great grab!"
  ],
  wicket_lbw: [
    "LBW! That looked absolutely plumb!",
    "Trapped in front! Dead plumb LBW!",
    "OUT! Struck on the pads, that's given LBW!"
  ],
  momentum: [
    "The momentum is shifting in the batsman's favor!",
    "The bowler is under pressure now! Big over!",
    "The run rate is climbing rapidly!"
  ],
  pressure: [
    "The pressure is mounting on the batsman!",
    "Dot balls building pressure. The bowler is on top.",
    "A tight spell here. The batsman needs to find gaps."
  ]
};

export class CommentaryEngine {
  constructor() {
    this.count = 0;
    this.lastTexts = [];
  }

  pick(arr) {
    // Avoid repeating last 3 lines
    const available = arr.filter(t => !this.lastTexts.includes(t));
    const pool = available.length > 0 ? available : arr;
    const text = pool[Math.floor(Math.random() * pool.length)];
    this.lastTexts.push(text);
    if (this.lastTexts.length > 5) this.lastTexts.shift();
    return text;
  }

  generateCricketCommentary(event) {
    this.count++;
    let text = '';
    let emotion = 'CALM';
    let priority = 5;

    switch (event.action) {
      case 'runs': {
        const runs = event.details?.runs || 0;
        if (runs === 6) { text = this.pick(CRICKET_COMMENTARY.runs_6); emotion = 'INTENSE'; priority = 9; }
        else if (runs === 4) { text = this.pick(CRICKET_COMMENTARY.runs_4); emotion = 'HYPE'; priority = 8; }
        else if (runs >= 2) { text = this.pick(CRICKET_COMMENTARY.runs_2); emotion = 'CALM'; priority = 5; }
        else { text = this.pick(CRICKET_COMMENTARY.runs_1); emotion = 'CALM'; priority = 4; }
        break;
      }
      case 'wicket': {
        const type = event.details?.type || 'bowled';
        if (type === 'bowled') text = this.pick(CRICKET_COMMENTARY.wicket_bowled);
        else if (type === 'caught') text = this.pick(CRICKET_COMMENTARY.wicket_caught);
        else text = this.pick(CRICKET_COMMENTARY.wicket_lbw);
        emotion = 'CRITICAL';
        priority = 10;
        break;
      }
      case 'dot_ball':
        text = this.pick(CRICKET_COMMENTARY.dot_ball);
        emotion = 'CALM';
        priority = 3;
        break;
      case 'bowl':
        return null; // Don't commentate every delivery start
      default:
        return null;
    }

    if (!text) return null;

    // Add score context
    const sc = event.details;
    if (sc?.score !== undefined && sc?.wickets !== undefined) {
      text += ` Score: ${sc.score}/${sc.wickets} (${sc.overs} ov)`;
    }

    return {
      id: `c_${Date.now()}_${this.count}`,
      text,
      emotion,
      emotion_emoji: emotion === 'INTENSE' ? '🔥' : emotion === 'CRITICAL' ? '⚡' : emotion === 'HYPE' ? '🚀' : '🏏',
      css_class: emotion.toLowerCase(),
      priority,
      player_name: event.player_name || 'Batsman',
      timestamp: Date.now(),
      sequence: this.count
    };
  }

  enhance(commentary) {
    this.count++;
    return {
      ...commentary,
      id: commentary.id || `c_${Date.now()}_${this.count}`,
      timestamp: commentary.timestamp || Date.now(),
      sequence: this.count
    };
  }
}
