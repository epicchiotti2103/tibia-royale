'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { ITEMS } from '@/lib/game/items';
import { EquipSlot } from '@/lib/game/types';
import { useIsMobile } from '@/hooks/use-mobile';

export default function GameHUD() {
  const player = useGameStore((s) => s.player);
  const matchPhase = useGameStore((s) => s.matchPhase);
  const matchTimeLeft = useGameStore((s) => s.matchTimeLeft);
  const toggleSkillPanel = useGameStore((s) => s.toggleSkillPanel);
  const savePlayer = useGameStore((s) => s.savePlayer);
  const isMobile = useIsMobile();
  const [saveFlash, setSaveFlash] = useState(false);

  const handleSave = async () => {
    await savePlayer();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const gameMinutes = Date.now() / 100;
      const totalGameHours = (gameMinutes / 60) % 24;
      const hours = Math.floor(totalGameHours);
      const minutes = Math.floor((totalGameHours - hours) * 60);

      let period: string;
      let icon: string;
      if (hours >= 6 && hours < 12) { period = 'Morning'; icon = '🌅'; }
      else if (hours >= 12 && hours < 18) { period = 'Afternoon'; icon = '☀️'; }
      else if (hours >= 18 && hours < 21) { period = 'Evening'; icon = '🌇'; }
      else { period = 'Night'; icon = '🌙'; }

      setTime(`${icon} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!player) return null;

  const { stats } = player;
  const hpPercent = (stats.health / stats.maxHealth) * 100;
  const mpPercent = (stats.mana / stats.maxMana) * 100;
  const xpPercent = (stats.experience / stats.experienceToNext) * 100;

  // Calculate total attack/defense with equipment
  let totalAttack = stats.attack;
  let totalDefense = stats.defense;
  let totalMagicAtk = stats.magicAttack;
  let totalMagicDef = stats.magicDefense;

  for (const slot of Object.values(EquipSlot)) {
    const itemId = player.equipment[slot];
    if (itemId) {
      const item = ITEMS[itemId];
      if (item) {
        if (item.attack) totalAttack += item.attack;
        if (item.defense) totalDefense += item.defense;
        if (item.magicAttack) totalMagicAtk += item.magicAttack;
        if (item.magicDefense) totalMagicDef += item.magicDefense;
      }
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 pointer-events-none z-10 pt-[env(safe-area-inset-top)]">
      {/* Top bar - Character Info */}
      <div className="flex items-start justify-between p-2 gap-2 mt-1">
        {/* Character panel - includes time */}
        <div className="bg-black/80 border border-amber-700/50 rounded-lg p-2 pointer-events-auto min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-amber-700 flex items-center justify-center text-white text-sm font-bold">
              {player.vocation[0]}
            </div>
            <div className="flex-1">
              <div className="text-amber-400 font-bold text-sm leading-tight">{player.name}</div>
              <div className="text-amber-200/60 text-xs">
                {player.vocation} • Lv.{stats.level}
              </div>
              {time && <div className="text-gray-500 text-[10px] leading-tight">{time}</div>}
            </div>
          </div>

          {/* HP Bar */}
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-red-400">❤️ HP</span>
              <span className="text-gray-400">{Math.floor(stats.health)}/{stats.maxHealth}</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPercent}%`,
                  background: hpPercent > 50
                    ? 'linear-gradient(to right, #27ae60, #2ecc71)'
                    : hpPercent > 25
                    ? 'linear-gradient(to right, #e67e22, #f39c12)'
                    : 'linear-gradient(to right, #c0392b, #e74c3c)',
                }}
              />
            </div>
          </div>

          {/* MP Bar */}
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-blue-400">🔵 MP</span>
              <span className="text-gray-400">{Math.floor(stats.mana)}/{stats.maxMana}</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-blue-900/50">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${mpPercent}%`,
                  background: 'linear-gradient(to right, #2980b9, #3498db)',
                }}
              />
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-yellow-400">⭐ XP</span>
              <span className="text-gray-400">{stats.experience}/{stats.experienceToNext}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-yellow-900/50">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(to right, #f39c12, #f1c40f)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats - compact */}
        <div className="bg-black/80 border border-amber-700/50 rounded-lg p-2 pointer-events-auto text-[10px] md:text-xs">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-300">
            <div>⚔️ Atk: <span className="text-orange-400 font-bold">{totalAttack}</span></div>
            <div>🛡️ Def: <span className="text-gray-200 font-bold">{totalDefense}</span></div>
            <div>🔮 Mag: <span className="text-purple-400 font-bold">{totalMagicAtk}</span></div>
            <div>✨ Mdf: <span className="text-blue-400 font-bold">{totalMagicDef}</span></div>
          </div>
        </div>

        {/* Gold & Save */}
        <div className="bg-black/80 border border-amber-700/50 rounded-lg px-2 py-1.5 md:px-3 md:py-2 pointer-events-auto flex items-center justify-between gap-2">
          <div className="text-yellow-400 font-bold text-xs md:text-sm">🪙 {player.gold}</div>
          <button
            onClick={handleSave}
            className={`text-[10px] md:text-xs px-2 py-1 rounded border transition-all ${
              saveFlash
                ? 'bg-green-800/60 border-green-500/50 text-green-300'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:border-amber-500'
              }`}
              title="Save character (also auto-saves every 30s)"
            >
              💾 {saveFlash ? 'Saved!' : 'Save'}
            </button>
          </div>
        {/* Match Timer */}
        <div className="bg-black/90 border-2 border-red-900/80 rounded-lg px-4 py-2 pointer-events-auto flex flex-col items-center justify-center min-w-[120px]">
          {matchPhase === 'arena' && (
            <div className="text-[10px] font-black uppercase text-yellow-400 tracking-wider mb-1">
              Vivos: {useGameStore.getState().bots.length + (player.stats.health > 0 ? 1 : 0)}
            </div>
          )}
          <div className="text-[10px] font-black uppercase text-red-500 tracking-wider">
            {matchPhase === 'hunting' ? 'Fase: Caçada (PvE)' 
            : matchPhase === 'preparation' ? 'Fase: PREPARAÇÃO' 
            : matchPhase === 'arena' ? 'Fase: ARENA (PvP)' 
            : 'Partida Encerrada'}
          </div>
          <div className={`text-xl font-black tabular-nums ${matchTimeLeft <= 10 && matchPhase !== 'ended' ? 'text-red-400 animate-ping' : 'text-white'}`}>
            {Math.floor(matchTimeLeft / 60)}:{(Math.floor(matchTimeLeft) % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Skill Points display - clickable to open skill panel */}
        {player.stats.skillPoints > 0 && (
          <button
            onClick={toggleSkillPanel}
            className="bg-black/80 border border-yellow-500/50 rounded-lg px-3 py-2 pointer-events-auto animate-pulse cursor-pointer hover:bg-yellow-900/40 hover:border-yellow-400 transition-colors"
            title="Click to open Skill Panel and spend points"
          >
            <div className="text-yellow-300 font-bold text-sm">⭐ {player.stats.skillPoints} SP</div>
            <div className="text-[8px] text-yellow-500">Click to spend!</div>
          </button>
        )}
      </div>
    </div>
  );
}