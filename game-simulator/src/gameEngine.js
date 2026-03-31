// ===========================
// Game Engine - Core Simulation Logic
// ===========================

import { ACTIONS, getWeightedAction } from './players.js';

export class GameEngine {
  constructor(players, mapSize = 1000) {
    this.players = players;
    this.mapSize = mapSize;
    this.tickCount = 0;
    this.gameTime = 0;
    this.matchId = `match_${Date.now()}`;
    console.log(`🎮 Game Engine initialized | Match: ${this.matchId} | Players: ${players.length} | Map: ${mapSize}x${mapSize}`);
  }

  tick() {
    this.tickCount++;
    this.gameTime += 1;
    const events = [];

    for (const player of this.players) {
      const action = getWeightedAction(player.personality, player.alive);
      const event = this.processAction(player, action);
      if (event) events.push(event);
    }

    return events;
  }

  processAction(player, action) {
    const timestamp = Date.now();
    const baseEvent = {
      match_id: this.matchId,
      player_id: player.id,
      player_name: player.name,
      personality: player.personality,
      color: player.color,
      timestamp,
      game_tick: this.tickCount,
      x: player.x,
      y: player.y
    };

    switch (action) {
      case ACTIONS.MOVE:
        return this.handleMove(player, baseEvent);
      case ACTIONS.KILL:
        return this.handleKill(player, baseEvent);
      case ACTIONS.IDLE:
        return this.handleIdle(player, baseEvent);
      case ACTIONS.HEAL:
        return this.handleHeal(player, baseEvent);
      case ACTIONS.ABILITY:
        return this.handleAbility(player, baseEvent);
      case ACTIONS.DEATH:
        return this.handleDeath(player, baseEvent);
      case ACTIONS.RESPAWN:
        return this.handleRespawn(player, baseEvent);
      default:
        return null;
    }
  }

  handleMove(player, event) {
    const dx = (Math.random() - 0.5) * 100;
    const dy = (Math.random() - 0.5) * 100;
    player.x = Math.max(0, Math.min(this.mapSize, player.x + dx));
    player.y = Math.max(0, Math.min(this.mapSize, player.y + dy));
    const distance = Math.sqrt(dx * dx + dy * dy);
    player.moveDistance += distance;
    player.lastAction = ACTIONS.MOVE;

    return {
      ...event,
      action: ACTIONS.MOVE,
      x: Math.round(player.x),
      y: Math.round(player.y),
      details: { dx: Math.round(dx), dy: Math.round(dy), distance: Math.round(distance) }
    };
  }

  handleKill(player, event) {
    // Pick a random alive opponent
    const opponents = this.players.filter(p => p.id !== player.id && p.alive);
    if (opponents.length === 0) return this.handleMove(player, event);

    const victim = opponents[Math.floor(Math.random() * opponents.length)];
    const damage = 20 + Math.floor(Math.random() * 80);

    victim.hp -= damage;
    player.totalDamage += damage;

    let killed = false;
    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.alive = false;
      victim.deaths++;
      player.kills++;
      player.streak++;
      killed = true;
    }

    player.lastAction = ACTIONS.KILL;

    return {
      ...event,
      action: ACTIONS.KILL,
      details: {
        victim_id: victim.id,
        victim_name: victim.name,
        damage,
        killed,
        killer_kills: player.kills,
        killer_streak: player.streak,
        victim_hp: victim.hp
      }
    };
  }

  handleIdle(player, event) {
    player.lastAction = ACTIONS.IDLE;
    return {
      ...event,
      action: ACTIONS.IDLE,
      details: { duration: 1000 + Math.floor(Math.random() * 2000) }
    };
  }

  handleHeal(player, event) {
    const healAmount = 10 + Math.floor(Math.random() * 30);
    player.hp = Math.min(100, player.hp + healAmount);
    player.healCount++;
    player.lastAction = ACTIONS.HEAL;

    return {
      ...event,
      action: ACTIONS.HEAL,
      details: { heal_amount: healAmount, current_hp: player.hp }
    };
  }

  handleAbility(player, event) {
    const abilities = ['ultimate', 'tactical', 'grenade', 'shield', 'dash', 'teleport'];
    const ability = abilities[Math.floor(Math.random() * abilities.length)];
    player.abilityCount++;
    player.lastAction = ACTIONS.ABILITY;

    return {
      ...event,
      action: ACTIONS.ABILITY,
      details: { ability_name: ability, cooldown: 5 + Math.floor(Math.random() * 15) }
    };
  }

  handleDeath(player, event) {
    player.alive = false;
    player.hp = 0;
    player.deaths++;
    player.streak = 0;
    player.lastAction = ACTIONS.DEATH;

    // Credit a random alive player with the kill
    const killers = this.players.filter(p => p.id !== player.id && p.alive);
    const killer = killers.length > 0 ? killers[Math.floor(Math.random() * killers.length)] : null;
    if (killer) {
      killer.kills++;
      killer.streak++;
    }

    return {
      ...event,
      action: ACTIONS.DEATH,
      details: {
        killer_id: killer?.id || 'environment',
        killer_name: killer?.name || 'Environment',
        player_deaths: player.deaths
      }
    };
  }

  handleRespawn(player, event) {
    player.alive = true;
    player.hp = 100;
    player.x = Math.floor(Math.random() * this.mapSize);
    player.y = Math.floor(Math.random() * this.mapSize);
    player.lastAction = ACTIONS.RESPAWN;

    return {
      ...event,
      action: ACTIONS.RESPAWN,
      x: Math.round(player.x),
      y: Math.round(player.y),
      details: { respawn_hp: 100 }
    };
  }

  getPlayerStats() {
    return this.players.map(p => ({
      player_id: p.id,
      player_name: p.name,
      personality: p.personality,
      color: p.color,
      kills: p.kills,
      deaths: p.deaths,
      kd_ratio: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2),
      hp: p.hp,
      alive: p.alive,
      streak: p.streak,
      total_damage: p.totalDamage,
      heal_count: p.healCount,
      ability_count: p.abilityCount,
      move_distance: Math.round(p.moveDistance),
      x: Math.round(p.x),
      y: Math.round(p.y)
    }));
  }
}
