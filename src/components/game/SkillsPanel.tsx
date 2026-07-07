'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Vocation, PlayerData } from '@/lib/game/types';

interface SkillDef {
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

const SKILLS: SkillDef[] = [
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
    name: 'Nature\'s Blessing',
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

export default function SkillsPanel() {
  const player = useGameStore((s) => s.player);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const addDamageNumber = useGameStore((s) => s.addDamageNumber);
  const [isOpen, setIsOpen] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [buffActive, setBuffActive] = useState(false);

  if (!player) return null;

  const skills = getSkillsForVocation(player.vocation);

  const handleSkill = (skill: SkillDef) => {
    if (player.stats.mana < skill.manaCost) {
      addChatMessage({
        type: 'system',
        sender: 'Skills',
        content: `Not enough mana! Need ${skill.manaCost} MP.`,
        color: '#3498db',
      });
      return;
    }

    const now = Date.now();
    const lastUsed = cooldowns[skill.id] || 0;
    if (now - lastUsed < skill.cooldown) {
      const remaining = Math.ceil((skill.cooldown - (now - lastUsed)) / 1000);
      addChatMessage({
        type: 'system',
        sender: 'Skills',
        content: `${skill.name} is on cooldown! ${remaining}s remaining.`,
        color: '#e67e22',
      });
      return;
    }

    // Deduct mana
    useGameStore.setState((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            mana: Math.max(0, state.player.stats.mana - skill.manaCost),
          },
        },
      };
    });

    // Set cooldown
    setCooldowns(prev => ({ ...prev, [skill.id]: now }));

    // Execute skill effect
    const store = useGameStore.getState();

    if (skill.type === 'heal' && skill.healAmount) {
      const newHealth = Math.min(player.stats.maxHealth, player.stats.health + skill.healAmount);
      const healed = newHealth - player.stats.health;
      useGameStore.setState((state) => {
        if (!state.player) return state;
        return {
          player: {
            ...state.player,
            stats: {
              ...state.player.stats,
              health: newHealth,
            },
          },
        };
      });
      addDamageNumber(player.position, healed, 'heal');
      addChatMessage({
        type: 'combat',
        sender: 'Skill',
        content: `${skill.icon} ${skill.name}! Restored ${healed} HP.`,
        color: skill.color,
      });
    } else if (skill.type === 'attack' && skill.damage) {
      // Find monsters in range and damage them
      const monsters = store.monsters;
      let totalDamage = 0;
      let killCount = 0;

      for (const monster of monsters) {
        if (monster.isDead) continue;
        const dx = Math.abs(monster.position.x - player.position.x);
        const dy = Math.abs(monster.position.y - player.position.y);
        const dist = Math.max(dx, dy);

        if (dist <= skill.range) {
          const dmg = skill.damage + Math.floor(Math.random() * skill.damage * 0.3);
          totalDamage += dmg;
          addDamageNumber(monster.position, -dmg, 'damage');

          const newHealth = monster.health - dmg;
          if (newHealth <= 0) {
            killCount++;
            // Handle monster death (simplified)
            const monsterDef = MONSTERS_IMPORT[monster.definitionId];
            if (monsterDef) {
              addChatMessage({
                type: 'combat',
                sender: 'System',
                content: `${skill.icon} ${skill.name} killed ${monsterDef.name}! +${monsterDef.experience} XP`,
                color: '#f1c40f',
              });
            }
          }

          useGameStore.setState((state) => ({
            monsters: state.monsters.map(m =>
              m.id === monster.id
                ? { ...m, health: Math.max(0, newHealth), isDead: newHealth <= 0, deathTime: newHealth <= 0 ? Date.now() : undefined }
                : m
            ),
          }));
        }
      }

      if (totalDamage > 0) {
        addChatMessage({
          type: 'combat',
          sender: 'Skill',
          content: `${skill.icon} ${skill.name}! Dealt ${totalDamage} damage${killCount > 0 ? ` and killed ${killCount} monster${killCount > 1 ? 's' : ''}` : ''}.`,
          color: skill.color,
        });
      } else {
        addChatMessage({
          type: 'system',
          sender: 'Skill',
          content: `${skill.icon} ${skill.name}! No enemies in range.`,
          color: '#95a5a6',
        });
      }
    } else if (skill.type === 'buff') {
      setBuffActive(true);
      addChatMessage({
        type: 'combat',
        sender: 'Skill',
        content: `${skill.icon} ${skill.name}! Attack power increased!`,
        color: skill.color,
      });
      setTimeout(() => setBuffActive(false), 10000);
    }
  };

  return (
    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-20 ${isOpen ? '' : ''}`}>
      {/* Skill bar (always visible) */}
      <div className="flex items-end gap-1 mb-1">
        {skills.map((skill, index) => {
          const now = Date.now();
          const lastUsed = cooldowns[skill.id] || 0;
          const isOnCooldown = now - lastUsed < skill.cooldown;
          const cooldownRemaining = isOnCooldown ? Math.ceil((skill.cooldown - (now - lastUsed)) / 1000) : 0;
          const isLocked = player.stats.level < skill.levelReq;
          const canAfford = player.stats.mana >= skill.manaCost;

          return (
            <div key={skill.id} className="relative group">
              <button
                onClick={() => !isLocked && handleSkill(skill)}
                onKeyDown={(e) => {
                  if (e.key === `${index + 1}` && !isLocked) handleSkill(skill);
                }}
                disabled={isLocked || isOnCooldown}
                className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden
                  ${isLocked ? 'border-gray-700 bg-gray-900/50 opacity-40 cursor-not-allowed' :
                    isOnCooldown ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' :
                    canAfford ? 'border-amber-600 bg-gray-900/90 hover:bg-gray-800 hover:border-amber-400 cursor-pointer hover:scale-110 active:scale-95' :
                    'border-blue-900 bg-gray-900/90 cursor-pointer hover:scale-110 active:scale-95'}`}
                title={`${skill.name} (${skill.manaCost} MP) - Press ${index + 1} or F${index + 1}\n${skill.description}${skill.levelReq > 1 ? `\nRequires Level ${skill.levelReq}` : ''}`}
              >
                <span className="text-xl leading-none">{skill.icon}</span>
                <span className="text-[8px] text-gray-400 leading-none mt-0.5">{index + 1}</span>

                {/* Cooldown overlay */}
                {isOnCooldown && (
                  <div
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    <span className="text-white text-sm font-bold">{cooldownRemaining}</span>
                  </div>
                )}

                {/* Mana cost indicator */}
                {!isLocked && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/50" />
                )}
              </button>

              {/* Tooltip */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-48 shadow-xl">
                  <div className="font-bold text-sm" style={{ color: skill.color }}>
                    {skill.icon} {skill.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{skill.description}</div>
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <span className="text-blue-400">💧 {skill.manaCost} MP</span>
                    <span className="text-gray-400">⏱️ {skill.cooldown / 1000}s</span>
                  </div>
                  {skill.damage && (
                    <div className="text-[10px] text-red-400 mt-1">⚔️ ~{skill.damage} damage</div>
                  )}
                  {skill.healAmount && (
                    <div className="text-[10px] text-green-400 mt-1">💚 ~{skill.healAmount} healing</div>
                  )}
                  {isLocked && (
                    <div className="text-[10px] text-red-400 mt-1">🔒 Level {skill.levelReq} required</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Import monsters for skill damage calculations
import { MONSTERS as MONSTERS_IMPORT } from '@/lib/game/monsters';