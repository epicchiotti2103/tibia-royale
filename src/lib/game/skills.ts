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

export const SKILL_HOTKEYS = ['I', 'O', 'P'] as const;

export const SKILLS: SkillDef[] = [
  // Knight skills (melee-focused, lower damage but tanky)
  {
    id: 'berserk',
    name: 'Berserk',
    description: 'Unleash a powerful area attack hitting all adjacent enemies.',
    icon: '💥',
    manaCost: 20,
    cooldown: 4000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.KNIGHT],
    levelReq: 5,
    damage: 25,
    color: '#e74c3c',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind Strike',
    description: 'Spin attack dealing damage to all surrounding enemies.',
    icon: '🌪️',
    manaCost: 35,
    cooldown: 6000,
    type: 'attack',
    range: 2,
    vocation: [Vocation.KNIGHT],
    levelReq: 15,
    damage: 45,
    color: '#c0392b',
  },
  {
    id: 'war_cry',
    name: 'War Cry',
    description: 'Boost your attack power temporarily.',
    icon: '📯',
    manaCost: 15,
    cooldown: 20000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.KNIGHT],
    levelReq: 10,
    color: '#e67e22',
  },

  // Sorcerer skills (RANGED, high damage, fast casting)
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a devastating ball of fire. Fast and powerful!',
    icon: '🔥',
    manaCost: 20,
    cooldown: 1000,
    type: 'attack',
    range: 6,
    vocation: [Vocation.SORCERER],
    levelReq: 1,
    damage: 70,
    color: '#e74c3c',
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Call down devastating lightning from the sky.',
    icon: '⚡',
    manaCost: 45,
    cooldown: 2000,
    type: 'attack',
    range: 7,
    vocation: [Vocation.SORCERER],
    levelReq: 8,
    damage: 140,
    color: '#f1c40f',
  },
  {
    id: 'energy_beam',
    name: 'Energy Beam',
    description: 'Devastating beam of pure energy that annihilates foes.',
    icon: '💫',
    manaCost: 70,
    cooldown: 3500,
    type: 'attack',
    range: 9,
    vocation: [Vocation.SORCERER],
    levelReq: 15,
    damage: 280,
    color: '#9b59b6',
  },

  // Druid skills (healer/support with some AoE)
  {
    id: 'heal',
    name: 'Heal',
    description: 'Restore health with the power of nature.',
    icon: '💚',
    manaCost: 15,
    cooldown: 1500,
    type: 'heal',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 1,
    healAmount: 80,
    color: '#2ecc71',
  },
  {
    id: 'heal_area',
    name: "Nature's Blessing",
    description: 'Powerful healing spell restoring significant health.',
    icon: '🌿',
    manaCost: 40,
    cooldown: 4500,
    type: 'heal',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 8,
    healAmount: 200,
    color: '#27ae60',
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'Shake the earth damaging nearby enemies.',
    icon: '🌋',
    manaCost: 50,
    cooldown: 5000,
    type: 'attack',
    range: 3,
    vocation: [Vocation.DRUID],
    levelReq: 12,
    damage: 60,
    color: '#8B4513',
  },

  // Paladin skills (ranged physical + some healing)
  {
    id: 'holy_arrow',
    name: 'Holy Arrow',
    description: 'Fire a blessed arrow at your target.',
    icon: '🏹',
    manaCost: 12,
    cooldown: 1200,
    type: 'attack',
    range: 6,
    vocation: [Vocation.PALADIN],
    levelReq: 1,
    damage: 30,
    color: '#f1c40f',
  },
  {
    id: 'divine_strike',
    name: 'Divine Strike',
    description: 'A holy melee attack with bonus damage.',
    icon: '✝️',
    manaCost: 25,
    cooldown: 3000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.PALADIN],
    levelReq: 8,
    damage: 50,
    color: '#ecf0f1',
  },
  {
    id: 'holy_light',
    name: 'Holy Light',
    description: 'Divine healing that restores health.',
    icon: '🌟',
    manaCost: 20,
    cooldown: 4000,
    type: 'heal',
    range: 0,
    vocation: [Vocation.PALADIN],
    levelReq: 5,
    healAmount: 100,
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