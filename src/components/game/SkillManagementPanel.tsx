'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import { getSkillsForVocation, getSkill, MAX_EQUIPPED_SKILLS, SKILL_HOTKEYS } from '@/lib/game/skills';
import type { SkillDef } from '@/lib/game/skills';

export default function SkillManagementPanel() {
  const showSkillPanel = useGameStore((s) => s.showSkillPanel);
  const toggleSkillPanel = useGameStore((s) => s.toggleSkillPanel);
  const player = useGameStore((s) => s.player);
  const equippedSkillIds = useGameStore((s) => s.equippedSkillIds);
  const equipSkill = useGameStore((s) => s.equipSkill);
  const unequipSkill = useGameStore((s) => s.unequipSkill);
  const skillUpgrades = useGameStore((s) => s.skillUpgrades);
  const upgradeSkill = useGameStore((s) => s.upgradeSkill);

  if (!showSkillPanel || !player) return null;

  const allSkills = getSkillsForVocation(player.vocation);
  const sp = player.stats.skillPoints || 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-amber-700/60 rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <h2 className="text-lg font-bold text-amber-400">Skill Management</h2>
              <p className="text-[11px] text-gray-400">
                {player.vocation} — Equip up to {MAX_EQUIPPED_SKILLS} skills for I/O/P
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Skill Points Display */}
            <div className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold ${sp > 0 ? 'border-yellow-500 bg-yellow-900/40 text-yellow-300 animate-pulse' : 'border-gray-600 bg-gray-800 text-gray-500'}`}>
              ⭐ {sp} Skill Points
            </div>
            <button
              onClick={toggleSkillPanel}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Skill Points Explanation */}
        {sp > 0 && (
          <div className="px-4 py-2 bg-yellow-900/20 border-b border-yellow-800/30">
            <p className="text-[11px] text-yellow-400">
              💡 You have <strong>{sp} skill points</strong> to spend! Click the <strong className="text-yellow-200">&quot;+&quot; button</strong> on an equipped skill to make it stronger. Each point gives +20% damage, -6% mana cost, -5% cooldown. All equipped skills auto-improve on level up too!
            </p>
          </div>
        )}

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {allSkills.map((skill) => {
            const isEquipped = equippedSkillIds.includes(skill.id);
            const upgradeLevel = skillUpgrades[skill.id] || 0;
            const isLocked = player.stats.level < skill.levelReq;
            const isMaxed = upgradeLevel >= 10;
            const canEquip = !isEquipped && !isLocked && equippedSkillIds.length < MAX_EQUIPPED_SKILLS;

            // Calculate effective stats with upgrades
            const upgradeDmgMult = 1 + upgradeLevel * 0.20;
            const upgradeManaMult = Math.max(0.4, 1 - upgradeLevel * 0.06);
            const upgradeCdMult = Math.max(0.4, 1 - upgradeLevel * 0.05);

            return (
              <div
                key={skill.id}
                className={`rounded-lg border p-3 transition-all ${
                  isEquipped
                    ? 'border-amber-600/70 bg-amber-950/20 shadow-inner'
                    : isLocked
                    ? 'border-gray-800 bg-gray-900/30 opacity-50'
                    : 'border-gray-700 bg-gray-800/40 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Skill Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
                    isEquipped ? 'bg-amber-900/40 border border-amber-600/50' : 'bg-gray-800 border border-gray-700'
                  }`}>
                    {skill.icon}
                  </div>

                  {/* Skill Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: isLocked ? '#555' : skill.color }}>
                        {skill.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-400 font-bold border border-amber-700/50">
                          EQUIPPED
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-bold border border-gray-700">
                          🔒 LVL {skill.levelReq}
                        </span>
                      )}
                      {skill.type === 'attack' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">ATK</span>
                      )}
                      {skill.type === 'heal' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">HEAL</span>
                      )}
                      {skill.type === 'buff' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400">BUFF</span>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400 mt-0.5">{skill.description}</p>

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                      <span className="text-blue-400">💧 {Math.floor(skill.manaCost * upgradeManaMult)} MP</span>
                      <span className="text-gray-400">⏱️ {(skill.cooldown * upgradeCdMult / 1000).toFixed(1)}s</span>
                      {skill.range > 0 && (
                        <span className="text-gray-500">📏 {skill.range} tiles</span>
                      )}
                      {skill.damage && (
                        <span className="text-red-400">⚔️ ~{Math.floor(skill.damage * upgradeDmgMult)} dmg</span>
                      )}
                      {skill.healAmount && (
                        <span className="text-green-400">💚 ~{Math.floor(skill.healAmount * upgradeDmgMult)} heal</span>
                      )}
                    </div>

                    {/* Upgrade Progress Bar */}
                    {(isEquipped || upgradeLevel > 0) && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] text-gray-500 w-6">Lvl</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${upgradeLevel * 10}%`,
                              background: isMaxed
                                ? 'linear-gradient(90deg, #ffd700, #ffaa00)'
                                : upgradeLevel > 0
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : '#374151',
                            }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${isMaxed ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {upgradeLevel}/10
                        </span>
                        {!isMaxed && upgradeLevel > 0 && (
                          <span className="text-[9px] text-green-400">
                            +{upgradeLevel * 20}% dmg
                          </span>
                        )}
                        {isMaxed && (
                          <span className="text-[9px] text-yellow-400">MAX</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {/* Equip/Unequip Button */}
                    {isEquipped ? (
                      <button
                        onClick={() => unequipSkill(skill.id)}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-600 transition-colors w-16"
                        title="Remove from hotbar"
                      >
                        Unequip
                      </button>
                    ) : (
                      <button
                        onClick={() => equipSkill(skill.id)}
                        disabled={!canEquip && !isLocked}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors w-16 ${
                          isLocked
                            ? 'bg-gray-900 text-gray-600 border-gray-700 cursor-not-allowed'
                            : canEquip
                            ? 'bg-green-900/30 text-green-400 border-green-700 hover:bg-green-900/50 hover:border-green-500 cursor-pointer'
                            : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                        }`}
                        title={
                          isLocked
                            ? `Requires level ${skill.levelReq}`
                            : equippedSkillIds.length >= MAX_EQUIPPED_SKILLS
                            ? 'Max skills equipped! Unequip one first.'
                            : 'Equip this skill'
                        }
                      >
                        {isLocked ? `Lvl ${skill.levelReq}` : equippedSkillIds.length >= MAX_EQUIPPED_SKILLS ? 'Full' : 'Equip'}
                      </button>
                    )}

                    {/* Upgrade Button */}
                    {isEquipped && !isLocked && (
                      <button
                        onClick={() => upgradeSkill(skill.id)}
                        disabled={isMaxed || sp <= 0}
                        className={`px-2 py-1.5 rounded text-sm font-bold border transition-all w-16 ${
                          isMaxed
                            ? 'bg-yellow-900/30 text-yellow-600 border-yellow-800 cursor-default'
                            : sp > 0
                            ? 'bg-yellow-900/40 text-yellow-300 border-yellow-600 hover:bg-yellow-800/50 hover:border-yellow-400 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-yellow-900/30'
                            : 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                        }`}
                        title={
                          isMaxed
                            ? 'Already at max level!'
                            : sp > 0
                            ? `Spend 1 SP to upgrade ${skill.name} (+20% dmg)`
                            : 'No skill points available'
                        }
                      >
                        {isMaxed ? 'MAX' : '+'}
                      </button>
                    )}

                    {/* Hotkey indicator */}
                    {isEquipped && (
                      <span className="text-[9px] text-gray-500">
                        {SKILL_HOTKEYS[equippedSkillIds.indexOf(skill.id)]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-700 bg-gray-900/80">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>
              Equipped: {equippedSkillIds.length}/{MAX_EQUIPPED_SKILLS}
              {equippedSkillIds.length > 0 && (
                <span className="text-gray-400 ml-1">
                  ({equippedSkillIds.map((id, i) => {
                    const sk = getSkill(id);
                    return `${SKILL_HOTKEYS[i]}:${sk?.name}`;
                  }).join(', ')})
                </span>
              )}
            </span>
            <span>Press <span className="text-amber-400 font-bold">K</span> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}