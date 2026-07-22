import { Position, Direction, Vocation, PlayerStats, calculateStats } from './types';

export interface BotInstance {
  id: string;
  name: string;
  vocation: Vocation;
  position: Position;
  direction: Direction;
  stats: PlayerStats;
  targetId?: string; // monster or player
  targetType?: 'monster' | 'player' | 'bot' | 'loot';
  lastMoveTime: number;
  lastAttackTime: number;
  strategy: 'aggressive' | 'cautious' | 'looter';
  fleeThreshold: number; // 0.2 to 0.4
  huntingRisk: 'safe' | 'risky';
  attackRange: number;
  lastHealTime?: number;
  isLooter: boolean;
}

const BOT_NAMES = [
  'Faker', 'Ninja', 'Shroud', 'Doublelift', 'Bjergsen',
  'TenZ', 'S1mple', 'ZywOo', 'Tox1c', 'NoobMaster69',
  'LordKilla', 'ShadowGamer', 'xXx_Sniper_xXx', 'Kacchan',
  'PewPew', 'Goku123', 'DarkKnight', 'Asuna', 'Kirito',
  'Gaules', 'Fallen', 'Coldzera', 'Fer', 'Taco',
  'Alanzoka', 'Jukes', 'Yoda', 'Kami', 'BRTT',
  'Baiano', 'Pimpimenta', 'Rakin', 'Hastad', 'Jovi',
  'Coringa', 'Loud_Babi', 'Nobru', 'Cerol', 'Piuzinho',
  'Patife', 'DavyJones', 'BRKsEDU', 'Zangado', 'RatoBorrachudo',
  'Cellbit', 'Felps', 'MtAspirina', 'Gordox', 'Lindinho'
];

export function generateBots(count: number, spawnPoint: Position, riskyRatio: number = 0.5, looterRatio: number = 0.3): BotInstance[] {
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
      stats: calculateStats(vocation, 1),
      lastMoveTime: Date.now(),
      lastAttackTime: Date.now(),
      strategy,
      fleeThreshold: 0.2 + Math.random() * 0.2, // between 20% and 40%
      huntingRisk: Math.random() < riskyRatio ? 'risky' : 'safe',
      attackRange,
      isLooter: Math.random() < looterRatio
    });
  }

  return bots;
}
