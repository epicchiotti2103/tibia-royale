'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import { ITEMS } from '@/lib/game/items';
import { NPCDefinition, Rarity } from '@/lib/game/types';

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#9ca3af',
  [Rarity.UNCOMMON]: '#22c55e',
  [Rarity.RARE]: '#3b82f6',
  [Rarity.EPIC]: '#a855f7',
  [Rarity.LEGENDARY]: '#f59e0b',
};

export default function NPCDialog() {
  const activeNPC = useGameStore((s) => s.activeNPC);
  const setActiveNPC = useGameStore((s) => s.setActiveNPC);
  const buyItem = useGameStore((s) => s.buyItem);
  const player = useGameStore((s) => s.player);
  const addChatMessage = useGameStore((s) => s.addChatMessage);

  if (!activeNPC || !player) return null;

  const handleClose = () => setActiveNPC(null);

  const handleHeal = () => {
    useGameStore.setState((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            health: state.player.stats.maxHealth,
            mana: state.player.stats.maxMana,
          },
        },
      };
    });
    addChatMessage({
      type: 'npc',
      sender: activeNPC.name,
      content: 'You have been fully healed! May the light protect you.',
      color: '#f1c40f',
    });
  };

  const handleBuy = (itemId: string) => {
    buyItem(itemId);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-gray-900 border-2 border-amber-600 rounded-xl p-5 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: activeNPC.color + '33' }}
          >
            {activeNPC.icon}
          </div>
          <div>
            <h2 className="text-amber-400 font-bold text-lg">{activeNPC.name}</h2>
            <span className="text-xs text-gray-400 capitalize">{activeNPC.type}</span>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-gray-500 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Greeting */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <p className="text-gray-200 text-sm italic">&quot;{activeNPC.greeting}&quot;</p>
        </div>

        {/* Content based on NPC type */}
        {activeNPC.type === 'healer' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">I can restore your health and mana completely.</p>
            <button
              onClick={handleHeal}
              className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg font-bold transition-colors"
            >
              ✨ Heal Me (Free)
            </button>
          </div>
        )}

        {activeNPC.type === 'merchant' && activeNPC.shopItems && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Browse my wares, adventurer!</p>
            <div className="text-xs text-gray-400">
              Your gold: <span className="text-yellow-400 font-bold">🪙 {player.gold}</span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {activeNPC.shopItems.map((itemId) => {
                const item = ITEMS[itemId];
                if (!item) return null;
                const canAfford = player.gold >= item.buyPrice;
                const meetsLevel = player.stats.level >= item.levelReq;
                const meetsVocation = !item.vocationReq || item.vocationReq.includes(player.vocation);

                return (
                  <div
                    key={itemId}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      canAfford && meetsLevel && meetsVocation
                        ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                        : 'bg-gray-800/50 opacity-50'
                    }`}
                    onClick={() => canAfford && meetsLevel && meetsVocation && handleBuy(itemId)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {item.attack && `⚔️+${item.attack} `}
                        {item.defense && `🛡️+${item.defense} `}
                        {item.healAmount && `❤️+${item.healAmount} `}
                        {item.manaAmount && `🔵+${item.manaAmount}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-xs font-bold">🪙 {item.buyPrice}</div>
                      {item.levelReq > 1 && (
                        <div className={`text-[10px] ${meetsLevel ? 'text-gray-500' : 'text-red-400'}`}>
                          Lv.{item.levelReq}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeNPC.type === 'banker' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">Welcome to the Bank of Tibia Lands!</p>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-yellow-400 text-2xl font-bold text-center">
                🪙 {player.gold} <span className="text-sm text-gray-400">gold coins</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs">Your gold is safe with us. Visit the merchant to buy supplies!</p>
          </div>
        )}

        {activeNPC.type === 'quest' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              The lands are full of dangerous creatures! Here&apos;s what I know:
            </p>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-green-400">🌲</span>
                <span className="text-gray-300">North Forest: <span className="text-green-400">Rats, Snakes</span> (Easy)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🏜️</span>
                <span className="text-gray-300">West Desert: <span className="text-yellow-400">Wolves, Orcs</span> (Medium)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-700">🌿</span>
                <span className="text-gray-300">South Swamp: <span className="text-green-400">Spiders, Wolves</span> (Medium)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⛰️</span>
                <span className="text-gray-300">East Cave: <span className="text-gray-400">Skeletons, Demons</span> (Hard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500">🔥</span>
                <span className="text-gray-300">Lava Fields: <span className="text-red-400">Demons</span> (Boss)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">🐉</span>
                <span className="text-gray-300">Dark Forest: <span className="text-red-400">Dragon</span> (Legend)</span>
              </div>
            </div>
            <p className="text-amber-200/60 text-xs italic">
              Use WASD to move, Space to attack, and E to interact with NPCs. Good luck!
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}