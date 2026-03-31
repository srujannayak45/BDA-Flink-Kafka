// ===========================
// Player Definitions & AI Personalities
// ===========================

export const PLAYER_PERSONALITIES = {
  AGGRESSIVE: 'aggressive',
  DEFENSIVE: 'defensive',
  BALANCED: 'balanced',
  SNIPER: 'sniper',
  RUSHER: 'rusher'
};

export const ACTIONS = {
  MOVE: 'move',
  KILL: 'kill',
  IDLE: 'idle',
  HEAL: 'heal',
  ABILITY: 'ability_use',
  RESPAWN: 'respawn',
  DEATH: 'death'
};

// Action probability weights per personality
const ACTION_WEIGHTS = {
  [PLAYER_PERSONALITIES.AGGRESSIVE]: {
    [ACTIONS.MOVE]: 25,
    [ACTIONS.KILL]: 35,
    [ACTIONS.IDLE]: 5,
    [ACTIONS.HEAL]: 10,
    [ACTIONS.ABILITY]: 20,
    [ACTIONS.DEATH]: 5
  },
  [PLAYER_PERSONALITIES.DEFENSIVE]: {
    [ACTIONS.MOVE]: 30,
    [ACTIONS.KILL]: 10,
    [ACTIONS.IDLE]: 15,
    [ACTIONS.HEAL]: 25,
    [ACTIONS.ABILITY]: 15,
    [ACTIONS.DEATH]: 5
  },
  [PLAYER_PERSONALITIES.BALANCED]: {
    [ACTIONS.MOVE]: 30,
    [ACTIONS.KILL]: 20,
    [ACTIONS.IDLE]: 10,
    [ACTIONS.HEAL]: 15,
    [ACTIONS.ABILITY]: 18,
    [ACTIONS.DEATH]: 7
  },
  [PLAYER_PERSONALITIES.SNIPER]: {
    [ACTIONS.MOVE]: 15,
    [ACTIONS.KILL]: 30,
    [ACTIONS.IDLE]: 25,
    [ACTIONS.HEAL]: 10,
    [ACTIONS.ABILITY]: 15,
    [ACTIONS.DEATH]: 5
  },
  [PLAYER_PERSONALITIES.RUSHER]: {
    [ACTIONS.MOVE]: 35,
    [ACTIONS.KILL]: 25,
    [ACTIONS.IDLE]: 3,
    [ACTIONS.HEAL]: 7,
    [ACTIONS.ABILITY]: 22,
    [ACTIONS.DEATH]: 8
  }
};

export function createPlayers(count, mapSize) {
  const names = [
    { id: 'player_1', name: 'PhantomX', personality: PLAYER_PERSONALITIES.AGGRESSIVE, color: '#FF4444' },
    { id: 'player_2', name: 'IronShield', personality: PLAYER_PERSONALITIES.DEFENSIVE, color: '#4488FF' },
    { id: 'player_3', name: 'ShadowBlade', personality: PLAYER_PERSONALITIES.BALANCED, color: '#44FF88' },
    { id: 'player_4', name: 'DeadEye', personality: PLAYER_PERSONALITIES.SNIPER, color: '#FF8844' },
    { id: 'player_5', name: 'BlitzKrieg', personality: PLAYER_PERSONALITIES.RUSHER, color: '#FF44FF' }
  ];

  return names.slice(0, count).map(p => ({
    ...p,
    x: Math.floor(Math.random() * mapSize),
    y: Math.floor(Math.random() * mapSize),
    hp: 100,
    kills: 0,
    deaths: 0,
    alive: true,
    lastAction: null,
    streak: 0,
    totalDamage: 0,
    healCount: 0,
    abilityCount: 0,
    moveDistance: 0
  }));
}

export function getWeightedAction(personality, isAlive) {
  if (!isAlive) return ACTIONS.RESPAWN;

  const weights = ACTION_WEIGHTS[personality];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const [action, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return action;
  }

  return ACTIONS.MOVE;
}
