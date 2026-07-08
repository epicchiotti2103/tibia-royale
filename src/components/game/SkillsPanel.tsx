'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { getSkill, SKILL_HOTKEYS } from '@/lib/game/skills';
import type { SkillDef } from '@/lib/game/skills';

export default function SkillsPanel() {
  const player = useGameStore((s) => s.player);
  const castSkill = useGameStore((s) => s.castSkill);
  const skillCooldowns = useGameStore((s) => s.skillCooldowns);
  const buffEndTime = useGameStore((s) => s.buffEndTime);
  const skillUpgrades = useGameStore((s) => s.skillUpgrades);
  const equippedSkillIds = useGameStore((s) => s.equippedSkillIds);
  const toggleSkillPanel = useGameStore((s) => s.toggleSkillPanel);
  const [tick, setTick] = useState(0);

  // Force re-render for cooldown timers
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(interval);
  }, []);

  if (!player) return null;

  const now = Date.now();
  const hasBuff = now < buffEndTime;
  const sp = player.stats.skillPoints || 0;

  // Get equipped skill definitions
  const equippedSkills: (SkillDef | undefined)[] = [];
  for (let i = 0; i < 3; i++) {
    const id = equippedSkillIds[i];
    equippedSkills.push(id ? getSkill(id) : undefined);
  }

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-end gap-1 mb-1">
        {/* Basic Attack Slot */}
        <div className="relative group">
          <button
            onClick={() => useGameStore.getState().attackMonster()}
            className="w-12 h-12 rounded-lg border-2 border-amber-600 bg-gray-900/90 hover:bg-gray-800 hover:border-amber-400 cursor-pointer hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center"
            title="Basic Attack (Space)"
          >
            <span className="text-xl leading-none">⚔️</span>
            <span className="text-[8px] text-amber-400 leading-none mt-0.5 font-bold">SPC</span>
          </button>
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-40 shadow-xl">
              <div className="font-bold text-sm text-amber-400">⚔️ Basic Attack</div>
              <div className="text-[10px] text-gray-400 mt-1">Attack with your weapon.</div>
              <div className="text-[10px] text-gray-500 mt-1">Press <span className="text-amber-300">Space</span></div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-amber-700/30 mx-1 self-center" />

        {/* Equipped Skill slots - I, O, P */}
        {equippedSkills.map((skill, index) => {
          const hotkey = SKILL_HOTKEYS[index] || '?';

          // Empty slot
          if (!skill) {
            return (
              <div key={`empty-${index}`} className="relative group">
                <button
                  onClick={toggleSkillPanel}
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-500 cursor-pointer transition-all flex flex-col items-center justify-center"
                  title="Open Skill Panel (K) to equip a skill"
                >
                  <span className="text-lg leading-none text-gray-600">+</span>
                  <span className="text-[8px] text-gray-500 leading-none mt-0.5 font-bold">{hotkey}</span>
                </button>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                  <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-40 shadow-xl">
                    <div className="font-bold text-sm text-gray-400">Empty Slot ({hotkey})</div>
                    <div className="text-[10px] text-gray-500 mt-1">Press <span className="text-amber-300">K</span> to equip a skill</div>
                  </div>
                </div>
              </div>
            );
          }

          const lastUsed = skillCooldowns[skill.id] || 0;
          const isOnCooldown = now - lastUsed < skill.cooldown;
          const cooldownRemaining = isOnCooldown ? Math.ceil((skill.cooldown - (now - lastUsed)) / 1000) : 0;
          const cooldownPercent = isOnCooldown ? ((now - lastUsed) / skill.cooldown) * 100 : 0;
          const isLocked = player.stats.level < skill.levelReq;
          const canAfford = player.stats.mana >= skill.manaCost;
          const upgradeLevel = skillUpgrades[skill.id] || 0;

          return (
            <div key={skill.id} className="relative group">
              <button
                onClick={() => !isLocked && !isOnCooldown && castSkill(index)}
                disabled={isLocked || isOnCooldown}
                className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden
                  ${isLocked ? 'border-gray-700 bg-gray-900/50 opacity-40 cursor-not-allowed' :
                    isOnCooldown ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' :
                    canAfford ? 'border-amber-600 bg-gray-900/90 hover:bg-gray-800 hover:border-amber-400 cursor-pointer hover:scale-110 active:scale-95' :
                    'border-blue-900 bg-gray-900/90 cursor-pointer hover:scale-110 active:scale-95'}`}
              >
                <span className="text-xl leading-none">{skill.icon}</span>
                <span className="text-[8px] text-amber-300 leading-none mt-0.5 font-bold">{hotkey}</span>

                {/* Cooldown overlay with sweep */}
                {isOnCooldown && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24" cy="24" r="22"
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="24" cy="24" r="22"
                        fill="none"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - cooldownPercent / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-white text-sm font-bold relative z-10">{cooldownRemaining}</span>
                  </div>
                )}

                {/* Mana cost bar at bottom */}
                {!isLocked && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${canAfford ? 'bg-blue-500/50' : 'bg-red-500/50'}`}
                  />
                )}
                {/* Upgrade level indicator */}
                {!isLocked && upgradeLevel > 0 && (
                  <div className="absolute top-0 left-0 text-[7px] text-yellow-400 font-bold bg-black/70 rounded-br px-0.5">
                    +{upgradeLevel}
                  </div>
                )}
              </button>

              {/* Tooltip */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-48 shadow-xl">
                  <div className="font-bold text-sm" style={{ color: skill.color }}>
                    {skill.icon} {skill.name}
                    {upgradeLevel > 0 && <span className="text-yellow-400 ml-1">+{upgradeLevel}</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{skill.description}</div>
                  <div className="flex gap-3 mt-1 text-[10px]">
                    <span className="text-blue-400">💧 {skill.manaCost} MP</span>
                    <span className="text-gray-400">⏱️ {skill.cooldown / 1000}s</span>
                  </div>
                  {skill.damage && (
                    <div className="text-[10px] text-red-400 mt-1">
                      ⚔️ ~{Math.floor(skill.damage * (1 + upgradeLevel * 0.2))} dmg
                      {upgradeLevel > 0 && ` (↑${upgradeLevel * 20}%)`}
                    </div>
                  )}
                  {skill.healAmount && (
                    <div className="text-[10px] text-green-400 mt-1">
                      💚 ~{Math.floor(skill.healAmount * (1 + upgradeLevel * 0.2))} heal
                      {upgradeLevel > 0 && ` (↑${upgradeLevel * 20}%)`}
                    </div>
                  )}
                  <div className="text-[10px] text-amber-300 mt-1">Press <span className="text-amber-100 font-bold">{hotkey}</span> or click</div>
                  {isLocked && (
                    <div className="text-[10px] text-red-400 mt-1">🔒 Requires Level {skill.levelReq}</div>
                  )}
                  {skill.type === 'attack' && (
                    <div className="text-[10px] text-gray-500 mt-1">Range: {skill.range} tile{skill.range > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Skill Panel Toggle Button */}
        <div className="relative group">
          <button
            onClick={toggleSkillPanel}
            className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 ${
              sp > 0
                ? 'border-yellow-500 bg-yellow-900/30 hover:bg-yellow-900/50 cursor-pointer animate-pulse'
                : 'border-gray-600 bg-gray-900/90 hover:bg-gray-800 hover:border-gray-400 cursor-pointer'
            }`}
            title="Open Skill Panel (K)"
          >
            <span className="text-xl leading-none">{sp > 0 ? '⭐' : '📋'}</span>
            <span className="text-[8px] text-gray-300 leading-none mt-0.5 font-bold">K</span>
          </button>
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-44 shadow-xl">
              <div className="font-bold text-sm text-amber-400">⭐ Skill Panel</div>
              <div className="text-[10px] text-gray-400 mt-1">Manage skills, equip/unequip, spend points.</div>
              <div className="text-[10px] text-gray-500 mt-1">Press <span className="text-amber-300">K</span> to open</div>
              {sp > 0 && (
                <div className="text-[10px] text-yellow-400 mt-1 font-bold">🔥 {sp} points available!</div>
              )}
            </div>
          </div>
        </div>

        {/* Buff indicator */}
        {hasBuff && (
          <div className="ml-1 px-2 py-1 bg-orange-600/30 border border-orange-500/50 rounded text-[10px] text-orange-300 font-bold animate-pulse">
            ⚔️ ATK+
          </div>
        )}

        {/* Separator */}
        <div className="w-px h-8 bg-gray-600/30 mx-1 self-center" />

        {/* Quick potion slots */}
        <QuickPotionSlot type="hp" />
        <QuickPotionSlot type="mp" />
      </div>
    </div>
  );
}

function QuickPotionSlot({ type }: { type: 'hp' | 'mp' }) {
  const player = useGameStore((s) => s.player);
  const consumeInventoryItem = useGameStore((s) => s.consumeInventoryItem);

  if (!player) return null;

  const isHP = type === 'hp';
  const count = player.inventory
    .filter(i => isHP ? i.itemId.startsWith('health_potion') : i.itemId.startsWith('mana_potion'))
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleUse = () => {
    const potions = player.inventory.filter(i =>
      isHP ? i.itemId.startsWith('health_potion') : i.itemId.startsWith('mana_potion')
    ).sort((a, b) => {
      const order = isHP
        ? ['health_potion_ultra', 'health_potion_large', 'health_potion_grand', 'health_potion_medium', 'health_potion_small']
        : ['mana_potion_ultra', 'mana_potion_large', 'mana_potion_grand', 'mana_potion_medium', 'mana_potion_small'];
      return order.indexOf(a.itemId) - order.indexOf(b.itemId);
    });

    if (potions.length > 0) {
      consumeInventoryItem(potions[0].id);
    }
  };

  const isDisabled = count === 0;
  const isNeeded = isHP
    ? player.stats.health < player.stats.maxHealth * 0.8
    : player.stats.mana < player.stats.maxMana * 0.5;

  return (
    <div className="relative group">
      <button
        onClick={handleUse}
        disabled={isDisabled}
        className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden
          ${isDisabled ? 'border-gray-700 bg-gray-900/50 opacity-40 cursor-not-allowed' :
            isNeeded ? 'border-green-600 bg-gray-900/90 hover:bg-gray-800 hover:border-green-400 cursor-pointer hover:scale-110 active:scale-95 animate-pulse' :
            'border-gray-600 bg-gray-900/90 hover:bg-gray-800 hover:border-gray-400 cursor-pointer hover:scale-110 active:scale-95'}`}
      >
        <span className="text-xl leading-none">{isHP ? '❤️' : '💧'}</span>
        <span className="text-[8px] text-gray-300 leading-none mt-0.5 font-bold">Q{isHP ? '1' : '2'}</span>
        {count > 0 && (
          <div className="absolute top-0.5 right-1 text-[7px] text-white font-bold bg-black/50 rounded px-0.5">
            {count}
          </div>
        )}
      </button>
      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 w-40 shadow-xl">
          <div className="font-bold text-sm" style={{ color: isHP ? '#e74c3c' : '#3498db' }}>
            {isHP ? '❤️ Health Potion' : '💧 Mana Potion'}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {count > 0 ? `${count} potion${count > 1 ? 's' : ''} available` : 'No potions!'}
          </div>
          <div className="text-[10px] text-amber-300 mt-1">Press <span className="text-amber-100 font-bold">Q{isHP ? '1' : '2'}</span> or click</div>
        </div>
      </div>
    </div>
  );
}