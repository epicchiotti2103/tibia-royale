// =============================================
// Tibia-Style Game - Skill Definitions
// =============================================

import { Vocation } from './types';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  manaCost: number;
  cooldown: number; // ms
  type: 'attack' | 'heal' | 'buff';
  range: number;
  vocation: Vocation[];
  levelReq: number;
  damage?: number;
  healAmount?: number;
  color: string;
}

export const SKILLS: SkillDef[] = [
  // Knight skills
  {
    id: 'berserk',
    name: 'Berserk',
    description: 'Unleash a powerful area attack hitting all adjacent enemies.',
    icon: '💥',
    manaCost: 20,
    cooldown: 3000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.KNIGHT],
    levelReq: 5,
    damage: 30,
    color: '#e74c3c',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind Strike',
    description: 'Spin attack dealing damage to all surrounding enemies.',
    icon: '🌪️',
    manaCost: 35,
    cooldown: 5000,
    type: 'attack',
    range: 2,
    vocation: [Vocation.KNIGHT],
    levelReq: 15,
    damage: 50,
    color: '#c0392b',
  },
  {
    id: 'war_cry',
    name: 'War Cry',
    description: 'Boost your attack power temporarily.',
    icon: '📯',
    manaCost: 15,
    cooldown: 15000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.KNIGHT],
    levelReq: 10,
    color: '#e67e22',
  },

  // Sorcerer skills
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a ball of fire at your target.',
    icon: '🔥',
    manaCost: 25,
    cooldown: 2000,
    type: 'attack',
    range: 5,
    vocation: [Vocation.SORCERER],
    levelReq: 3,
    damage: 40,
    color: '#e74c3c',
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Call down lightning on your enemies.',
    icon: '⚡',
    manaCost: 50,
    cooldown: 4000,
    type: 'attack',
    range: 6,
    vocation: [Vocation.SORCERER],
    levelReq: 12,
    damage: 80,
    color: '#f1c40f',
  },
  {
    id: 'energy_beam',
    name: 'Energy Beam',
    description: 'Devastating beam of pure energy.',
    icon: '💫',
    manaCost: 80,
    cooldown: 8000,
    type: 'attack',
    range: 8,
    vocation: [Vocation.SORCERER],
    levelReq: 20,
    damage: 150,
    color: '#9b59b6',
  },

  // Druid skills
  {
    id: 'heal',
    name: 'Heal',
    description: 'Restore health with the power of nature.',
    icon: '💚',
    manaCost: 20,
    cooldown: 2000,
    type: 'heal',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 1,
    healAmount: 60,
    color: '#2ecc71',
  },
  {
    id: 'heal_area',
    name: "Nature's Blessing",
    description: 'Powerful healing spell restoring significant health.',
    icon: '🌿',
    manaCost: 45,
    cooldown: 5000,
    type: 'heal',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 10,
    healAmount: 150,
    color: '#27ae60',
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'Shake the earth damaging nearby enemies.',
    icon: '🌋',
    manaCost: 60,
    cooldown: 6000,
    type: 'attack',
    range: 3,
    vocation: [Vocation.DRUID],
    levelReq: 15,
    damage: 45,
    color: '#8B4513',
  },

  // Paladin skills
  {
    id: 'holy_arrow',
    name: 'Holy Arrow',
    description: 'Fire a blessed arrow at your target.',
    icon: '🏹',
    manaCost: 15,
    cooldown: 1500,
    type: 'attack',
    range: 5,
    vocation: [Vocation.PALADIN],
    levelReq: 3,
    damage: 25,
    color: '#f1c40f',
  },
  {
    id: 'divine_strike',
    name: 'Divine Strike',
    description: 'A holy melee attack with bonus damage.',
    icon: '✝️',
    manaCost: 30,
    cooldown: 3000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.PALADIN],
    levelReq: 8,
    damage: 45,
    color: '#ecf0f1',
  },
  {
    id: 'holy_light',
    name: 'Holy Light',
    description: 'Divine healing that restores health.',
    icon: '🌟',
    manaCost: 25,
    cooldown: 4000,
    type: 'heal',
    range: 0,
    vocation: [Vocation.PALADIN],
    levelReq: 5,
    healAmount: 80,
    color: '#f39c12',
  },
];

export function getSkillsForVocation(vocation: Vocation): SkillDef[] {
  return SKILLS.filter(s => s.vocation.includes(vocation));
}

export function getSkill(id: string): SkillDef | undefined {
  return SKILLS.find(s => s.id === id);
}

// Map skill IDs to their visual effect type
export function getSkillEffectType(skillId: string): 'sword_slash' | 'projectile' | 'explosion' | 'heal_aura' | 'whirlwind' | 'lightning' | 'earthquake' | 'war_cry' {
  switch (skillId) {
    case 'berserk':
    case 'whirlwind':
      return 'whirlwind';
    case 'fireball':
    case 'energy_beam':
      return 'projectile';
    case 'lightning':
      return 'lightning';
    case 'earthquake':
      return 'earthquake';
    case 'war_cry':
      return 'war_cry';
    default:
      return 'explosion';
  }
}