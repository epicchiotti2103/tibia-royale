import { Position, Direction, Vocation, PlayerStats } from './types';

export interface BotInstance {
  id: string;
  name: string;
  vocation: Vocation;
  position: Position;
  direction: Direction;
  stats: PlayerStats;
  targetId?: string; // monster or player
  targetType?: 'monster' | 'player' | 'bot';
  lastActionTime: number;
  strategy: 'aggressive' | 'cautious' | 'looter';
  fleeThreshold: number; // 0.2 to 0.4
  huntingRisk: 'safe' | 'risky';
  attackRange: number;
  lastHealTime?: number;
}

const BOT_NAMES = [
  'Faker', 'Ninja', 'Shroud', 'Doublelift', 'Bjergsen',
  'TenZ', 'S1mple', 'ZywOo', 'Tox1c', 'NoobMaster69',
  'LordKilla', 'ShadowGamer', 'xXx_Sniper_xXx', 'Kacchan',
  'PewPew', 'Goku123', 'DarkKnight', 'Asuna', 'Kirito'
];

export function generateBots(count: number, spawnPoint: Position): BotInstance[] {
  const bots: BotInstance[] = [];
  const vocations: Vocation[] = ['Knight', 'Sorcerer', 'Paladin', 'Druid'];
  const strategies: ('aggressive' | 'cautious' | 'looter')[] = ['aggressive', 'cautious', 'looter'];

  for (let i = 0; i < count; i++) {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + (Math.random() > 0.5 ? Math.floor(Math.random() * 99) : '');
    const vocation = vocations[Math.floor(Math.random() * vocations.length)];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const attackRange = vocation === 'Knight' ? 1 : (vocation === 'Paladin' ? 4 : 5);

    bots.push({
      id: `bot_${Date.now()}_${i}`,
      name,
      vocation,
      position: { 
        x: spawnPoint.x + Math.floor(Math.random() * 20) - 10,
        y: spawnPoint.y + Math.floor(Math.random() * 20) - 10 
      },
      direction: Direction.SOUTH,
      stats: {
        level: 1,
        experience: 0,
        experienceToNext: 100,
        health: 150,
        maxHealth: 150,
        mana: 50,
        maxMana: 50,
        attack: 10,
        defense: 5,
        magicAttack: 10,
        magicDefense: 5,
        speed: 3 + Math.random() * 2,
        skillPoints: 0
      },
      lastActionTime: Date.now(),
      strategy,
      fleeThreshold: 0.2 + Math.random() * 0.2, // between 20% and 40%
      huntingRisk: Math.random() > 0.5 ? 'safe' : 'risky',
      attackRange
    });
  }

  return bots;
}
