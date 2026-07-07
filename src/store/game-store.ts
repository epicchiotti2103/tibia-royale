// =============================================
// Tibia-Style Game - Zustand Store
// =============================================

import { create } from 'zustand';
import {
  PlayerData,
  Direction,
  ChatMessage,
  MonsterInstance,
  OtherPlayer,
  DamageNumber,
  SpellEffect,
  Vocation,
  EquipSlot,
  InventoryItem,
  NPCDefinition,
  GameMap,
  MonsterZone,
  DIR_OFFSETS,
} from '@/lib/game/types';
import { calculateStats, VOCATION_STATS } from '@/lib/game/types';
import { getGameMap } from '@/lib/game/tilemap';
import { MONSTERS } from '@/lib/game/monsters';
import { ITEMS } from '@/lib/game/items';
import {
  playerAttackMonster,
  monsterAttackPlayer,
  consumeItem,
  calculateLevelUpStats,
  generateLoot,
} from '@/lib/game/combat';
import { getSkillsForVocation, getSkillEffectType } from '@/lib/game/skills';

export type GameScreen = 'login' | 'game' | 'dead';

interface GameState {
  // Screen
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;

  // Player
  player: PlayerData | null;
  createPlayer: (name: string, vocation: Vocation) => void;

  // Game Map
  gameMap: GameMap;

  // Monsters
  monsters: MonsterInstance[];
  spawnMonsters: () => void;
  updateMonsters: (deltaTime: number) => void;

  // Other Players (multiplayer)
  otherPlayers: OtherPlayer[];
  setOtherPlayers: (players: OtherPlayer[]) => void;
  updateOtherPlayer: (player: OtherPlayer) => void;
  removeOtherPlayer: (id: string) => void;

  // Movement
  movePlayer: (direction: Direction) => void;
  attackMonster: () => void;
  interactNPC: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // Combat
  damageNumbers: DamageNumber[];
  addDamageNumber: (position: { x: number; y: number }, value: number, type: DamageNumber['type']) => void;
  cleanupDamageNumbers: () => void;

  // Spell Effects
  spellEffects: SpellEffect[];
  addSpellEffect: (effect: Omit<SpellEffect, 'id'>) => void;
  cleanupSpellEffects: () => void;
  castSkill: (skillIndex: number) => void;
  skillCooldowns: Record<string, number>;
  buffEndTime: number;

  // Visual feedback
  screenShakeTime: number;
  levelUpTime: number;
  lastAutoAttackTime: number;

  // Inventory
  addToInventory: (itemId: string, quantity: number) => void;
  removeFromInventory: (invItemId: string, quantity: number) => void;
  consumeInventoryItem: (invItemId: string) => void;
  equipItem: (invItemId: string) => void;
  unequipItem: (slot: EquipSlot) => void;

  // NPC Interaction
  activeNPC: NPCDefinition | null;
  setActiveNPC: (npc: NPCDefinition | null) => void;
  buyItem: (itemId: string) => void;
  sellItem: (invItemId: string) => void;

  // Player death / respawn
  playerDeath: () => void;
  respawn: () => void;

  // Mana regeneration
  regenMana: (deltaTime: number) => void;
}

let monsterIdCounter = 0;
function generateMonsterId(): string {
  return `monster_${++monsterIdCounter}`;
}

function generateLootId(): string {
  return `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isPositionBlocked(x: number, y: number, map: GameMap): boolean {
  if (x < 0 || x >= map.tiles[0].length || y < 0 || y >= map.tiles.length) return true;
  const tile = map.tiles[y][x];
  return tile === 4 ? false : // SAND is walkable
    (tile === 2 || tile === 7 || tile === 6 || tile === 13 || tile === 14); // WATER, WALL, LAVA, TREE, ROCK
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  setScreen: (screen) => set({ screen }),

  player: null,
  createPlayer: (name, vocation) => {
    const map = getGameMap();
    const stats = calculateStats(vocation, 1);
    const player: PlayerData = {
      id: `player_${Date.now()}`,
      name,
      vocation,
      position: { ...map.spawnPoint },
      direction: Direction.SOUTH,
      stats,
      equipment: {
        [EquipSlot.WEAPON]: 'wooden_sword',
        [EquipSlot.ARMOR]: null,
        [EquipSlot.SHIELD]: null,
        [EquipSlot.HELMET]: null,
        [EquipSlot.LEGS]: null,
        [EquipSlot.BOOTS]: null,
        [EquipSlot.RING]: null,
        [EquipSlot.AMULET]: null,
      },
      inventory: [
        { id: generateLootId(), itemId: 'health_potion_small', quantity: 5, slot: 0 },
        { id: generateLootId(), itemId: 'mana_potion_small', quantity: 3, slot: 1 },
      ],
      gold: 50,
    };
    set({ player, screen: 'game' });
    get().addChatMessage({
      type: 'system',
      sender: 'System',
      content: `Welcome to Tibia Lands, ${name} the ${vocation}! WASD: Move | Space: Attack | I/O/P: Skills | Q1/Q2: Potions | 1-9: Items | E: Interact`,
      color: '#f1c40f',
    });
  },

  gameMap: getGameMap(),

  monsters: [],
  spawnMonsters: () => {
    const map = get().gameMap;
    const monsters: MonsterInstance[] = [];

    for (const zone of map.monsterZones) {
      for (let i = 0; i < zone.maxMonsters; i++) {
        const monsterDefId = zone.monsterIds[Math.floor(Math.random() * zone.monsterIds.length)];
        const def = MONSTERS[monsterDefId];
        if (!def) continue;

        // Find valid spawn position
        let spawnX = 0, spawnY = 0;
        let attempts = 0;
        do {
          spawnX = zone.area.x + Math.floor(Math.random() * zone.area.width);
          spawnY = zone.area.y + Math.floor(Math.random() * zone.area.height);
          attempts++;
        } while (isPositionBlocked(spawnX, spawnY, map) && attempts < 50);

        if (attempts < 50) {
          monsters.push({
            id: generateMonsterId(),
            definitionId: monsterDefId,
            position: { x: spawnX, y: spawnY },
            health: def.health,
            maxHealth: def.maxHealth,
            lastAttackTime: 0,
            spawnPosition: { x: spawnX, y: spawnY },
            respawnTime: zone.spawnRate,
            isDead: false,
          });
        }
      }
    }

    set({ monsters });
  },

  updateMonsters: (deltaTime) => {
    const { monsters, player, gameMap, addDamageNumber, addChatMessage } = get();
    if (!player) return;

    const now = Date.now();
    const updatedMonsters = monsters.map(monster => {
      if (monster.isDead) {
        // Check respawn
        if (monster.deathTime && now - monster.deathTime > monster.respawnTime) {
          const def = MONSTERS[monster.definitionId];
          if (def) {
            return {
              ...monster,
              health: def.health,
              maxHealth: def.maxHealth,
              isDead: false,
              position: { ...monster.spawnPosition },
              targetId: undefined,
              lastAttackTime: 0,
            };
          }
        }
        return monster;
      }

      const def = MONSTERS[monster.definitionId];
      if (!def) return monster;

      const dx = player.position.x - monster.position.x;
      const dy = player.position.y - monster.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if monster should chase player
      if (def.aggressive && dist < def.chaseRange) {
        monster.targetId = player.id;
      } else if (dist > def.chaseRange + 3) {
        monster.targetId = undefined;
      }

      // Movement
      if (monster.targetId) {
        if (dist > def.attackRange) {
          // Move towards player
          const moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
          const moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

          // Try to move
          let newX = monster.position.x + moveX;
          let newY = monster.position.y + moveY;

          // Simple collision avoidance
          if (!isPositionBlocked(newX, newY, gameMap) && !isMonsterAt(newX, newY, monsters, monster.id)) {
            monster.position = { x: newX, y: newY };
          } else if (moveX !== 0 && !isPositionBlocked(newX, monster.position.y, gameMap)) {
            monster.position = { x: newX, y: monster.position.y };
          } else if (moveY !== 0 && !isPositionBlocked(monster.position.x, newY, gameMap)) {
            monster.position = { x: monster.position.x, y: newY };
          }
        } else if (dist <= def.attackRange && now - monster.lastAttackTime > def.attackSpeed) {
          // Attack player
          monster.lastAttackTime = now;
          const result = monsterAttackPlayer(
            { ...monster, attack: def.attack, defense: def.defense },
            player.stats,
            player.equipment
          );

          if (result.isMiss) {
            addDamageNumber(player.position, 0, 'miss');
          } else {
            addDamageNumber(player.position, -result.damage, 'damage');
            // Screen shake when hit
            set({ screenShakeTime: now });
          }

          // Update player health
          const newHealth = Math.max(0, player.stats.health - result.damage);
          set(state => ({
            player: state.player ? {
              ...state.player,
              stats: { ...state.player.stats, health: newHealth },
            } : null,
          }));

          if (newHealth <= 0) {
            addChatMessage({
              type: 'combat',
              sender: 'System',
              content: `You were killed by ${def.name}!`,
              color: '#e74c3c',
            });
            setTimeout(() => get().playerDeath(), 500);
          }
        }
      } else {
        // Random wander
        if (Math.random() < 0.01 * deltaTime) {
          const dirs = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 },
          ];
          const dir = dirs[Math.floor(Math.random() * dirs.length)];
          const newX = monster.position.x + dir.x;
          const newY = monster.position.y + dir.y;
          if (!isPositionBlocked(newX, newY, gameMap) &&
              Math.abs(newX - monster.spawnPosition.x) < 8 &&
              Math.abs(newY - monster.spawnPosition.y) < 8) {
            monster.position = { x: newX, y: newY };
          }
        }
      }

      return { ...monster };
    });

    set({ monsters: updatedMonsters });
  },

  otherPlayers: [],
  setOtherPlayers: (players) => set({ otherPlayers: players }),
  updateOtherPlayer: (player) => {
    set(state => ({
      otherPlayers: state.otherPlayers.some(p => p.id === player.id)
        ? state.otherPlayers.map(p => p.id === player.id ? player : p)
        : [...state.otherPlayers, player],
    }));
  },
  removeOtherPlayer: (id) => {
    set(state => ({
      otherPlayers: state.otherPlayers.filter(p => p.id !== id),
    }));
  },

  movePlayer: (direction) => {
    const { player, gameMap, monsters } = get();
    if (!player) return;

    const dx = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
    const dy = direction === Direction.SOUTH ? 1 : direction === Direction.NORTH ? -1 : 0;
    const newX = player.position.x + dx;
    const newY = player.position.y + dy;

    // Bounds check
    if (newX < 0 || newX >= gameMap.tiles[0].length || newY < 0 || newY >= gameMap.tiles.length) return;

    // Tile collision
    if (isPositionBlocked(newX, newY, gameMap)) return;

    // Monster collision (don't walk on monsters)
    if (isMonsterAt(newX, newY, monsters)) return;

    set(state => ({
      player: state.player ? {
        ...state.player,
        position: { x: newX, y: newY },
        direction,
      } : null,
    }));
  },

  attackMonster: () => {
    const { player, monsters, addDamageNumber, addChatMessage, addToInventory } = get();
    if (!player) return;

    // Find monster in front of player
    const dx = player.direction === Direction.EAST ? 1 : player.direction === Direction.WEST ? -1 : 0;
    const dy = player.direction === Direction.SOUTH ? 1 : player.direction === Direction.NORTH ? -1 : 0;
    const targetX = player.position.x + dx;
    const targetY = player.position.y + dy;

    // Also check adjacent tiles
    let targetMonster = monsters.find(m =>
      !m.isDead && m.position.x === targetX && m.position.y === targetY
    );

    // If no monster in front, check all adjacent
    if (!targetMonster) {
      targetMonster = monsters.find(m =>
        !m.isDead &&
        Math.abs(m.position.x - player.position.x) <= 1 &&
        Math.abs(m.position.y - player.position.y) <= 1
      );
    }

    if (!targetMonster) {
      // Show sword slash even if no target
      get().addSpellEffect({
        type: 'sword_slash',
        position: { ...player.position },
        direction: player.direction,
        color: '#c0c0c0',
        startTime: Date.now(),
        duration: 300,
      });
      return;
    }

    const def = MONSTERS[targetMonster.definitionId];
    if (!def) return;

    const result = playerAttackMonster(player.stats, player.equipment, {
      ...targetMonster,
      attack: def.attack,
      defense: def.defense,
    });

    // Sword slash visual effect
    get().addSpellEffect({
      type: 'sword_slash',
      position: { ...player.position },
      direction: player.direction,
      color: result.isCritical ? '#ff4444' : '#c0c0c0',
      startTime: Date.now(),
      duration: 300,
    });

    if (result.isMiss) {
      addDamageNumber(targetMonster.position, 0, 'miss');
      addChatMessage({ type: 'combat', sender: 'Combat', content: `You missed the ${def.name}!`, color: '#95a5a6' });
    } else {
      const prefix = result.isCritical ? '💥 CRITICAL! ' : '';
      addDamageNumber(targetMonster.position, -result.damage, 'damage');
      addChatMessage({
        type: 'combat',
        sender: 'Combat',
        content: `${prefix}You hit ${def.name} for ${result.damage} damage.`,
        color: result.isCritical ? '#e74c3c' : '#e67e22',
      });

      // Update monster health
      const newMonsterHealth = targetMonster.health - result.damage;

      if (newMonsterHealth <= 0) {
        // Monster defeated
        addChatMessage({
          type: 'combat',
          sender: 'System',
          content: `You defeated ${def.name}! +${def.experience} XP`,
          color: '#f1c40f',
        });

        // Track quest kills
        if (typeof window !== 'undefined' && (window as any).__questTrackKill) {
          (window as any).__questTrackKill(targetMonster.definitionId);
        }

        addDamageNumber(targetMonster.position, def.experience, 'xp');

        // Generate loot
        const loot = generateLoot(def.lootTable);
        let lootMsg = 'Loot: ';
        for (const drop of loot) {
          if (drop.itemId === 'gold_coin') {
            set(state => ({
              player: state.player ? { ...state.player, gold: state.player.gold + drop.quantity } : null,
            }));
            lootMsg += `${drop.quantity} gold, `;
          } else {
            addToInventory(drop.itemId, drop.quantity);
            const itemDef = ITEMS[drop.itemId];
            if (itemDef) lootMsg += `${itemDef.name} x${drop.quantity}, `;
          }
        }
        if (loot.length > 0) {
          addChatMessage({ type: 'combat', sender: 'Loot', content: lootMsg.slice(0, -2), color: '#2ecc71' });
        }

        // Update XP
        set(state => {
          if (!state.player) return state;
          const newExp = state.player.stats.experience + def.experience;
          const { leveledUp, newLevel, newExpToNext } = calculateLevelUpStats(
            state.player.stats.level,
            newExp,
            state.player.stats.experienceToNext
          );

          if (leveledUp) {
            const newStats = calculateStats(state.player.vocation, newLevel);
            addChatMessage({
              type: 'system',
              sender: 'Level Up!',
              content: `🎉 Congratulations! You are now level ${newLevel}!`,
              color: '#f1c40f',
            });
            return {
              player: {
                ...state.player,
                stats: {
                  ...newStats,
                  experience: newExp - state.player.stats.experienceToNext,
                  health: newStats.maxHealth,
                  mana: newStats.maxMana,
                },
              },
              levelUpTime: Date.now(),
            };
          }

          return {
            player: {
              ...state.player,
              stats: {
                ...state.player.stats,
                experience: newExp,
              },
            },
          };
        });

        // Mark monster as dead
        set(state => ({
          monsters: state.monsters.map(m =>
            m.id === targetMonster.id
              ? { ...m, isDead: true, health: 0, deathTime: Date.now(), targetId: undefined }
              : m
          ),
        }));
      } else {
        // Update monster health
        set(state => ({
          monsters: state.monsters.map(m =>
            m.id === targetMonster.id ? { ...m, health: newMonsterHealth } : m
          ),
        }));
      }
    }
  },

  interactNPC: () => {
    const { player, gameMap, setActiveNPC } = get();
    if (!player) return;

    const npc = gameMap.npcs.find(n =>
      Math.abs(n.position.x - player.position.x) <= 2 &&
      Math.abs(n.position.y - player.position.y) <= 2
    );

    if (npc) {
      setActiveNPC(npc);
    }
  },

  chatMessages: [],
  addChatMessage: (message) => {
    const msg: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
    };
    set(state => ({ chatMessages: [...state.chatMessages.slice(-100), msg] }));
  },

  damageNumbers: [],
  addDamageNumber: (position, value, type) => {
    const dn: DamageNumber = {
      id: `dn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      position: { ...position },
      value,
      type,
      timestamp: Date.now(),
    };
    set(state => ({ damageNumbers: [...state.damageNumbers, dn] }));
  },
  cleanupDamageNumbers: () => {
    const now = Date.now();
    set(state => ({
      damageNumbers: state.damageNumbers.filter(dn => now - dn.timestamp < 2000),
    }));
  },

  // Spell Effects
  spellEffects: [],
  skillCooldowns: {},
  buffEndTime: 0,
  screenShakeTime: 0,
  levelUpTime: 0,
  lastAutoAttackTime: 0,
  addSpellEffect: (effect) => {
    const ef: SpellEffect = {
      ...effect,
      id: `ef_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    set(state => ({ spellEffects: [...state.spellEffects, ef] }));
  },
  cleanupSpellEffects: () => {
    const now = Date.now();
    set(state => ({
      spellEffects: state.spellEffects.filter(ef => now - ef.startTime < ef.duration),
    }));
  },

  castSkill: (skillIndex) => {
    const { player, monsters, addDamageNumber, addChatMessage, addSpellEffect, skillCooldowns, buffEndTime, addToInventory } = get();
    if (!player) return;

    const skills = getSkillsForVocation(player.vocation);
    const skill = skills[skillIndex];
    if (!skill) return;

    if (player.stats.level < skill.levelReq) {
      addChatMessage({ type: 'system', sender: 'Skills', content: `Need level ${skill.levelReq} for ${skill.name}!`, color: '#e74c3c' });
      return;
    }

    if (player.stats.mana < skill.manaCost) {
      addChatMessage({ type: 'system', sender: 'Skills', content: `Not enough mana! Need ${skill.manaCost} MP.`, color: '#3498db' });
      return;
    }

    const now = Date.now();
    const lastUsed = skillCooldowns[skill.id] || 0;
    if (now - lastUsed < skill.cooldown) {
      const remaining = Math.ceil((skill.cooldown - (now - lastUsed)) / 1000);
      addChatMessage({ type: 'system', sender: 'Skills', content: `${skill.name} on cooldown! ${remaining}s.`, color: '#e67e22' });
      return;
    }

    // Deduct mana
    set(state => {
      if (!state.player) return state;
      return {
        player: { ...state.player, stats: { ...state.player.stats, mana: Math.max(0, state.player.stats.mana - skill.manaCost) } },
        skillCooldowns: { ...state.skillCooldowns, [skill.id]: now },
      };
    });

    // Determine effect visual type
    const effectType = skill.type === 'heal' ? 'heal_aura' as const : getSkillEffectType(skill.id);

    if (skill.type === 'heal' && skill.healAmount) {
      // Heal spells
      const newHealth = Math.min(player.stats.maxHealth, player.stats.health + skill.healAmount);
      const healed = newHealth - player.stats.health;
      set(state => {
        if (!state.player) return state;
        return { player: { ...state.player, stats: { ...state.player.stats, health: newHealth } } };
      });
      addDamageNumber(player.position, healed, 'heal');
      addSpellEffect({ type: 'heal_aura', position: player.position, color: skill.color, startTime: now, duration: 800 });
      addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name}! +${healed} HP`, color: skill.color });
      return;
    }

    if (skill.type === 'buff') {
      set({ buffEndTime: now + 10000 });
      addSpellEffect({ type: 'war_cry', position: player.position, color: skill.color, startTime: now, duration: 1000 });
      addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name}! Attack boosted 10s!`, color: skill.color });
      return;
    }

    // Attack spells - find target
    const dirOffset = DIR_OFFSETS[player.direction];
    let targetMonster: MonsterInstance | undefined;

    if (skill.range <= 1) {
      // Melee - check in front first, then adjacent
      targetMonster = monsters.find(m =>
        !m.isDead && m.position.x === player.position.x + dirOffset.x && m.position.y === player.position.y + dirOffset.y
      );
      if (!targetMonster) {
        targetMonster = monsters.find(m =>
          !m.isDead && Math.abs(m.position.x - player.position.x) <= 1 && Math.abs(m.position.y - player.position.y) <= 1
        );
      }
    } else {
      // Ranged - find closest monster in direction, up to range
      let closestDist = Infinity;
      for (const m of monsters) {
        if (m.isDead) continue;
        const dx = m.position.x - player.position.x;
        const dy = m.position.y - player.position.y;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist > skill.range) continue;
        // Check if monster is roughly in the direction the player faces
        const dotProduct = dx * dirOffset.x + dy * dirOffset.y;
        if (dotProduct > 0 || dist <= 2) { // Allow some leeway
          if (dist < closestDist) {
            closestDist = dist;
            targetMonster = m;
          }
        }
      }
    }

    if (!targetMonster) {
      // Show effect at the direction player faces even if no target
      const fx = player.position.x + dirOffset.x * Math.min(skill.range, 3);
      const fy = player.position.y + dirOffset.y * Math.min(skill.range, 3);
      addSpellEffect({ type: effectType, position: player.position, direction: player.direction, targetPosition: { x: fx, y: fy }, color: skill.color, startTime: now, duration: 600, size: skill.range });
      addChatMessage({ type: 'system', sender: 'Skill', content: `${skill.icon} ${skill.name}! No target.`, color: '#95a5a6' });
      return;
    }

    // Calculate damage
    const buffBonus = now < (get().buffEndTime) ? 1.3 : 1.0;
    const magicPower = player.stats.magicAttack + (skill.damage || 0) * 0.3;
    const variance = 0.8 + Math.random() * 0.4;
    let dmg = Math.floor((skill.damage || 30) + magicPower * 0.5 * variance * buffBonus);
    const def = MONSTERS[targetMonster.definitionId];
    if (def) dmg = Math.max(1, dmg - Math.floor(def.defense * 0.3));

    addDamageNumber(targetMonster.position, -dmg, 'damage');

    // Visual effect
    addSpellEffect({
      type: effectType,
      position: player.position,
      direction: player.direction,
      targetPosition: { ...targetMonster.position },
      color: skill.color,
      startTime: now,
      duration: 600,
      size: skill.range,
      damage: dmg,
    });

    const newMonsterHealth = targetMonster.health - dmg;

    if (newMonsterHealth <= 0) {
      // Monster killed
      if (def) {
        addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name} killed ${def.name}! +${def.experience} XP`, color: '#f1c40f' });
        addDamageNumber(targetMonster.position, def.experience, 'xp');

        // Loot
        const loot = generateLoot(def.lootTable);
        for (const drop of loot) {
          if (drop.itemId === 'gold_coin') {
            set(state => ({ player: state.player ? { ...state.player, gold: state.player.gold + drop.quantity } : null }));
          } else {
            addToInventory(drop.itemId, drop.quantity);
          }
        }

        // XP
        set(state => {
          if (!state.player) return state;
          const newExp = state.player.stats.experience + def.experience;
          const { leveledUp, newLevel, newExpToNext } = calculateLevelUpStats(state.player.stats.level, newExp, state.player.stats.experienceToNext);
          if (leveledUp) {
            const newStats = calculateStats(state.player.vocation, newLevel);
            addChatMessage({ type: 'system', sender: 'Level Up!', content: `🎉 Level ${newLevel}!`, color: '#f1c40f' });
            return { player: { ...state.player, stats: { ...newStats, experience: newExp - state.player.stats.experienceToNext, health: newStats.maxHealth, mana: newStats.maxMana } }, levelUpTime: Date.now() };
          }
          return { player: { ...state.player, stats: { ...state.player.stats, experience: newExp } } };
        });
      }

      set(state => ({
        monsters: state.monsters.map(m => m.id === targetMonster.id ? { ...m, isDead: true, health: 0, deathTime: Date.now(), targetId: undefined } : m),
      }));
    } else {
      set(state => ({
        monsters: state.monsters.map(m => m.id === targetMonster.id ? { ...m, health: newMonsterHealth } : m),
      }));
      if (def) addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name} hit ${def.name} for ${dmg}!`, color: skill.color });
    }
  },

  addToInventory: (itemId, quantity) => {
    set(state => {
      if (!state.player) return state;
      const itemDef = ITEMS[itemId];
      const inventory = [...state.player.inventory];

      if (itemDef?.stackable) {
        const existing = inventory.find(i => i.itemId === itemId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          inventory.push({
            id: generateLootId(),
            itemId,
            quantity,
            slot: inventory.length,
          });
        }
      } else {
        for (let i = 0; i < quantity; i++) {
          inventory.push({
            id: generateLootId(),
            itemId,
            quantity: 1,
            slot: inventory.length,
          });
        }
      }

      return { player: { ...state.player, inventory } };
    });
  },

  removeFromInventory: (invItemId, quantity) => {
    set(state => {
      if (!state.player) return state;
      const inventory = state.player.inventory.map(item => {
        if (item.id === invItemId) {
          const newQty = item.quantity - quantity;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as InventoryItem[];

      return { player: { ...state.player, inventory } };
    });
  },

  consumeInventoryItem: (invItemId) => {
    const { player, addChatMessage, addDamageNumber } = get();
    if (!player) return;

    const invItem = player.inventory.find(i => i.id === invItemId);
    if (!invItem) return;

    const result = consumeItem(invItem.itemId, player.stats, player.inventory);
    if (result.used) {
      set(state => ({
        player: state.player ? {
          ...state.player,
          stats: result.stats,
          inventory: result.inventory,
        } : null,
      }));
      addChatMessage({ type: 'system', sender: 'Item', content: result.message, color: '#2ecc71' });
      if (result.stats.health > player.stats.health) {
        addDamageNumber(player.position, result.stats.health - player.stats.health, 'heal');
      }
    } else {
      addChatMessage({ type: 'system', sender: 'Item', content: result.message, color: '#e74c3c' });
    }
  },

  equipItem: (invItemId) => {
    const { player, addChatMessage } = get();
    if (!player) return;

    const invItem = player.inventory.find(i => i.id === invItemId);
    if (!invItem) return;

    const itemDef = ITEMS[invItem.itemId];
    if (!itemDef) return;

    // Check vocation requirement
    if (itemDef.vocationReq && !itemDef.vocationReq.includes(player.vocation)) {
      addChatMessage({ type: 'system', sender: 'System', content: `Only ${itemDef.vocationReq.join('/')}s can equip this.`, color: '#e74c3c' });
      return;
    }

    // Check level requirement
    if (player.stats.level < itemDef.levelReq) {
      addChatMessage({ type: 'system', sender: 'System', content: `You need level ${itemDef.levelReq} to equip this.`, color: '#e74c3c' });
      return;
    }

    // Determine slot
    const slotMap: Record<string, EquipSlot> = {
      [EquipSlot.WEAPON]: EquipSlot.WEAPON,
      [EquipSlot.ARMOR]: EquipSlot.ARMOR,
      [EquipSlot.SHIELD]: EquipSlot.SHIELD,
      [EquipSlot.HELMET]: EquipSlot.HELMET,
      [EquipSlot.LEGS]: EquipSlot.LEGS,
      [EquipSlot.BOOTS]: EquipSlot.BOOTS,
      [EquipSlot.RING]: EquipSlot.RING,
      [EquipSlot.AMULET]: EquipSlot.AMULET,
    };

    const slot = slotMap[itemDef.type];
    if (!slot) {
      addChatMessage({ type: 'system', sender: 'System', content: 'This item cannot be equipped.', color: '#e74c3c' });
      return;
    }

    // Swap equipment
    const currentEquipped = player.equipment[slot];
    const newEquipment = { ...player.equipment };
    newEquipment[slot] = invItem.itemId;

    const newInventory = player.inventory.filter(i => i.id !== invItemId);
    if (currentEquipped) {
      newInventory.push({ id: generateLootId(), itemId: currentEquipped, quantity: 1, slot: newInventory.length });
    }

    set(state => ({
      player: state.player ? {
        ...state.player,
        equipment: newEquipment,
        inventory: newInventory,
      } : null,
    }));

    addChatMessage({ type: 'system', sender: 'Equipment', content: `Equipped ${itemDef.name}.`, color: '#3498db' });
  },

  unequipItem: (slot) => {
    const { player, addChatMessage } = get();
    if (!player) return;

    const equippedItemId = player.equipment[slot];
    if (!equippedItemId) return;

    const itemDef = ITEMS[equippedItemId];
    if (!itemDef) return;

    const newEquipment = { ...player.equipment };
    newEquipment[slot] = null;

    const newInventory = [...player.inventory, {
      id: generateLootId(),
      itemId: equippedItemId,
      quantity: 1,
      slot: player.inventory.length,
    }];

    set(state => ({
      player: state.player ? {
        ...state.player,
        equipment: newEquipment,
        inventory: newInventory,
      } : null,
    }));

    addChatMessage({ type: 'system', sender: 'Equipment', content: `Unequipped ${itemDef.name}.`, color: '#3498db' });
  },

  activeNPC: null,
  setActiveNPC: (npc) => set({ activeNPC: npc }),

  buyItem: (itemId) => {
    const { player, addChatMessage } = get();
    if (!player) return;

    const itemDef = ITEMS[itemId];
    if (!itemDef) return;

    if (player.gold < itemDef.buyPrice) {
      addChatMessage({ type: 'system', sender: 'Merchant', content: "You don't have enough gold!", color: '#e74c3c' });
      return;
    }

    // Add to inventory and deduct gold
    set(state => {
      if (!state.player) return state;
      const newInventory = [...state.player.inventory];
      if (itemDef.stackable) {
        const existing = newInventory.find(i => i.itemId === itemId);
        if (existing) {
          existing.quantity += 1;
        } else {
          newInventory.push({ id: generateLootId(), itemId, quantity: 1, slot: newInventory.length });
        }
      } else {
        newInventory.push({ id: generateLootId(), itemId, quantity: 1, slot: newInventory.length });
      }
      return {
        player: {
          ...state.player,
          gold: state.player.gold - itemDef.buyPrice,
          inventory: newInventory,
        },
      };
    });

    addChatMessage({ type: 'system', sender: 'Merchant', content: `Bought ${itemDef.name} for ${itemDef.buyPrice} gold.`, color: '#2ecc71' });
  },

  sellItem: (invItemId) => {
    const { player, addChatMessage } = get();
    if (!player) return;

    const invItem = player.inventory.find(i => i.id === invItemId);
    if (!invItem) return;

    const itemDef = ITEMS[invItem.itemId];
    if (!itemDef || itemDef.sellPrice <= 0) {
      addChatMessage({ type: 'system', sender: 'Merchant', content: 'This item cannot be sold.', color: '#e74c3c' });
      return;
    }

    const sellPrice = itemDef.sellPrice * invItem.quantity;

    set(state => {
      if (!state.player) return state;
      const newInventory = state.player.inventory.filter(i => i.id !== invItemId);
      return {
        player: {
          ...state.player,
          gold: state.player.gold + sellPrice,
          inventory: newInventory,
        },
      };
    });

    const qtyStr = invItem.quantity > 1 ? ` x${invItem.quantity}` : '';
    addChatMessage({ type: 'system', sender: 'Merchant', content: `Sold ${itemDef.name}${qtyStr} for ${sellPrice} gold.`, color: '#f1c40f' });
  },

  playerDeath: () => {
    const { player, addChatMessage } = get();
    if (!player) return;
    set(state => ({
      player: state.player ? {
        ...state.player,
        stats: {
          ...state.player.stats,
          health: 0,
        },
      } : null,
      screen: 'dead' as GameScreen,
    }));
    addChatMessage({
      type: 'system',
      sender: 'System',
      content: 'You have died! Press Respawn to return to town.',
      color: '#e74c3c',
    });
  },

  respawn: () => {
    const { player, gameMap, addChatMessage } = get();
    if (!player) return;
    const newStats = calculateStats(player.vocation, player.stats.level);
    // Lose 10% experience on death
    const xpLost = Math.floor(player.stats.experience * 0.1);
    const newExp = Math.max(0, player.stats.experience - xpLost);
    set(state => ({
      player: state.player ? {
        ...state.player,
        position: { ...gameMap.spawnPoint },
        stats: {
          ...newStats,
          experience: newExp,
          experienceToNext: state.player.stats.experienceToNext,
        },
      } : null,
      screen: 'game' as GameScreen,
    }));
    addChatMessage({
      type: 'system',
      sender: 'System',
      content: `You have been resurrected at the town spawn.${xpLost > 0 ? ` Lost ${xpLost} XP.` : ''}`,
      color: '#2ecc71',
    });
  },

  regenMana: (deltaTime) => {
    set(state => {
      if (!state.player) return state;
      const { mana, maxMana } = state.player.stats;
      if (mana >= maxMana) return state;
      // Spellcasters regen much faster
      const isCaster = state.player.vocation === 'Sorcerer' || state.player.vocation === 'Druid';
      const baseRegen = isCaster ? 3 : 1;
      const regenPerLevel = isCaster ? 0.8 : 0.2;
      const regenAmount = Math.min(baseRegen + state.player.stats.level * regenPerLevel, maxMana - mana);
      const regen = regenAmount * (deltaTime / 1000);
      return {
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            mana: Math.min(maxMana, mana + regen),
          },
        },
      };
    });
  },
}));

function isMonsterAt(x: number, y: number, monsters: MonsterInstance[], excludeId?: string): boolean {
  return monsters.some(m =>
    !m.isDead &&
    m.position.x === x &&
    m.position.y === y &&
    m.id !== excludeId
  );
}