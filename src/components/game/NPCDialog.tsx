'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { ITEMS } from '@/lib/game/items';
import { NPCDefinition, Rarity, ItemType } from '@/lib/game/types';

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
  const sellItem = useGameStore((s) => s.sellItem);
  const player = useGameStore((s) => s.player);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [buyFilter, setBuyFilter] = useState('all');

  const handleClose = () => {
    setActiveNPC(null);
    setTab('buy');
    setBuyFilter('all');
  };

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
      sender: activeNPC!.name,
      content: 'You have been fully healed! May the light protect you.',
      color: '#f1c40f',
    });
  };

  const handleBuy = (itemId: string) => {
    buyItem(itemId);
  };

  const handleSell = (invItemId: string) => {
    sellItem(invItemId);
  };

  if (!activeNPC || !player) return null;

  const filterCategories = [
    { id: 'all', label: 'All' },
    { id: 'weapon', label: '⚔️ Weapons' },
    { id: 'armor', label: '🛡️ Armor' },
    { id: 'consumable', label: '🧪 Potions' },
    { id: 'other', label: '📿 Other' },
  ];

  const filteredShopItems = (activeNPC.shopItems || []).filter(itemId => {
    if (buyFilter === 'all') return true;
    const item = ITEMS[itemId];
    if (!item) return false;
    if (buyFilter === 'weapon') return item.type === ItemType.WEAPON;
    if (buyFilter === 'armor') return [ItemType.ARMOR, ItemType.SHIELD, ItemType.HELMET, ItemType.LEGS, ItemType.BOOTS, ItemType.RING, ItemType.AMULET].includes(item.type);
    if (buyFilter === 'consumable') return item.type === ItemType.CONSUMABLE;
    return ![ItemType.WEAPON, ItemType.ARMOR, ItemType.SHIELD, ItemType.HELMET, ItemType.LEGS, ItemType.BOOTS, ItemType.CONSUMABLE].includes(item.type);
  });

  const sellableItems = player.inventory.filter(inv => {
    const def = ITEMS[inv.itemId];
    return def && def.sellPrice > 0 && def.type !== ItemType.GOLD;
  });

  const totalSellValue = sellableItems.reduce((sum, inv) => {
    const def = ITEMS[inv.itemId];
    return sum + (def ? def.sellPrice * inv.quantity : 0);
  }, 0);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-gray-900 border-2 border-amber-600 rounded-xl p-5 max-w-lg w-full mx-4 shadow-2xl"
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
            {/* Gold display */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                Your gold: <span className="text-yellow-400 font-bold text-sm">🪙 {player.gold}</span>
              </div>
              {tab === 'sell' && sellableItems.length > 0 && (
                <button
                  onClick={() => {
                    // Sell all sellable items
                    for (const inv of sellableItems) {
                      sellItem(inv.id);
                    }
                  }}
                  className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded font-bold transition-colors"
                >
                  Sell All (🪙 {totalSellValue})
                </button>
              )}
            </div>

            {/* Buy / Sell tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setTab('buy')}
                className={`flex-1 py-1.5 text-xs rounded-lg font-bold transition-colors ${tab === 'buy' ? 'bg-amber-700 text-amber-100' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
              >
                🛒 Buy
              </button>
              <button
                onClick={() => setTab('sell')}
                className={`flex-1 py-1.5 text-xs rounded-lg font-bold transition-colors ${tab === 'sell' ? 'bg-amber-700 text-amber-100' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
              >
                💰 Sell ({sellableItems.length} items)
              </button>
            </div>

            {tab === 'buy' && (
              <>
                {/* Category filter */}
                <div className="flex gap-1 flex-wrap">
                  {filterCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setBuyFilter(cat.id)}
                      className={`px-2 py-0.5 text-[10px] rounded ${buyFilter === cat.id ? 'bg-amber-700/50 text-amber-300' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                  {filteredShopItems.map((itemId) => {
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
                            {item.magicAttack && `🔮+${item.magicAttack} `}
                            {item.defense && `🛡️+${item.defense} `}
                            {item.magicDefense && `✨+${item.magicDefense} `}
                            {item.healAmount && `❤️+${item.healAmount} `}
                            {item.manaAmount && `🔵+${item.manaAmount}`}
                          </div>
                          {item.vocationReq && (
                            <div className="text-[9px] text-gray-600">{item.vocationReq.join('/')}</div>
                          )}
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
              </>
            )}

            {tab === 'sell' && (
              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                {sellableItems.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">No items to sell!</div>
                ) : (
                  sellableItems.map((invItem) => {
                    const itemDef = ITEMS[invItem.itemId];
                    if (!itemDef) return null;
                    return (
                      <div
                        key={invItem.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => handleSell(invItem.id)}
                      >
                        <span className="text-xl">{itemDef.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold" style={{ color: RARITY_COLORS[itemDef.rarity] }}>
                            {itemDef.name}
                            {invItem.quantity > 1 && <span className="text-gray-400 ml-1">x{invItem.quantity}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 text-xs font-bold">
                            🪙 {itemDef.sellPrice * invItem.quantity}
                          </div>
                          <div className="text-[9px] text-gray-500">each: {itemDef.sellPrice}g</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
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
            <p className="text-gray-500 text-xs">Visit the merchant to buy supplies or sell your loot!</p>
          </div>
        )}

        {activeNPC.type === 'quest' && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              The lands are full of dangerous creatures! Here&apos;s what I know:
            </p>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-xs max-h-60 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2">
                <span className="text-green-400">🌲</span>
                <span className="text-gray-300">North Forest: <span className="text-green-400">Rats, Bats, Snakes</span> (Easy)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">🕷️</span>
                <span className="text-gray-300">Forest Clearing: <span className="text-green-400">Spiders, Goblins</span> (Medium)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🏜️</span>
                <span className="text-gray-300">West Desert: <span className="text-yellow-400">Wolves, Orcs, Scorpions, Trolls</span> (Medium-Hard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-700">🌿</span>
                <span className="text-gray-300">South Swamp: <span className="text-yellow-400">Spiders, Wolves, Scorpions, Trolls</span> (Medium)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⛰️</span>
                <span className="text-gray-300">East Cave: <span className="text-purple-400">Skeletons, Wraiths, Dark Mages</span> (Hard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-300">❄️</span>
                <span className="text-gray-300">Snow Peak: <span className="text-purple-400">Wraiths, Trolls</span> (Hard)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500">🔥</span>
                <span className="text-gray-300">Lava Fields: <span className="text-red-400">Fire Elementals, Demons, Demon Lord</span> (Boss)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">🐉</span>
                <span className="text-gray-300">Dark Forest: <span className="text-red-400">Trolls, Dragons, Ancient Dragon</span> (Legend)</span>
              </div>
            </div>
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