// =============================================
// Tibia-Style Game - Combat System
// =============================================

import { PlayerStats, MonsterInstance, EquipSlot, InventoryItem, ItemType } from './types';
import { ITEMS } from './items';

export interface CombatResult {
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
  attackerDefeated?: boolean;
  defenderDefeated?: boolean;
}

export function calculatePlayerAttack(
  stats: PlayerStats,
  equipment: Record<EquipSlot, string | null>
): { physical: number; magical: number } {
  let physical = stats.attack;
  let magical = stats.magicAttack;

  for (const slot of Object.values(EquipSlot)) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    const item = ITEMS[itemId];
    if (!item) continue;

    if (item.attack) physical += item.attack;
    if (item.magicAttack) magical += item.magicAttack;
  }

  return { physical, magical };
}

export function calculatePlayerDefense(
  stats: PlayerStats,
  equipment: Record<EquipSlot, string | null>
): { physical: number; magical: number } {
  let physical = stats.defense;
  let magical = stats.magicDefense;

  for (const slot of Object.values(EquipSlot)) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    const item = ITEMS[itemId];
    if (!item) continue;

    if (item.defense) physical += item.defense;
    if (item.magicDefense) magical += item.magicDefense;
  }

  return { physical, magical };
}

export function playerAttackMonster(
  playerStats: PlayerStats,
  equipment: Record<EquipSlot, string | null>,
  monster: MonsterInstance
): CombatResult {
  const { physical, magical } = calculatePlayerAttack(playerStats, equipment);
  const totalAttack = physical + magical * 0.5;

  // Calculate damage with some randomness
  const isMiss = Math.random() < 0.05; // 5% miss chance
  if (isMiss) {
    return { damage: 0, isCritical: false, isMiss: true };
  }

  const isCritical = Math.random() < 0.1; // 10% crit chance
  const critMultiplier = isCritical ? 2.0 : 1.0;

  // Damage formula: attack - (defense * 0.5) with variance
  const defenseReduction = monster.defense * 0.4;
  const baseDamage = Math.max(1, totalAttack - defenseReduction);
  const variance = 0.8 + Math.random() * 0.4; // 80-120% variance
  const damage = Math.floor(baseDamage * variance * critMultiplier);

  const newHealth = monster.health - damage;
  return {
    damage,
    isCritical,
    isMiss: false,
    defenderDefeated: newHealth <= 0,
  };
}

export function monsterAttackPlayer(
  monster: MonsterInstance,
  playerStats: PlayerStats,
  equipment: Record<EquipSlot, string | null>
): CombatResult {
  const { physical, magical } = calculatePlayerDefense(playerStats, equipment);
  const totalDefense = physical + magical * 0.5;

  const isMiss = Math.random() < 0.08; // 8% miss chance
  if (isMiss) {
    return { damage: 0, isCritical: false, isMiss: true };
  }

  const isCritical = Math.random() < 0.05; // 5% monster crit
  const critMultiplier = isCritical ? 1.5 : 1.0;

  const defenseReduction = totalDefense * 0.4;
  const baseDamage = Math.max(1, monster.defense > 0 ? monster.attack - defenseReduction : monster.attack);
  const variance = 0.8 + Math.random() * 0.4;
  const damage = Math.floor(Math.max(1, baseDamage) * variance * critMultiplier);

  const newHealth = playerStats.health - damage;
  return {
    damage,
    isCritical,
    isMiss: false,
    attackerDefeated: newHealth <= 0,
  };
}

export function consumeItem(
  itemId: string,
  stats: PlayerStats,
  inventory: InventoryItem[]
): { stats: PlayerStats; inventory: InventoryItem[]; used: boolean; message: string } {
  const itemDef = ITEMS[itemId];
  if (!itemDef || itemDef.type !== ItemType.CONSUMABLE) {
    return { stats, inventory, used: false, message: 'Cannot use this item.' };
  }

  const invItem = inventory.find(i => i.itemId === itemId);
  if (!invItem) {
    return { stats, inventory, used: false, message: 'Item not in inventory.' };
  }

  let newStats = { ...stats };
  let message = '';

  if (itemDef.healAmount) {
    const heal = Math.min(itemDef.healAmount, newStats.maxHealth - newStats.health);
    newStats.health += heal;
    message = `Used ${itemDef.name} and restored ${heal} HP.`;
  }

  if (itemDef.manaAmount) {
    const mana = Math.min(itemDef.manaAmount, newStats.maxMana - newStats.mana);
    newStats.mana += mana;
    message = message ? `${message} Restored ${mana} MP.` : `Used ${itemDef.name} and restored ${mana} MP.`;
  }

  // Remove from inventory
  const newInventory = inventory.map(i => {
    if (i.itemId === itemId) {
      const newQty = i.quantity - 1;
      return newQty > 0 ? { ...i, quantity: newQty } : null;
    }
    return i;
  }).filter(Boolean) as InventoryItem[];

  return { stats: newStats, inventory: newInventory, used: true, message };
}

export function calculateLevelUpStats(
  currentLevel: number,
  experience: number,
  experienceToNext: number
): { leveledUp: boolean; newLevel: number; newExpToNext: number } {
  if (experience < experienceToNext) {
    return { leveledUp: false, newLevel: currentLevel, newExpToNext: experienceToNext };
  }

  const newLevel = currentLevel + 1;
  const newExpToNext = Math.floor(100 * Math.pow(1.3, newLevel - 1));
  const remainingExp = experience - experienceToNext;

  // Check for multiple level ups
  if (remainingExp >= newExpToNext) {
    return calculateLevelUpStats(newLevel, remainingExp, newExpToNext);
  }

  return { leveledUp: true, newLevel, newExpToNext };
}

export function generateLoot(lootTable: MonsterInstance['lootTable']): { itemId: string; quantity: number }[] {
  const loot: { itemId: string; quantity: number }[] = [];

  for (const drop of lootTable) {
    if (Math.random() < drop.chance) {
      const quantity = drop.minQuantity + Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1));
      loot.push({ itemId: drop.itemId, quantity });
    }
  }

  return loot;
}

export function addLootToInventory(
  inventory: InventoryItem[],
  loot: { itemId: string; quantity: number }[]
): InventoryItem {
  let newGold = 0;
  const newInventory = [...inventory];

  for (const drop of loot) {
    if (drop.itemId === 'gold_coin') {
      newGold += drop.quantity;
      continue;
    }

    const existing = newInventory.find(i => i.itemId === drop.itemId);
    const itemDef = ITEMS[drop.itemId];

    if (existing && itemDef?.stackable) {
      existing.quantity += drop.quantity;
    } else {
      newInventory.push({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        itemId: drop.itemId,
        quantity: drop.quantity,
        slot: newInventory.length,
      });
    }
  }

  return { inventory: newInventory, gold: newGold } as any;
}