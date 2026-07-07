'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Vocation, VOCATION_STATS } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const vocations = [
  {
    vocation: Vocation.KNIGHT,
    description: 'Master of melee combat with high health and defense.',
    icon: '⚔️',
    color: '#e74c3c',
  },
  {
    vocation: Vocation.SORCERER,
    description: 'Wielder of powerful magic with devastating spells.',
    icon: '🔮',
    color: '#9b59b6',
  },
  {
    vocation: Vocation.DRUID,
    description: 'Nature\'s guardian with healing and support magic.',
    icon: '🌿',
    color: '#27ae60',
  },
  {
    vocation: Vocation.PALADIN,
    description: 'Holy warrior balancing melee and ranged combat.',
    icon: '🏹',
    color: '#3498db',
  },
];

export default function GameLogin() {
  const [name, setName] = useState('');
  const [selectedVocation, setSelectedVocation] = useState<Vocation>(Vocation.KNIGHT);
  const [step, setStep] = useState<1 | 2>(1);
  const createPlayer = useGameStore((s) => s.createPlayer);

  const handleContinue = () => {
    if (name.trim().length >= 2) {
      setStep(2);
    }
  };

  const handleCreateCharacter = () => {
    if (name.trim().length >= 2) {
      createPlayer(name.trim(), selectedVocation);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4">
      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-amber-400 mb-2 tracking-wider" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            ⚔️ TIBIA LANDS ⚔️
          </h1>
          <p className="text-amber-200/70 text-sm">A classic MMORPG adventure awaits</p>
        </div>

        <Card className="bg-gray-900/90 border-amber-700/50 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-400 text-lg">
              {step === 1 ? '📝 Enter Your Name' : '🎭 Choose Your Vocation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                  placeholder="Enter character name..."
                  maxLength={20}
                  className="w-full bg-gray-800 border border-amber-700/50 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <Button
                  onClick={handleContinue}
                  disabled={name.trim().length < 2}
                  className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3"
                >
                  Continue →
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm mb-4">
                  Selected: <span className="text-white font-bold">{name}</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {vocations.map((v) => {
                    const stats = VOCATION_STATS[v.vocation];
                    const isSelected = selectedVocation === v.vocation;
                    return (
                      <button
                        key={v.vocation}
                        onClick={() => setSelectedVocation(v.vocation)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-900/30'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{v.icon}</div>
                        <div className="font-bold text-sm" style={{ color: v.color }}>{v.vocation}</div>
                        <div className="text-gray-400 text-xs mt-1">{v.description}</div>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                          <div className="text-red-400">❤️ {stats.baseHealth + stats.healthPerLevel * 7}</div>
                          <div className="text-blue-400">🔵 {stats.baseMana + stats.manaPerLevel * 7}</div>
                          <div className="text-orange-400">⚔️ {stats.baseAttack + stats.attackPerLevel * 7}</div>
                          <div className="text-gray-300">🛡️ {stats.baseDefense + stats.defensePerLevel * 7}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleCreateCharacter}
                    className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-bold"
                  >
                    Enter World ⚔️
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls info */}
        <div className="mt-6 text-center text-gray-500 text-xs space-y-1">
          <p>🎮 <span className="text-gray-400">WASD</span> to move • <span className="text-gray-400">Space</span> to attack • <span className="text-gray-400">E</span> to interact with NPCs</p>
          <p>📦 <span className="text-gray-400">1-9</span> to use inventory items • Click on monsters/NPCs</p>
        </div>
      </div>
    </div>
  );
}