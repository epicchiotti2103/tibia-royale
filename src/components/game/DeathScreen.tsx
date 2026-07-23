'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';

export default function DeathScreen() {
  const player = useGameStore((s) => s.player);
  const respawn = useGameStore((s) => s.respawn);
  const setScreen = useGameStore((s) => s.setScreen);
  const matchPhase = useGameStore((s) => s.matchPhase);
  const matchTimeLeft = useGameStore((s) => s.matchTimeLeft);

  if (!player) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* Red vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(139,0,0,0.6) 100%)',
      }} />

      <div className="text-center z-10 space-y-6 animate-fade-in">
        {/* Skull icon */}
        <div className="text-8xl animate-pulse">💀</div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-red-500" style={{
          fontFamily: 'serif',
          textShadow: '0 0 20px rgba(255,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.8)',
        }}>
          YOU DIED
        </h1>

        {/* Death info */}
        <div className="space-y-2">
          <p className="text-gray-400 text-lg">
            {player.name} the {player.vocation} has fallen in battle.
          </p>
          <p className="text-gray-500 text-sm">
            Level {player.stats.level} • {player.vocation}
          </p>
        </div>

        {/* Death stats */}
        <div className="bg-gray-900/80 border border-red-900/50 rounded-xl p-4 max-w-xs mx-auto">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Experience Lost</div>
            <div className="text-red-400 font-bold">-{Math.floor(player.stats.experience * 0.1)} XP</div>
            <div className="text-gray-400">Level</div>
            <div className="text-amber-400 font-bold">{player.stats.level}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {matchPhase === 'arena' ? (
            <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 max-w-xs mx-auto">
              <p className="text-red-400 font-bold mb-2">⚔️ ELIMINATED ⚔️</p>
              <p className="text-gray-300 text-sm">
                The Battle Royale is ongoing.<br/>
                Next match in {Math.ceil(matchTimeLeft / 1000)}s...
              </p>
            </div>
          ) : (
            <button
              onClick={respawn}
              className="block w-64 mx-auto bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-900/50"
            >
              ✨ Respawn in Town
            </button>
          )}
          <button
            onClick={() => setScreen('login')}
            className="block w-64 mx-auto bg-gray-800 hover:bg-gray-700 text-gray-400 py-2 px-8 rounded-lg transition-all text-sm"
          >
            🚪 Return to Login
          </button>
        </div>

        <p className="text-gray-600 text-xs">
          You will respawn with full health and mana at the town center.
        </p>
      </div>
    </div>
  );
}