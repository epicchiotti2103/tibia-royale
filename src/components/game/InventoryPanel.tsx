'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { ITEMS } from '@/lib/game/items';
import { EquipSlot, Rarity, ItemType } from '@/lib/game/types';

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.COMMON]: '#9ca3af',
  [Rarity.UNCOMMON]: '#22c55e',
  [Rarity.RARE]: '#3b82f6',
  [Rarity.EPIC]: '#a855f7',
  [Rarity.LEGENDARY]: '#f59e0b',
};

const SLOT_LABELS: Record<string, string> = {
  [EquipSlot.WEAPON]: '⚔️ Weapon',
  [EquipSlot.ARMOR]: '🛡️ Armor',
  [EquipSlot.SHIELD]: '🔰 Shield',
  [EquipSlot.HELMET]: '⛑️ Helmet',
  [EquipSlot.LEGS]: '👖 Legs',
  [EquipSlot.BOOTS]: '👢 Boots',
  [EquipSlot.RING]: '💍 Ring',
  [EquipSlot.AMULET]: '📿 Amulet',
};

export default function InventoryPanel() {
  const player = useGameStore((s) => s.player);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const consumeInventoryItem = useGameStore((s) => s.consumeInventoryItem);
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'inventory' | 'equipment'>('inventory');

  const renderItemTooltip = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return null;
    const rarityColor = RARITY_COLORS[item.rarity];
    return (
      <div className="absolute z-50 bg-gray-900 border border-gray-600 rounded-lg p-2 w-52 shadow-xl pointer-events-auto">
        <div className="font-bold text-sm" style={{ color: rarityColor }}>{item.name}</div>
        <div className="text-xs text-gray-400 italic mb-1">{item.rarity}</div>
        <div className="text-xs text-gray-300 mb-2">{item.description}</div>
        <div className="text-xs space-y-0.5">
          {item.attack && <div className="text-orange-400">⚔️ Attack: +{item.attack}</div>}
          {item.defense && <div className="text-gray-300">🛡️ Defense: +{item.defense}</div>}
          {item.magicAttack && <div className="text-purple-400">🔮 Magic Attack: +{item.magicAttack}</div>}
          {item.magicDefense && <div className="text-blue-400">✨ Magic Defense: +{item.magicDefense}</div>}
          {item.healAmount && <div className="text-green-400">❤️ Heals: {item.healAmount} HP</div>}
          {item.manaAmount && <div className="text-blue-400">🔵 Restores: {item.manaAmount} MP</div>}
          <div className="text-yellow-400">🪙 Value: {item.sellPrice}g</div>
          {item.levelReq > 1 && <div className="text-gray-400">Level required: {item.levelReq}</div>}
          {item.vocationReq && <div className="text-gray-400">Class: {item.vocationReq.join('/')}</div>}
          <div className="text-gray-500">Weight: {item.weight} oz</div>
        </div>
      </div>
    );
  };

  if (!player) return null;

  return (
    <div className={`absolute top-12 right-0 z-20 ${isOpen ? 'w-72' : ''}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/80 border border-amber-700/50 rounded-t-lg px-3 py-1 text-amber-400 text-xs font-bold hover:bg-black/90"
      >
        {isOpen ? '▼' : '▲'} 📦 Inventory
      </button>

      {isOpen && (
        <div className="bg-black/90 border border-amber-700/50 border-t-0 rounded-b-lg p-2 max-h-96 overflow-y-auto custom-scrollbar">
          {/* Tabs */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => setTab('inventory')}
              className={`px-2 py-1 text-xs rounded ${tab === 'inventory' ? 'bg-amber-700/50 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Items ({player.inventory.length})
            </button>
            <button
              onClick={() => setTab('equipment')}
              className={`px-2 py-1 text-xs rounded ${tab === 'equipment' ? 'bg-amber-700/50 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Equipment
            </button>
          </div>

          {tab === 'inventory' ? (
            <div className="grid grid-cols-5 gap-1">
              {player.inventory.map((invItem, index) => {
                const itemDef = ITEMS[invItem.itemId];
                if (!itemDef) return null;
                const rarityColor = RARITY_COLORS[itemDef.rarity];

                return (
                  <div key={invItem.id} className="group relative">
                    <button
                      onClick={() => {
                        if (itemDef.type === ItemType.CONSUMABLE) {
                          consumeInventoryItem(invItem.id);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (itemDef.type !== ItemType.CONSUMABLE && itemDef.type !== ItemType.GOLD) {
                          equipItem(invItem.id);
                        }
                      }}
                      className="w-11 h-11 bg-gray-800 border rounded flex flex-col items-center justify-center hover:bg-gray-700 transition-colors relative"
                      style={{ borderColor: rarityColor + '80' }}
                      title={`${itemDef.name}${invItem.quantity > 1 ? ` x${invItem.quantity}` : ''}\nLeft-click: Use | Right-click: Equip`}
                    >
                      <span className="text-lg leading-none">{itemDef.icon}</span>
                      {invItem.quantity > 1 && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-black text-[9px] text-yellow-400 px-0.5 rounded">
                          {invItem.quantity}
                        </span>
                      )}
                      <span className="absolute -top-0.5 -left-0.5 text-[8px] text-gray-500 bg-black/80 px-0.5 rounded">
                        {index + 1}
                      </span>
                    </button>
                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block">
                      {renderItemTooltip(invItem.itemId)}
                    </div>
                  </div>
                );
              })}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 20 - player.inventory.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-11 h-11 bg-gray-800/30 border border-gray-700/30 rounded"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {Object.values(EquipSlot).map((slot) => {
                const equippedId = player.equipment[slot];
                const itemDef = equippedId ? ITEMS[equippedId] : null;

                return (
                  <div
                    key={slot}
                    className="flex items-center gap-2 p-1.5 bg-gray-800/50 rounded group relative cursor-pointer hover:bg-gray-700/50"
                    onClick={() => equippedId && unequipItem(slot)}
                  >
                    <span className="text-sm text-gray-400 w-20">{SLOT_LABELS[slot]}</span>
                    {itemDef ? (
                      <>
                        <span className="text-lg">{itemDef.icon}</span>
                        <span className="text-xs" style={{ color: RARITY_COLORS[itemDef.rarity] }}>
                          {itemDef.name}
                        </span>
                        <span className="ml-auto text-[10px] text-gray-600 hidden group-hover:inline">
                          Click to unequip
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-600">Empty</span>
                    )}
                    {/* Tooltip */}
                    {itemDef && (
                      <div className="hidden group-hover:block">
                        {renderItemTooltip(equippedId!)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}