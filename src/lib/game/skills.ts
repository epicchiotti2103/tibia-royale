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
export const MAX_EQUIPPED_SKILLS = 3;

export const SKILLS: SkillDef[] = [
  // =============================================
  // KNIGHT SKILLS (6 total - melee, tanky, area)
  // =============================================
  {
    id: 'berserk',
    name: 'Berserk',
    description: 'Unleash a powerful area attack hitting all adjacent enemies.',
    icon: '💥',
    manaCost: 30,
    cooldown: 6000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.KNIGHT],
    levelReq: 5,
    damage: 10,
    color: '#e74c3c',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind Strike',
    description: 'Spin attack dealing damage to all surrounding enemies.',
    icon: '🌪️',
    manaCost: 50,
    cooldown: 9000,
    type: 'attack',
    range: 2,
    vocation: [Vocation.KNIGHT],
    levelReq: 15,
    damage: 18,
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
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Bash enemies with your shield, stunning them briefly.',
    icon: '🛡️',
    manaCost: 20,
    cooldown: 4000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.KNIGHT],
    levelReq: 3,
    damage: 12,
    color: '#7f8c8d',
  },
  {
    id: 'cleave',
    name: 'Cleave',
    description: 'A devastating overhead strike that cleaves through armor.',
    icon: '🪓',
    manaCost: 40,
    cooldown: 7000,
    type: 'attack',
    range: 1,
    vocation: [Vocation.KNIGHT],
    levelReq: 20,
    damage: 25,
    color: '#a93226',
  },
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Harden your body, greatly reducing damage taken.',
    icon: '🏋️',
    manaCost: 25,
    cooldown: 25000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.KNIGHT],
    levelReq: 25,
    color: '#95a5a6',
  },

  // =============================================
  // SORCERER SKILLS (6 total - ranged, high damage)
  // =============================================
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Hurl a devastating ball of fire. Fast and powerful!',
    icon: '🔥',
    manaCost: 15,
    cooldown: 600,
    type: 'attack',
    range: 6,
    vocation: [Vocation.SORCERER],
    levelReq: 1,
    damage: 35,
    color: '#e74c3c',
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Call down devastating lightning from the sky.',
    icon: '⚡',
    manaCost: 30,
    cooldown: 1200,
    type: 'attack',
    range: 7,
    vocation: [Vocation.SORCERER],
    levelReq: 8,
    damage: 55,
    color: '#f1c40f',
  },
  {
    id: 'energy_beam',
    name: 'Energy Beam',
    description: 'Devastating beam of pure energy that annihilates foes.',
    icon: '💫',
    manaCost: 50,
    cooldown: 2000,
    type: 'attack',
    range: 9,
    vocation: [Vocation.SORCERER],
    levelReq: 15,
    damage: 80,
    color: '#9b59b6',
  },
  {
    id: 'ice_wave',
    name: 'Ice Wave',
    description: 'Send a freezing wave that damages and slows enemies.',
    icon: '❄️',
    manaCost: 25,
    cooldown: 3000,
    type: 'attack',
    range: 3,
    vocation: [Vocation.SORCERER],
    levelReq: 5,
    damage: 30,
    color: '#00bcd4',
  },
  {
    id: 'meteor',
    name: 'Meteor Strike',
    description: 'Call a meteor from the heavens, devastating a large area.',
    icon: '☄️',
    manaCost: 80,
    cooldown: 8000,
    type: 'attack',
    range: 5,
    vocation: [Vocation.SORCERER],
    levelReq: 22,
    damage: 120,
    color: '#ff5722',
  },
  {
    id: 'arcane_shield',
    name: 'Arcane Shield',
    description: 'Create a magical barrier that absorbs damage.',
    icon: '🔮',
    manaCost: 35,
    cooldown: 30000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.SORCERER],
    levelReq: 18,
    color: '#7c4dff',
  },

  // =============================================
  // DRUID SKILLS (6 total - healer/support/AoE)
  // =============================================
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
    damage: 30,
    color: '#8B4513',
  },
  {
    id: 'thorns',
    name: 'Thorn Shield',
    description: 'Surround yourself with thorns that damage attackers.',
    icon: '🌵',
    manaCost: 20,
    cooldown: 15000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 5,
    color: '#4caf50',
  },
  {
    id: 'nature_wrath',
    name: "Nature's Wrath",
    description: 'Command vines to ensnare and damage all nearby foes.',
    icon: '🐍',
    manaCost: 60,
    cooldown: 6000,
    type: 'attack',
    range: 4,
    vocation: [Vocation.DRUID],
    levelReq: 18,
    damage: 50,
    color: '#1b5e20',
  },
  {
    id: 'rejuvenation',
    name: 'Rejuvenation',
    description: 'Massive heal that restores a large portion of your health.',
    icon: '🌸',
    manaCost: 70,
    cooldown: 12000,
    type: 'heal',
    range: 0,
    vocation: [Vocation.DRUID],
    levelReq: 20,
    healAmount: 500,
    color: '#e91e63',
  },

  // =============================================
  // PALADIN SKILLS (6 total - ranged physical + heal)
  // =============================================
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
    damage: 20,
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
    damage: 25,
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
  {
    id: 'multi_shot',
    name: 'Multi Shot',
    description: 'Fire a volley of arrows hitting multiple enemies.',
    icon: '🎯',
    manaCost: 35,
    cooldown: 5000,
    type: 'attack',
    range: 5,
    vocation: [Vocation.PALADIN],
    levelReq: 12,
    damage: 20,
    color: '#ff9800',
  },
  {
    id: 'divine_judgment',
    name: 'Divine Judgment',
    description: 'Call down holy energy to smite a powerful foe.',
    icon: '⚡',
    manaCost: 55,
    cooldown: 7000,
    type: 'attack',
    range: 7,
    vocation: [Vocation.PALADIN],
    levelReq: 20,
    damage: 45,
    color: '#ffeb3b',
  },
  {
    id: 'consecration',
    name: 'Consecration',
    description: 'Bless the ground, boosting your attack and defense.',
    icon: '⛪',
    manaCost: 30,
    cooldown: 20000,
    type: 'buff',
    range: 0,
    vocation: [Vocation.PALADIN],
    levelReq: 15,
    color: '#ffc107',
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
    case 'cleave':
    case 'multi_shot':
      return 'whirlwind';
    case 'fireball':
    case 'energy_beam':
    case 'ice_wave':
    case 'holy_arrow':
    case 'divine_strike':
    case 'divine_judgment':
      return 'projectile';
    case 'lightning':
    case 'meteor':
      return 'lightning';
    case 'earthquake':
    case 'nature_wrath':
      return 'earthquake';
    case 'war_cry':
    case 'iron_skin':
    case 'thorns':
    case 'arcane_shield':
    case 'consecration':
      return 'war_cry';
    default:
      return 'explosion';
  }
}