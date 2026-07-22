'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { Vocation, VOCATION_STATS } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VOCATION_SPRITE_PATHS: Record<string, string> = {
  Knight: '/sprites/player_knight/south.png',
  Sorcerer: '/sprites/player_sorcerer/south.png',
  Druid: '/sprites/player_druid/south.png',
  Paladin: '/sprites/player_paladin/south.png',
};

const VOCATION_COLORS: Record<string, string> = {
  Knight: '#e74c3c',
  Sorcerer: '#9b59b6',
  Druid: '#27ae60',
  Paladin: '#3498db',
};

interface SavedCharacter {
  name: string;
  vocation: string;
  level: number;
  health: number;
  maxHealth: number;
}

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
  const [savedChars, setSavedChars] = useState<SavedCharacter[]>([]);
  const [loadingChar, setLoadingChar] = useState<string | null>(null);
  const createPlayer = useGameStore((s) => s.createPlayer);
  const loadPlayer = useGameStore((s) => s.loadPlayer);
  const deleteCharacter = useGameStore((s) => s.deleteCharacter);

  // Fetch saved characters on mount
  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(setSavedChars)
      .catch(() => {});
  }, []);

  const handleStartGame = (e?: React.SyntheticEvent) => {
    if (e?.type === 'submit') {
      e.preventDefault();
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const finalName = name.trim() || `Hero_${Math.floor(Math.random() * 900 + 100)}`;
    createPlayer(finalName, selectedVocation);
  };

  const handleSelectVocation = (vocation: Vocation, e?: React.SyntheticEvent) => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedVocation(vocation);
  };

  const handleLoadCharacter = async (charName: string, e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setLoadingChar(charName);
    const success = await loadPlayer(charName);
    if (!success) {
      alert('Failed to load character. They may have been deleted.');
      setSavedChars(prev => prev.filter(c => c.name !== charName));
    }
    setLoadingChar(null);
  };

  const handleDeleteCharacter = async (charName: string, e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!confirm(`Delete ${charName}? This cannot be undone!`)) return;
    await deleteCharacter(charName);
    setSavedChars(prev => prev.filter(c => c.name !== charName));
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-4 overflow-y-auto select-none pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-lg py-4">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-1 tracking-wider" style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            ⚔️ TIBIA LANDS ⚔️
          </h1>
          <p className="text-amber-200/70 text-xs md:text-sm">A classic MMORPG adventure awaits</p>
        </div>

        {/* Saved Characters */}
        {savedChars.length > 0 && (
          <Card className="bg-gray-900/90 border-amber-700/50 text-white mb-4">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
                💾 <span>Personagens Salvos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedChars.map((char) => (
                  <div
                    key={char.name}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/60 border border-gray-700/50 hover:border-amber-600/50 transition-colors"
                  >
                    {/* Sprite */}
                    <div
                      className="w-10 h-10 rounded-md bg-black/40 flex items-center justify-center flex-shrink-0 border border-white/10"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={VOCATION_SPRITE_PATHS[char.vocation] || VOCATION_SPRITE_PATHS.Knight}
                        alt={char.vocation}
                        className="w-9 h-9 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white truncate">{char.name}</div>
                      <div className="text-xs" style={{ color: VOCATION_COLORS[char.vocation] || '#aaa' }}>
                        {char.vocation} • Level {char.level}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        onPointerDown={(e) => handleLoadCharacter(char.name, e)}
                        onClick={(e) => handleLoadCharacter(char.name, e)}
                        disabled={loadingChar === char.name}
                        className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs px-3 py-1.5 h-8 font-bold touch-manipulation cursor-pointer"
                      >
                        {loadingChar === char.name ? '⏳' : '▶ Entrar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPointerDown={(e) => handleDeleteCharacter(char.name, e)}
                        onClick={(e) => handleDeleteCharacter(char.name, e)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 text-xs px-2 py-1.5 h-8 touch-manipulation cursor-pointer"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Character Creation Form */}
        <Card className="bg-gray-900/90 border-amber-700/50 text-white">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-amber-400 text-base flex items-center gap-2">
              <span>⚔️</span> <span>Criar Novo Personagem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={(e) => handleStartGame(e)} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nome do Personagem:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  placeholder="Digite seu nome (ou deixe em branco)..."
                  maxLength={20}
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-gray-800 border border-amber-700/50 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-base select-text"
                />
              </div>

              {/* Vocation Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Escolha sua Vocação:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {vocations.map((v) => {
                    const stats = VOCATION_STATS[v.vocation];
                    const isSelected = selectedVocation === v.vocation;
                    return (
                      <div
                        key={v.vocation}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) => handleSelectVocation(v.vocation as Vocation, e)}
                        onClick={(e) => handleSelectVocation(v.vocation as Vocation, e)}
                        className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden touch-manipulation cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-950/70 shadow-md shadow-amber-500/20'
                            : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
                        }`}
                      >
                        {/* Selected Check Badge */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-amber-400 text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
                            ✓ SELECIONADO
                          </div>
                        )}

                        {/* Sprite & title */}
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-11 h-11 rounded-lg bg-black/50 flex items-center justify-center flex-shrink-0 border border-white/20"
                            style={{ imageRendering: 'pixelated' }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={VOCATION_SPRITE_PATHS[v.vocation]}
                              alt={v.vocation}
                              className="w-9 h-9 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm" style={{ color: isSelected ? '#fbbf24' : v.color }}>
                              {v.vocation}
                            </div>
                            <div className="text-[11px] text-gray-300 font-medium truncate">
                              HP {stats.baseHealth} • MP {stats.baseMana}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ENTER WORLD BUTTON - ALWAYS BRIGHT & ACTIVE */}
              <button
                type="submit"
                onPointerDown={(e) => handleStartGame(e)}
                onClick={(e) => handleStartGame(e)}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:from-amber-600 active:to-amber-500 text-black font-black py-3.5 text-lg min-h-[56px] shadow-xl shadow-amber-500/30 touch-manipulation border-2 border-amber-300 rounded-xl mt-3 cursor-pointer transition-transform active:scale-98 flex items-center justify-center gap-2"
              >
                <span>ENTRAR NO JOGO</span>
                <span className="text-xl">⚔️</span>
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-4 text-center text-gray-400 text-xs space-y-1">
          <p>🎮 Celular: use o joystick e botões na tela</p>
          <p>💾 O jogo salva o progresso automaticamente</p>
        </div>
      </div>
    </div>
  );
}