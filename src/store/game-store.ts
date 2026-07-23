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
  DroppedLoot,
} from '@/lib/game/types';
import { calculateStats, VOCATION_STATS } from '@/lib/game/types';
import { getGameMap } from '@/lib/game/tilemap';
import { MONSTERS } from '@/lib/game/monsters';
import { ITEMS } from '@/lib/game/items';
import { BotInstance, generateBots } from '@/lib/game/bots';
import {
  playerAttackMonster,
  monsterAttackPlayer,
  consumeItem,
  calculateLevelUpStats,
  generateLoot,
} from '@/lib/game/combat';
import { getSkillsForVocation, getSkill, getSkillEffectType, MAX_EQUIPPED_SKILLS } from '@/lib/game/skills';

export type GameScreen = 'login' | 'game' | 'dead';
export type MatchPhase = 'hunting' | 'preparation' | 'arena' | 'ended';

interface GameState {
  // Screen
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;

  // Match State
  matchPhase: MatchPhase;
  matchTimeLeft: number; // in seconds
  setMatchPhase: (phase: MatchPhase) => void;
  updateMatchTimer: (deltaTime: number) => void;
  resetMatch: () => void;

  // Player
  player: PlayerData | null;
  createPlayer: (name: string, vocation: Vocation) => void;

  // Game Map
  gameMap: GameMap;

  // Monsters & Loot
  monsters: MonsterInstance[];
  droppedLoot: DroppedLoot[];
  spawnMonsters: () => void;
  updateMonsters: (deltaTime: number) => void;
  updateLoot: (deltaTime: number) => void;

  // Other Players (multiplayer)
  otherPlayers: OtherPlayer[];
  setOtherPlayers: (players: OtherPlayer[]) => void;
  updateOtherPlayer: (player: OtherPlayer) => void;
  removeOtherPlayer: (id: string) => void;

  // Bots & Safezone
  bots: BotInstance[];
  spawnBots: (count: number) => void;
  updateBots: (deltaTime: number) => void;
  safeZoneRadius: number;

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
  castSkill: (hotkeyIndex: number) => void;
  skillCooldowns: Record<string, number>;
  buffEndTime: number;
  skillUpgrades: Record<string, number>;
  upgradeSkill: (skillId: string) => void;

  // Skill & Inventory UI
  showSkillPanel: boolean;
  toggleSkillPanel: () => void;
  showInventoryPanel: boolean;
  toggleInventoryPanel: () => void;
  equippedSkillIds: string[];
  equipSkill: (skillId: string) => void;
  unequipSkill: (skillId: string) => void;

  // Visual feedback
  screenShakeTime: number;
  levelUpTime: number;
  lastAutoAttackTime: number;
  lastCombatTime: number;
  setLastCombatTime: (time: number) => void;

  // Inventory
  addToInventory: (itemId: string, quantity: number) => void;
  removeFromInventory: (invItemId: string, quantity: number) => void;
  consumeInventoryItem: (invItemId: string) => void;
  quickUsePotion: () => void;
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

  // Save / Load
  savePlayer: () => Promise<void>;
  loadPlayer: (name: string) => Promise<boolean>;
  savedCharacterNames: string[];
  fetchSavedCharacters: () => Promise<void>;
  deleteCharacter: (name: string) => Promise<void>;
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

// Town bounds (safe zone)
const TOWN_BOUNDS = { x: 35, y: 35, w: 30, h: 25 };

function isInTown(x: number, y: number): boolean {
  return x >= TOWN_BOUNDS.x && x < TOWN_BOUNDS.x + TOWN_BOUNDS.w &&
         y >= TOWN_BOUNDS.y && y < TOWN_BOUNDS.y + TOWN_BOUNDS.h;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'login',
  setScreen: (screen) => set({ screen }),

  matchPhase: 'hunting',
  matchTimeLeft: 180, // 3 minutes hunting phase
  setMatchPhase: (phase) => set({ matchPhase: phase }),
  updateMatchTimer: (deltaTime) => {
    const { matchPhase, matchTimeLeft } = get();
    if (matchPhase === 'ended') return;

    // deltaTime is in ms. We decrement our seconds timer.
    const newTime = matchTimeLeft - (deltaTime / 1000);
    
    if (newTime <= 0) {
      if (matchPhase === 'hunting') {
        const { player, bots } = get();
        get().addChatMessage({ type: 'system', sender: 'System', content: '⏳ THE HUNT IS OVER! 40 SECONDS TO PREPARE!', color: '#3498db' });
        
        // Upgrade bots to match player's level dynamically
        const playerLevel = player ? player.stats.level : 5;
        const upgradedBots = bots.map(bot => {
            const newLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2); // Level +/- 2 of player
            const newStats = calculateStats(bot.vocation, newLevel);
            return {
                ...bot,
                // Teleport bot to Arena with some scatter
                position: { x: 50 + Math.floor(Math.random() * 12) - 6, y: 47 + Math.floor(Math.random() * 12) - 6 },
                stats: {
                    ...bot.stats, // Keep some base properties
                    ...newStats,  // Apply scaled properties
                    health: newStats.maxHealth,
                    mana: newStats.maxMana,
                }
            };
        });

        set({ 
          matchPhase: 'preparation', 
          matchTimeLeft: 40, // 40s to buy from Merchant
          monsters: [], // Clear all monsters for the final showdown
          bots: upgradedBots,
          player: player ? {
            ...player,
            // Teleport to the center of the Arena (Town) near the merchant
            position: { x: 50 + Math.floor(Math.random() * 4) - 2, y: 47 + Math.floor(Math.random() * 4) - 2 },
            // Full heal
            stats: {
              ...player.stats,
              health: player.stats.maxHealth,
              mana: player.stats.maxMana
            }
          } : null
        });
      } else if (matchPhase === 'preparation') {
        const { player, bots, gameMap } = get();
        get().addChatMessage({ type: 'system', sender: 'System', content: '⚔️ LET THE SLAUGHTER BEGIN! ⚔️', color: '#ff4444' });
        
        // Helper to find a non-blocking spawn across the ENTIRE map
        const getRandomSpawn = () => {
            let sx = 0, sy = 0, attempts = 0;
            do {
                sx = 5 + Math.floor(Math.random() * (gameMap.tiles[0].length - 10));
                sy = 5 + Math.floor(Math.random() * (gameMap.tiles.length - 10));
                attempts++;
            } while (gameMap.tiles[sy][sx] !== 0 && gameMap.tiles[sy][sx] !== 1 && attempts < 50);
            return { x: sx, y: sy };
        };

        const scatteredBots = bots.map(bot => ({
            ...bot,
            position: getRandomSpawn()
        }));
        
        set({ 
            matchPhase: 'arena', 
            matchTimeLeft: 180, // Increased Arena time to 3 minutes because map is big
            safeZoneRadius: 100, // Starts covering the whole map
            bots: scatteredBots,
            player: player ? {
                ...player,
                position: getRandomSpawn()
            } : null
        });
      } else if (matchPhase === 'arena') {
        get().addChatMessage({ type: 'system', sender: 'System', content: '🏁 MATCH ENDED (TIME LIMIT)! 🏁', color: '#f1c40f' });
        set({ matchPhase: 'ended', matchTimeLeft: 0 });
      }
    } else {
      set({ matchTimeLeft: newTime });
      
      // Check win condition and process safe zone during Arena
      if (get().matchPhase === 'arena') {
          const { player, bots, matchTimeLeft, addDamageNumber } = get();
          const isPlayerAlive = player && player.stats.health > 0;
          
          if (isPlayerAlive && bots.length === 0) {
              get().addChatMessage({ type: 'system', sender: 'System', content: '🏆 VICTORY! YOU ARE THE LAST ONE STANDING! 🏆', color: '#f1c40f' });
              set({ matchPhase: 'ended', matchTimeLeft: 0 });
          }

          // Shrink Safe Zone logic (shrinks from 100 down to 0 over 180 seconds)
          const newRadius = Math.max(0, (matchTimeLeft / 180) * 80);
          set({ safeZoneRadius: newRadius });

          // Damage entities outside safe zone (center of map is 50, 50)
          const cx = 50;
          const cy = 50;
          
          if (isPlayerAlive) {
              const dist = Math.sqrt(Math.pow(player.position.x - cx, 2) + Math.pow(player.position.y - cy, 2));
              if (dist > newRadius + 2) {
                  // Real damage to player every tick (approx 3 damage per second)
                  if (Math.random() < 0.02) {
                      addDamageNumber(player.position, 5, 'damage');
                      set(state => ({
                          player: state.player ? {
                              ...state.player,
                              stats: { ...state.player.stats, health: state.player.stats.health - 5 }
                          } : null
                      }));
                  }
              }
          }

          // Damage bots outside safe zone
          if (Math.random() < 0.02) {
              const newBots = bots.map(b => {
                  const dist = Math.sqrt(Math.pow(b.position.x - cx, 2) + Math.pow(b.position.y - cy, 2));
                  if (dist > newRadius + 2) {
                      addDamageNumber(b.position, 5, 'damage');
                      return { ...b, stats: { ...b.stats, health: b.stats.health - 5 } };
                  }
                  return b;
              });
              set({ bots: newBots });
          }
      }
    }
  },
  resetMatch: () => set({ matchPhase: 'hunting', matchTimeLeft: 180, safeZoneRadius: 100 }),

  gameMap: getGameMap(),

  safeZoneRadius: 100,
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
    
    // Spawn 10 bots at start
    get().spawnBots(10);
    
    set({ player, screen: 'game', equippedSkillIds: getSkillsForVocation(vocation).slice(0, 3).map(s => s.id) });
    get().addChatMessage({
      type: 'system',
      sender: 'System',
      content: `Welcome to Tibia Lands, ${name} the ${vocation}! WASD: Move | Space: Attack | I/O/P: Skills | K: Skill Panel | Q1/Q2: Potions | 1-9: Items | E: Interact`,
      color: '#f1c40f',
    });
  },

  gameMap: getGameMap(),

  monsters: [],
  droppedLoot: [],
  spawnMonsters: () => {
    const map = get().gameMap;
    const monsters: MonsterInstance[] = [];
    
    for (const zone of map.monsterZones) {
      for (let i = 0; i < zone.maxMonsters; i++) {
        const monsterDefId = zone.monsterIds[Math.floor(Math.random() * zone.monsterIds.length)];
        const def = MONSTERS[monsterDefId];
        if (!def) continue;

        let spawnX = 0, spawnY = 0;
        let attempts = 0;
        const isPositionBlocked = (x: number, y: number, gameMap: any) => {
           const tile = gameMap.tiles[y][x];
           return tile === 2 /* WATER */ || tile === 5 /* WALL */ || tile === 10 /* ROCK */ || tile === 13 /* TREE */;
        };

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
            direction: 2, // SOUTH
          });
        }
      }
    }
    set({ monsters });
  },

  bots: [],
  spawnBots: (count) => {
    const map = get().gameMap;
    const matchRiskyRatio = 0.2 + Math.random() * 0.3; // 20% to 50%
    const matchLooterRatio = 0.1 + Math.random() * 0.3; // 10% to 40%
    const bots = generateBots(count, map.spawnPoint, matchRiskyRatio, matchLooterRatio);
    set({ bots });
  },
  
  updateBots: (deltaTime) => {
    const { bots, gameMap, player, matchPhase, addDamageNumber, addChatMessage } = get();
    const now = Date.now();
    
    let updated = false;
    const botDamageMap = new Map<string, number>();

    const newBots = bots.map(bot => {
      const canMove = now - bot.lastMoveTime >= 1000 / bot.stats.speed;
      const canAttack = now - bot.lastAttackTime >= 1000;
      
      if (!canMove && !canAttack) return bot;
      
      let newBot = { ...bot };
      let botUpdated = false;
      
      const { safeZoneRadius } = get();
      const distToCenter = Math.sqrt(Math.pow(bot.position.x - 50, 2) + Math.pow(bot.position.y - 50, 2));
      
      // AI: Healing Logic
      const hpPercent = bot.stats.health / bot.stats.maxHealth;
      const isFleeing = hpPercent < bot.fleeThreshold;
      if (isFleeing && (!bot.lastHealTime || now - bot.lastHealTime > 5000)) {
          newBot.stats.health = Math.min(bot.stats.maxHealth, bot.stats.health + 40);
          newBot.lastHealTime = now;
          addDamageNumber(bot.position, 40, 'heal');
          botUpdated = true;
      }

      if (matchPhase === 'arena' && distToCenter > safeZoneRadius) {
          // Escape storm
          if (canMove) {
              const dx = Math.sign(50 - bot.position.x);
              const dy = Math.sign(50 - bot.position.y);
              newBot.position = { x: bot.position.x + dx, y: bot.position.y + dy };
              newBot.lastMoveTime = now;
              botUpdated = true;
          }
      } else {
          // Find Targets
          let closestTarget: { id: string, x: number, y: number, type: 'player' | 'bot' | 'monster' | 'loot' } | null = null;
          let minDistance = Infinity;

          if (matchPhase === 'arena') {
             if (player && player.stats.health > 0) {
                 if (!isInTown(player.position.x, player.position.y) && !isInTown(bot.position.x, bot.position.y)) {
                     const dist = Math.abs(player.position.x - bot.position.x) + Math.abs(player.position.y - bot.position.y);
                     closestTarget = { id: 'player', x: player.position.x, y: player.position.y, type: 'player' };
                     minDistance = dist;
                 }
             }
             for (const otherBot of bots) {
                 if (otherBot.id === bot.id) continue;
                 if (isInTown(otherBot.position.x, otherBot.position.y) || isInTown(bot.position.x, bot.position.y)) continue;
                 const dist = Math.abs(otherBot.position.x - bot.position.x) + Math.abs(otherBot.position.y - bot.position.y);
                 if (dist < minDistance) {
                     minDistance = dist;
                     closestTarget = { id: otherBot.id, x: otherBot.position.x, y: otherBot.position.y, type: 'bot' };
                 }
             }
          } else if (matchPhase === 'hunting') {
             if (bot.isLooter) {
                 const droppedLoot = get().droppedLoot;
                 for (const loot of droppedLoot) {
                     const dist = Math.abs(loot.position.x - bot.position.x) + Math.abs(loot.position.y - bot.position.y);
                     if (dist < minDistance && dist < 15) { 
                         minDistance = dist - 50; 
                         closestTarget = { id: loot.id, x: loot.position.x, y: loot.position.y, type: 'loot' };
                     }
                 }
             }

             const monstersList = get().monsters;
             for (const m of monstersList) {
                 if (m.isDead) continue;
                 const mDef = MONSTERS[m.definitionId];
                 if (!mDef) continue;
                 const isHard = mDef.level >= 5;
                 
                 const isPreferred = (bot.huntingRisk === 'risky' && isHard) || (bot.huntingRisk === 'safe' && !isHard);
                 const dist = Math.abs(m.position.x - bot.position.x) + Math.abs(m.position.y - bot.position.y) + (isPreferred ? 0 : 30);
                 
                 if (dist < minDistance) {
                     minDistance = dist;
                     closestTarget = { id: m.id, x: m.position.x, y: m.position.y, type: 'monster' };
                 }
             }
          }

          if (closestTarget) {
              const trueDist = Math.abs(closestTarget.x - bot.position.x) + Math.abs(closestTarget.y - bot.position.y);
              let dx = Math.sign(closestTarget.x - bot.position.x);
              let dy = Math.sign(closestTarget.y - bot.position.y);

              if (canMove) {
                  if (isFleeing || (bot.attackRange > 1 && trueDist <= 2)) {
                     dx = -dx; 
                     dy = -dy;
                     const nx = bot.position.x + dx;
                     const ny = bot.position.y + dy;
                     if (!isPositionBlocked(nx, ny, gameMap)) {
                         newBot.position = { x: nx, y: ny };
                         newBot.lastMoveTime = now;
                         botUpdated = true;
                     }
                  } else if (trueDist > bot.attackRange) {
                     const nx = bot.position.x + dx;
                     const ny = bot.position.y + dy;
                     if (!isPositionBlocked(nx, ny, gameMap)) {
                         newBot.position = { x: nx, y: ny };
                         newBot.lastMoveTime = now;
                         botUpdated = true;
                     }
                  }
              }

              if (canAttack && trueDist <= bot.attackRange) {
                  newBot.lastAttackTime = now;
                  botUpdated = true;
                  
                  // 30% chance to cast a skill if they have enough mana
                  let spellCast = false;
                  let spellDamage = 0;
                  let effect = bot.attackRange > 1 ? 'projectile' : 'sword_slash';
                  let spellColor = '#e74c3c';
                  
                  if (Math.random() < 0.3) {
                      const skills = getSkillsForVocation(bot.vocation).filter(s => s.type === 'attack');
                      if (skills.length > 0) {
                          const skill = skills[Math.floor(Math.random() * skills.length)];
                          if (bot.stats.mana >= skill.manaCost) {
                              newBot.stats.mana -= skill.manaCost;
                              spellCast = true;
                              effect = getSkillEffectType(skill.id) as any;
                              spellColor = skill.color;
                              
                              const magicPower = bot.stats.magicAttack + (skill.damage || 0) * 0.3;
                              spellDamage = Math.floor((skill.damage || 30) + magicPower * 0.5);
                          }
                      }
                  }
                  
                  if (closestTarget.type === 'player') {
                     let finalDmg = spellCast ? spellDamage : Math.floor(bot.stats.attack * 2.5);
                     if (spellCast) finalDmg = Math.max(1, Math.floor(finalDmg * 0.35)); // PvP scaling for spells
                     
                     addDamageNumber(player!.position, finalDmg, 'damage');
                     get().addSpellEffect({ type: effect as any, position: { ...player!.position }, direction: Direction.SOUTH, color: spellColor, startTime: now, duration: 300 });
                     set(s => ({ player: s.player ? { ...s.player, stats: { ...s.player.stats, health: Math.max(0, s.player.stats.health - finalDmg) } } : null }));
                  } else if (closestTarget.type === 'bot') {
                     let finalDmg = spellCast ? spellDamage : Math.floor(bot.stats.attack * 2.5);
                     if (spellCast) finalDmg = Math.max(1, Math.floor(finalDmg * 0.35)); // PvP scaling for spells
                     
                     addDamageNumber({ x: closestTarget.x, y: closestTarget.y }, finalDmg, 'damage');
                     get().addSpellEffect({ type: effect as any, position: { x: closestTarget.x, y: closestTarget.y }, direction: Direction.SOUTH, color: spellColor, startTime: now, duration: 300 });
                     botDamageMap.set(closestTarget.id, (botDamageMap.get(closestTarget.id) || 0) + finalDmg);
                  } else if (closestTarget.type === 'monster') {
                     let finalDmg = spellCast ? spellDamage : bot.stats.attack;
                     addDamageNumber({ x: closestTarget.x, y: closestTarget.y }, finalDmg, 'damage');
                     get().addSpellEffect({ type: effect as any, position: { x: closestTarget.x, y: closestTarget.y }, direction: Direction.SOUTH, color: spellColor, startTime: now, duration: 300 });
                     
                     const ml = get().monsters.map(m => {
                         if (m.id === closestTarget!.id && !m.isDead) {
                             const mH = m.health - finalDmg;
                             if (mH <= 0) {
                                 newBot.stats.level += 1;
                                 newBot.stats.attack += 2;
                                 newBot.stats.maxHealth += 20;
                                 newBot.stats.health = newBot.stats.maxHealth; 
                                 addDamageNumber(newBot.position, 0, 'xp');
                                 return { ...m, health: 0, isDead: true, deathTime: now };
                             }
                             return { ...m, health: mH };
                         }
                         return m;
                     });
                     set({ monsters: ml });
                  } else if (closestTarget.type === 'loot') {
                     set(s => ({ droppedLoot: s.droppedLoot.filter(l => l.id !== closestTarget!.id) }));
                  }
              }
          } else {
             if (canMove && Math.random() < 0.2) {
                const dirs = [{ x: 1, y: 0, dir: 1 }, { x: -1, y: 0, dir: 3 }, { x: 0, y: 1, dir: 2 }, { x: 0, y: -1, dir: 0 }];
                const move = dirs[Math.floor(Math.random() * dirs.length)];
                const nx = bot.position.x + move.x;
                const ny = bot.position.y + move.y;
                if (!isPositionBlocked(nx, ny, gameMap)) {
                    newBot.position = { x: nx, y: ny };
                    newBot.direction = move.dir;
                    newBot.lastMoveTime = now;
                    botUpdated = true;
                }
             }
          }
      }
      if (botUpdated) updated = true;
      return botUpdated ? newBot : bot;
    });

    if (updated || botDamageMap.size > 0) {
        // Apply damage to bots
        const finalBots = newBots.map(b => {
            const dmg = botDamageMap.get(b.id);
            if (dmg) {
                b.stats.health -= dmg;
            }
            return b;
        }).filter(b => {
            if (b.stats.health <= 0) {
                addChatMessage({ type: 'system', sender: 'System', content: `☠️ ${b.name} was eliminated!`, color: '#e74c3c' });
                // Bot drops a mega chest on death!
                const newDrops: DroppedLoot[] = [
                    { id: `loot_${Date.now()}_1`, position: { ...b.position }, itemId: 'health_potion_large', quantity: 3, expiresAt: Date.now() + 60000 },
                    { id: `loot_${Date.now()}_2`, position: { ...b.position }, itemId: 'gold_coin', quantity: 200, expiresAt: Date.now() + 60000 }
                ];
                set(s => ({ droppedLoot: [...s.droppedLoot, ...newDrops] }));
                return false;
            }
            return true;
        });

        set({ bots: finalBots });
    }
  },

  updateLoot: (deltaTime: number) => {
    const now = Date.now();
    set(state => {
      const remainingLoot = state.droppedLoot.filter(l => l.expiresAt > now);
      if (remainingLoot.length !== state.droppedLoot.length) {
        return { droppedLoot: remainingLoot };
      }
      return state;
    });
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
              direction: Direction.SOUTH,
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
        // Monsters cannot enter or stay in town
        if (isInTown(monster.position.x, monster.position.y)) {
          monster.targetId = undefined;
          // Move towards spawn position
          if (Math.random() < 0.005 * deltaTime) {
              const sdx = monster.spawnPosition.x - monster.position.x;
              const sdy = monster.spawnPosition.y - monster.position.y;
              if (Math.abs(sdx) > 0 || Math.abs(sdy) > 0) {
                const retX = sdx > 0 ? 1 : sdx < 0 ? -1 : 0;
                const retY = sdy > 0 ? 1 : sdy < 0 ? -1 : 0;
                const rX = monster.position.x + retX;
                const rY = monster.position.y + retY;
                if (!isPositionBlocked(rX, rY, gameMap)) {
                  monster.position = { x: rX, y: rY };
                  if (retX > 0) monster.direction = Direction.EAST;
                  else if (retX < 0) monster.direction = Direction.WEST;
                  else if (retY > 0) monster.direction = Direction.SOUTH;
                  else if (retY < 0) monster.direction = Direction.NORTH;
                }
              }
          }
          return { ...monster };
        }

        if (dist > def.attackRange) {
          // Move towards player
          if (Math.random() < 0.004 * deltaTime) { // Throttle chase speed
              const moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
              const moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

              // Update direction based on movement
              if (moveX > 0) monster.direction = Direction.EAST;
              else if (moveX < 0) monster.direction = Direction.WEST;
              else if (moveY > 0) monster.direction = Direction.SOUTH;
              else if (moveY < 0) monster.direction = Direction.NORTH;

              // Try to move
              let newX = monster.position.x + moveX;
              let newY = monster.position.y + moveY;

              // Simple collision avoidance
              if (!isPositionBlocked(newX, newY, gameMap) && !isMonsterAt(newX, newY, monsters, monster.id) && !isInTown(newX, newY)) {
                monster.position = { x: newX, y: newY };
              } else if (moveX !== 0 && !isPositionBlocked(newX, monster.position.y, gameMap) && !isInTown(newX, monster.position.y)) {
                monster.position = { x: newX, y: monster.position.y };
              } else if (moveY !== 0 && !isPositionBlocked(monster.position.x, newY, gameMap) && !isInTown(monster.position.x, newY)) {
                monster.position = { x: monster.position.x, y: newY };
              }
          }
        } else if (dist <= def.attackRange && now - monster.lastAttackTime > def.attackSpeed) {
          const { matchPhase } = get();
          // Do not attack if player is inside protection zone (except during Arena when safe zone shrinks)
          if (matchPhase !== 'arena' && isInTown(player.position.x, player.position.y)) {
              monster.targetId = undefined;
              return { ...monster };
          }

          // Attack player
          monster.lastAttackTime = now;
          get().setLastCombatTime(Date.now());
          const result = monsterAttackPlayer(
            { ...monster, attack: def.attack, defense: def.defense },
            player.stats,
            player.equipment
          );

          if (result.isMiss) {
            addDamageNumber(player.position, 0, 'miss');
          } else {
            addDamageNumber(player.position, -result.damage, 'damage');
            
            // Visual Effect for monster attack
            get().addSpellEffect({
              type: 'sword_slash',
              position: { ...player.position },
              direction: monster.direction,
              color: '#e74c3c',
              startTime: now,
              duration: 300,
            });

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
            { x: 0, y: -1, d: Direction.NORTH },
            { x: 1, y: 0, d: Direction.EAST },
            { x: 0, y: 1, d: Direction.SOUTH },
            { x: -1, y: 0, d: Direction.WEST },
          ];
          const dir = dirs[Math.floor(Math.random() * dirs.length)];
          const newX = monster.position.x + dir.x;
          const newY = monster.position.y + dir.y;
          if (!isPositionBlocked(newX, newY, gameMap) &&
              Math.abs(newX - monster.spawnPosition.x) < 8 &&
              Math.abs(newY - monster.spawnPosition.y) < 8 &&
              !isInTown(newX, newY)) {
            monster.position = { x: newX, y: newY };
            monster.direction = dir.d;
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
    const { player, gameMap, monsters, addChatMessage } = get();
    if (!player) return;

    const dx = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
    const dy = direction === Direction.SOUTH ? 1 : direction === Direction.NORTH ? -1 : 0;
    const newX = player.position.x + dx;
    const newY = player.position.y + dy;

    // Helper to just turn the player without moving
    const turnPlayer = () => set(state => ({ player: state.player ? { ...state.player, direction } : null }));

    // Bounds check
    if (newX < 0 || newX >= gameMap.tiles[0].length || newY < 0 || newY >= gameMap.tiles.length) return turnPlayer();

    // Tile collision
    if (isPositionBlocked(newX, newY, gameMap)) return turnPlayer();

    // Monster collision (don't walk on monsters)
    if (isMonsterAt(newX, newY, monsters)) {
      // Only show message if the blocking monster is visible (nearby)
      const blockingMonster = monsters.find(m =>
        !m.isDead && m.position.x === newX && m.position.y === newY
      );
      if (blockingMonster) {
        const def = MONSTERS[blockingMonster.definitionId];
        if (def && Math.abs(blockingMonster.position.x - player.position.x) <= 1 && Math.abs(blockingMonster.position.y - player.position.y) <= 1) {
          addChatMessage({ type: 'system', sender: 'System', content: `A ${def.name} is blocking your way!`, color: '#e67e22' });
        }
      }
      return turnPlayer();
    }

    // Can't enter safe zone while in combat (5s since last fight action)
    const { lastCombatTime, matchPhase } = get();
    const isEnteringTown = isInTown(newX, newY) && !isInTown(player.position.x, player.position.y);
    if (isEnteringTown && matchPhase !== 'arena' && Date.now() - lastCombatTime < 5000) {
      addChatMessage({ type: 'system', sender: 'System', content: "⚠️ You can't enter safe zone while in combat! (wait 5s)", color: '#e74c3c' });
      return turnPlayer();
    }

    set(state => ({
      player: state.player ? {
        ...state.player,
        position: { x: newX, y: newY },
        direction,
      } : null,
    }));
    
    // Pick up loot if standing on it
    const stateAfterMove = get();
    const lootAtPos = stateAfterMove.droppedLoot.filter(l => l.position.x === newX && l.position.y === newY);
    if (lootAtPos.length > 0) {
      let lootMsg = 'Picked up: ';
      const { addToInventory, addChatMessage } = stateAfterMove;
      
      for (const loot of lootAtPos) {
        if (loot.itemId === 'gold_coin') {
          set(s => ({ player: s.player ? { ...s.player, gold: s.player.gold + loot.quantity } : null }));
          lootMsg += `${loot.quantity} gold, `;
        } else {
          addToInventory(loot.itemId, loot.quantity);
          const itemDef = ITEMS[loot.itemId];
          if (itemDef) lootMsg += `${itemDef.name} x${loot.quantity}, `;
        }
      }
      
      addChatMessage({ type: 'system', sender: 'Loot', content: lootMsg.slice(0, -2), color: '#2ecc71' });
      
      const pickedUpIds = new Set(lootAtPos.map(l => l.id));
      set(s => ({ droppedLoot: s.droppedLoot.filter(l => !pickedUpIds.has(l.id)) }));
    }
  },

  attackMonster: () => {
    const { player, monsters, bots, matchPhase, addDamageNumber, addChatMessage, botDamageMap, addSpellEffect } = get();
    if (!player) return;
    
    if (matchPhase !== 'arena' && isInTown(player.position.x, player.position.y)) {
       addChatMessage({ type: 'system', sender: 'System', content: "🛡️ You cannot attack in the Protection Zone.", color: '#e67e22' });
       return;
    }

    const now = Date.now();
    // Find target in front of player
    const dx = player.direction === Direction.EAST ? 1 : player.direction === Direction.WEST ? -1 : 0;
    const dy = player.direction === Direction.SOUTH ? 1 : player.direction === Direction.NORTH ? -1 : 0;
    const targetX = player.position.x + dx;
    const targetY = player.position.y + dy;

    // Also check adjacent tiles
    let targetMonster = monsters.find(m =>
      !m.isDead && m.position.x === targetX && m.position.y === targetY
    );
    let targetBot = bots.find(b => b.stats.health > 0 && b.position.x === targetX && b.position.y === targetY);

    // If no target in front, check all adjacent
    if (!targetMonster && !targetBot) {
      targetMonster = monsters.find(m =>
        !m.isDead &&
        Math.abs(m.position.x - player.position.x) <= 1 &&
        Math.abs(m.position.y - player.position.y) <= 1
      );
      targetBot = bots.find(b =>
        b.stats.health > 0 &&
        Math.abs(b.position.x - player.position.x) <= 1 &&
        Math.abs(b.position.y - player.position.y) <= 1
      );
    }

    if (!targetMonster && !targetBot) {
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

    // Mark combat time
    get().setLastCombatTime(Date.now());

    // Attack BOT logic
    if (targetBot) {
      if (isInTown(targetBot.position.x, targetBot.position.y) || isInTown(player.position.x, player.position.y)) {
         addChatMessage({ type: 'system', sender: 'System', content: 'You cannot attack players in the safe zone.', color: '#e74c3c' });
         return;
      }
      
      const result = playerAttackMonster(player.stats, player.equipment, {
        attack: targetBot.stats.attack,
        defense: targetBot.stats.defense,
      } as any);
      
      // PvP Damage Scaling: reduce basic attack damage by 65% in PvP to avoid one-shots
      result.damage = Math.max(1, Math.floor(result.damage * 0.35));

      get().addSpellEffect({
        type: 'sword_slash',
        position: { ...player.position },
        direction: player.direction,
        color: result.isCritical ? '#ff4444' : '#c0c0c0',
        startTime: Date.now(),
        duration: 300,
      });

      if (result.isMiss) {
        addDamageNumber(targetBot.position, 0, 'miss');
      } else {
        const prefix = result.isCritical ? '💥 ' : '';
        addDamageNumber(targetBot.position, -result.damage, 'damage');
        addChatMessage({ type: 'combat', sender: 'Combat', content: `${prefix}You hit ${targetBot.name} for ${result.damage}!`, color: result.isCritical ? '#e74c3c' : '#e67e22' });
        
        // Update Bot Health manually here
        set(state => {
           const newBots = state.bots.map(b => {
               if (b.id === targetBot!.id) {
                   return { ...b, stats: { ...b.stats, health: b.stats.health - result.damage }};
               }
               return b;
           });
           
           // If bot dies to player, give player massive XP!
           const deadBot = newBots.find(b => b.id === targetBot!.id);
           if (deadBot && deadBot.stats.health <= 0) {
               addChatMessage({ type: 'system', sender: 'System', content: `🔥 You ELIMINATED ${deadBot.name}! +1000 XP!`, color: '#f1c40f' });
               
               // XP logic
               if (state.player) {
                   const newExp = state.player.stats.experience + 1000;
                   const { leveledUp, newLevel, newExpToNext } = calculateLevelUpStats(
                     state.player.stats.level,
                     newExp,
                     state.player.stats.experienceToNext
                   );

                   // Also drop loot (updateBots filter will catch the death and drop loot too, so we just let updateBots handle the drop next frame!)
                   // Wait, updateBots filter won't grant XP to player.
                   
                   let playerUpdates: any = {
                       stats: {
                           ...state.player.stats,
                           experience: newExp,
                           experienceToNext: newExpToNext,
                       }
                   };
                   
                   if (leveledUp) {
                       const newStats = calculateStats(state.player.vocation, newLevel);
                       playerUpdates.stats = { ...newStats, experience: newExp, experienceToNext: newExpToNext };
                       addChatMessage({ type: 'system', sender: 'Level Up!', content: `🎉 Level ${newLevel}!`, color: '#f1c40f' });
                   }

                   return { bots: newBots, player: { ...state.player, ...playerUpdates } };
               }
           }
           return { bots: newBots };
        });
      }
      return;
    }

    // Existing Monster Logic below

    const def = MONSTERS[targetMonster.definitionId];
    if (!def) return;

    // Mark combat time
    get().setLastCombatTime(Date.now());

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
        if (loot.length > 0) {
          const newDrops: DroppedLoot[] = [];
          for (const drop of loot) {
            newDrops.push({
              id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              position: { ...targetMonster.position },
              itemId: drop.itemId,
              quantity: drop.quantity,
              expiresAt: Date.now() + 30000, // Disappears after 30 seconds
            });
          }
          set(state => ({ droppedLoot: [...state.droppedLoot, ...newDrops] }));
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
            // Auto-improve all equipped skills by +1 on level up
            const newUpgrades = { ...state.skillUpgrades };
            for (const eqId of state.equippedSkillIds) {
              if ((newUpgrades[eqId] || 0) < 10) {
                newUpgrades[eqId] = (newUpgrades[eqId] || 0) + 1;
              }
            }
            const prevSkillPoints = state.player.stats.skillPoints || 0;
            const newSkillPoints = prevSkillPoints + 3;
            addChatMessage({
              type: 'system',
              sender: 'Level Up!',
              content: `🎉 Level ${newLevel}! +3 Skill Points! (Total: ${newSkillPoints}) All equipped skills auto-improved!`,
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
                  skillPoints: newSkillPoints,
                },
              },
              levelUpTime: Date.now(),
              skillUpgrades: newUpgrades,
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
            m.id === targetMonster.id ? { ...m, health: newMonsterHealth, lastHitTime: Date.now() } : m
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
  skillUpgrades: {},
  screenShakeTime: 0,
  levelUpTime: 0,
  lastAutoAttackTime: 0,
  lastCombatTime: 0,
  setLastCombatTime: (time) => set({ lastCombatTime: time }),
  showSkillPanel: false,
  toggleSkillPanel: () => set((s) => ({ showSkillPanel: !s.showSkillPanel })),
  showInventoryPanel: false,
  toggleInventoryPanel: () => set((s) => ({ showInventoryPanel: !s.showInventoryPanel })),
  equippedSkillIds: [],
  equipSkill: (skillId) => {
    const { player, equippedSkillIds, addChatMessage } = get();
    if (!player) return;
    const skills = getSkillsForVocation(player.vocation);
    if (!skills.find(s => s.id === skillId)) return;
    if (equippedSkillIds.includes(skillId)) return;
    if (equippedSkillIds.length >= MAX_EQUIPPED_SKILLS) {
      addChatMessage({ type: 'system', sender: 'Skills', content: 'Unequip a skill first! Max 3 equipped.', color: '#e67e22' });
      return;
    }
    set({ equippedSkillIds: [...equippedSkillIds, skillId] });
    const sk = skills.find(s => s.id === skillId);
    addChatMessage({ type: 'system', sender: 'Skills', content: `${sk?.icon} ${sk?.name} equipped!`, color: '#2ecc71' });
  },
  unequipSkill: (skillId) => {
    const { equippedSkillIds, addChatMessage } = get();
    if (!equippedSkillIds.includes(skillId)) return;
    set({ equippedSkillIds: equippedSkillIds.filter(id => id !== skillId) });
    addChatMessage({ type: 'system', sender: 'Skills', content: 'Skill unequipped.', color: '#95a5a6' });
  },
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

  castSkill: (hotkeyIndex) => {
    const { player, monsters, matchPhase, addDamageNumber, addChatMessage, addSpellEffect, skillCooldowns, buffEndTime, addToInventory, equippedSkillIds } = get();
    if (!player) return;

    const skillId = equippedSkillIds[hotkeyIndex];
    if (!skillId) return;
    const skill = getSkill(skillId);
    if (!skill) return;

    if (skill.type !== 'heal' && skill.type !== 'buff' && matchPhase !== 'arena' && isInTown(player.position.x, player.position.y)) {
       addChatMessage({ type: 'system', sender: 'System', content: "🛡️ You cannot cast offensive spells in the Protection Zone.", color: '#e67e22' });
       return;
    }

    const { skillUpgrades } = get();
    const upgradeLevel = skillUpgrades[skill.id] || 0;
    const upgradeDmgMult = 1 + upgradeLevel * 0.20; // +20% per level
    const upgradeManaMult = Math.max(0.4, 1 - upgradeLevel * 0.06); // -6% per level, min 40%
    const upgradeCdMult = Math.max(0.4, 1 - upgradeLevel * 0.05); // -5% per level, min 40%
    const effectiveManaCost = Math.floor(skill.manaCost * upgradeManaMult);
    const effectiveCooldown = Math.floor(skill.cooldown * upgradeCdMult);

    if (player.stats.level < skill.levelReq) {
      addChatMessage({ type: 'system', sender: 'Skills', content: `Need level ${skill.levelReq} for ${skill.name}!`, color: '#e74c3c' });
      return;
    }

    if (player.stats.mana < effectiveManaCost) {
      addChatMessage({ type: 'system', sender: 'Skills', content: `Not enough mana! Need ${effectiveManaCost} MP.`, color: '#3498db' });
      return;
    }

    const now = Date.now();
    const lastUsed = skillCooldowns[skill.id] || 0;
    if (now - lastUsed < effectiveCooldown) {
      const remaining = Math.ceil((effectiveCooldown - (now - lastUsed)) / 1000);
      addChatMessage({ type: 'system', sender: 'Skills', content: `${skill.name} on cooldown! ${remaining}s.`, color: '#e67e22' });
      return;
    }

    // Deduct mana
    set(state => {
      if (!state.player) return state;
      return {
        player: { ...state.player, stats: { ...state.player.stats, mana: Math.max(0, state.player.stats.mana - effectiveManaCost) } },
        skillCooldowns: { ...state.skillCooldowns, [skill.id]: now },
      };
    });

    // Determine effect visual type
    const effectType = skill.type === 'heal' ? 'heal_aura' as const : getSkillEffectType(skill.id);

    if (skill.type === 'heal' && skill.healAmount) {
      // Heal spells
      const effectiveHeal = Math.floor(skill.healAmount * upgradeDmgMult);
      const newHealth = Math.min(player.stats.maxHealth, player.stats.health + effectiveHeal);
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
    let targetBot: BotInstance | undefined;
    const { bots } = get();

    if (skill.range <= 1) {
      // Melee - check in front first, then adjacent
      targetMonster = monsters.find(m => !m.isDead && m.position.x === player.position.x + dirOffset.x && m.position.y === player.position.y + dirOffset.y);
      targetBot = bots.find(b => b.stats.health > 0 && b.position.x === player.position.x + dirOffset.x && b.position.y === player.position.y + dirOffset.y);
      
      if (!targetMonster && !targetBot) {
        targetMonster = monsters.find(m => !m.isDead && Math.abs(m.position.x - player.position.x) <= 1 && Math.abs(m.position.y - player.position.y) <= 1);
        targetBot = bots.find(b => b.stats.health > 0 && Math.abs(b.position.x - player.position.x) <= 1 && Math.abs(b.position.y - player.position.y) <= 1);
      }
    } else {
      // Ranged - find closest target in direction, up to range
      let closestDist = Infinity;
      for (const m of monsters) {
        if (m.isDead) continue;
        const dx = m.position.x - player.position.x;
        const dy = m.position.y - player.position.y;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist > skill.range) continue;
        const dotProduct = dx * dirOffset.x + dy * dirOffset.y;
        if (dotProduct > 0 || dist <= 2) {
          if (dist < closestDist) { closestDist = dist; targetMonster = m; }
        }
      }
      for (const b of bots) {
        if (b.stats.health <= 0) continue;
        const dx = b.position.x - player.position.x;
        const dy = b.position.y - player.position.y;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist > skill.range) continue;
        const dotProduct = dx * dirOffset.x + dy * dirOffset.y;
        if (dotProduct > 0 || dist <= 2) {
          if (dist < closestDist) { closestDist = dist; targetBot = b; targetMonster = undefined; }
        }
      }
    }

    if (!targetMonster && !targetBot) {
      // Show effect at the direction player faces even if no target
      const fx = player.position.x + dirOffset.x * Math.min(skill.range, 3);
      const fy = player.position.y + dirOffset.y * Math.min(skill.range, 3);
      addSpellEffect({ type: effectType, position: player.position, direction: player.direction, targetPosition: { x: fx, y: fy }, color: skill.color, startTime: now, duration: 600, size: skill.range });
      addChatMessage({ type: 'system', sender: 'Skill', content: `${skill.icon} ${skill.name}! No target.`, color: '#95a5a6' });
      return;
    }

    // Calculate damage
    get().setLastCombatTime(Date.now());
    const buffBonus = now < (get().buffEndTime) ? 1.15 : 1.0;
    const magicPower = player.stats.magicAttack + (skill.damage || 0) * 0.3;
    const variance = 0.8 + Math.random() * 0.4;
    let dmg = Math.floor(((skill.damage || 30) + magicPower * 0.5) * variance * buffBonus * upgradeDmgMult);
    
    // Apply damage to BOT
    if (targetBot) {
        if (isInTown(targetBot.position.x, targetBot.position.y) || isInTown(player.position.x, player.position.y)) {
           addChatMessage({ type: 'system', sender: 'System', content: 'You cannot attack players in the safe zone.', color: '#e74c3c' });
           return;
        }
        
        // PvP Damage Scaling: spells deal massive damage, so we reduce it by 65% in PvP to avoid one-shots
        dmg = Math.max(1, Math.floor(dmg * 0.35));
        dmg = Math.max(1, dmg - Math.floor(targetBot.stats.magicDefense * 0.3));
        
        addDamageNumber(targetBot.position, -dmg, 'damage');
        addSpellEffect({ type: effectType, position: player.position, direction: player.direction, targetPosition: { ...targetBot.position }, color: skill.color, startTime: now, duration: 600, size: skill.range, damage: dmg });
        
        set(state => {
           const newBots = state.bots.map(b => b.id === targetBot!.id ? { ...b, stats: { ...b.stats, health: b.stats.health - dmg }} : b);
           const deadBot = newBots.find(b => b.id === targetBot!.id);
           if (deadBot && deadBot.stats.health <= 0) {
               addChatMessage({ type: 'system', sender: 'System', content: `🔥 You ELIMINATED ${deadBot.name} with ${skill.name}! +1500 XP!`, color: '#f1c40f' });
               if (state.player) {
                   const newExp = state.player.stats.experience + 1500;
                   const { leveledUp, newLevel, newExpToNext } = calculateLevelUpStats(state.player.stats.level, newExp, state.player.stats.experienceToNext);
                   let playerUpdates: any = { stats: { ...state.player.stats, experience: newExp, experienceToNext: newExpToNext } };
                   if (leveledUp) {
                       const newStats = calculateStats(state.player.vocation, newLevel);
                       playerUpdates.stats = { ...newStats, experience: newExp, experienceToNext: newExpToNext };
                       addChatMessage({ type: 'system', sender: 'Level Up!', content: `🎉 Level ${newLevel}!`, color: '#f1c40f' });
                   }
                   return { bots: newBots, player: { ...state.player, ...playerUpdates } };
               }
           }
           return { bots: newBots };
        });
        return;
    }

    // Apply damage to MONSTER
    const def = MONSTERS[targetMonster!.definitionId];
    if (def) dmg = Math.max(1, dmg - Math.floor(def.defense * 0.3));

    addDamageNumber(targetMonster!.position, -dmg, 'damage');

    // Visual effect
    addSpellEffect({
      type: effectType,
      position: player.position,
      direction: player.direction,
      targetPosition: { ...targetMonster!.position },
      color: skill.color,
      startTime: now,
      duration: 600,
      size: skill.range,
      damage: dmg,
    });

    const newMonsterHealth = targetMonster!.health - dmg;

    if (newMonsterHealth <= 0) {
      // Monster killed
      if (def) {
        addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name} killed ${def.name}! +${def.experience} XP`, color: '#f1c40f' });
        addDamageNumber(targetMonster!.position, def.experience, 'xp');

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
            // Auto-improve all equipped skills by +1 on level up
            const newUpgrades = { ...state.skillUpgrades };
            for (const eqId of state.equippedSkillIds) {
              if ((newUpgrades[eqId] || 0) < 10) {
                newUpgrades[eqId] = (newUpgrades[eqId] || 0) + 1;
              }
            }
            const prevSkillPoints = state.player.stats.skillPoints || 0;
            const newSkillPoints = prevSkillPoints + 3;
            addChatMessage({ type: 'system', sender: 'Level Up!', content: `🎉 Level ${newLevel}! +3 Skill Points! (Total: ${newSkillPoints}) All equipped skills auto-improved!`, color: '#f1c40f' });
            return { player: { ...state.player, stats: { ...newStats, experience: newExp - state.player.stats.experienceToNext, health: newStats.maxHealth, mana: newStats.maxMana, skillPoints: newSkillPoints } }, levelUpTime: Date.now(), skillUpgrades: newUpgrades };
          }
          return { player: { ...state.player, stats: { ...state.player.stats, experience: newExp } } };
        });
      }

      set(state => ({
        monsters: state.monsters.map(m => m.id === targetMonster.id ? { ...m, isDead: true, health: 0, deathTime: Date.now(), targetId: undefined } : m),
      }));
    } else {
      set(state => ({
        monsters: state.monsters.map(m => m.id === targetMonster.id ? { ...m, health: newMonsterHealth, lastHitTime: Date.now() } : m),
      }));
      if (def) addChatMessage({ type: 'combat', sender: 'Skill', content: `${skill.icon} ${skill.name} hit ${def.name} for ${dmg}!`, color: skill.color });
    }
  },

  upgradeSkill: (skillId) => {
    const { player, skillUpgrades, addChatMessage, equippedSkillIds } = get();
    if (!player) return;

    // Can only upgrade equipped skills
    if (!equippedSkillIds.includes(skillId)) {
      addChatMessage({ type: 'system', sender: 'Skills', content: 'Equip this skill first to upgrade it!', color: '#e67e22' });
      return;
    }

    const currentLevel = skillUpgrades[skillId] || 0;
    if (currentLevel >= 10) {
      addChatMessage({ type: 'system', sender: 'Skills', content: 'Skill is already at max level!', color: '#e67e22' });
      return;
    }

    if (player.stats.skillPoints < 1) {
      addChatMessage({ type: 'system', sender: 'Skills', content: 'No skill points available! Level up to earn more.', color: '#e74c3c' });
      return;
    }

    // Verify player has this skill
    const skills = getSkillsForVocation(player.vocation);
    if (!skills.find(s => s.id === skillId)) return;

    set(state => ({
      skillUpgrades: { ...state.skillUpgrades, [skillId]: (state.skillUpgrades[skillId] || 0) + 1 },
      player: state.player ? {
        ...state.player,
        stats: { ...state.player.stats, skillPoints: state.player.stats.skillPoints - 1 },
      } : null,
    }));

    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      addChatMessage({
        type: 'system',
        sender: 'Skill Up!',
        content: `${skill.icon} ${skill.name} upgraded to level ${currentLevel + 2}! (+20% dmg, -6% mana, -5% CD)`,
        color: '#f1c40f'
      });
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

  quickUsePotion: () => {
    const { player, consumeInventoryItem } = get();
    if (!player) return;

    const needHP = player.stats.health < player.stats.maxHealth * 0.8;
    const potions = player.inventory.filter(i =>
      needHP ? i.itemId.startsWith('health_potion') : i.itemId.startsWith('mana_potion')
    ).sort((a, b) => {
      const order = needHP
        ? ['health_potion_large', 'health_potion_medium', 'health_potion_small']
        : ['mana_potion_large', 'mana_potion_medium', 'mana_potion_small'];
      return order.indexOf(a.itemId) - order.indexOf(b.itemId);
    });
    if (potions.length > 0) consumeInventoryItem(potions[0].id);
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
    const { player, gameMap, addChatMessage, monsters } = get();
    if (!player) return;
    const newStats = calculateStats(player.vocation, player.stats.level);
    // Lose 10% experience on death
    const xpLost = Math.floor(player.stats.experience * 0.1);
    const newExp = Math.max(0, player.stats.experience - xpLost);
    // Clear all monster targets and combat state on respawn
    const clearedMonsters = monsters.map(m =>
      m.targetId === player.id ? { ...m, targetId: undefined } : m
    );
    set({
      player: player ? {
        ...player,
        position: { ...gameMap.spawnPoint },
        stats: {
          ...newStats,
          experience: newExp,
          experienceToNext: player.stats.experienceToNext,
        },
      } : null,
      screen: 'game' as GameScreen,
      lastCombatTime: 0,
      monsters: clearedMonsters,
    });
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

  // ---- Save / Load ----
  savedCharacterNames: [],

  savePlayer: async () => {
    const state = get();
    if (!state.player) return;
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.player.name,
          vocation: state.player.vocation,
          position: state.player.position,
          direction: state.player.direction,
          stats: state.player.stats,
          equipment: state.player.equipment,
          inventory: state.player.inventory,
          gold: state.player.gold,
          skillUpgrades: state.skillUpgrades,
          equippedSkills: state.equippedSkillIds,
        }),
      });
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  loadPlayer: async (name: string) => {
    try {
      const res = await fetch(`/api/load?name=${encodeURIComponent(name)}`);
      if (!res.ok) return false;
      const data = await res.json();
      const map = getGameMap();

      const player: PlayerData = {
        id: `player_${Date.now()}`,
        name: data.name,
        vocation: data.vocation as Vocation,
        position: { x: data.position.x, y: data.position.y },
        direction: data.direction as Direction,
        stats: data.stats,
        equipment: data.equipment,
        inventory: data.inventory,
        gold: data.gold,
      };

      set({
        player,
        screen: 'game',
        equippedSkillIds: data.equippedSkills || [],
        skillUpgrades: data.skillUpgrades || {},
      });

      get().spawnMonsters();
      get().addChatMessage({
        type: 'system',
        sender: 'System',
        content: `Welcome back, ${data.name} the ${data.vocation}! (Level ${data.stats.level})`,
        color: '#f1c40f',
      });
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  },

  fetchSavedCharacters: async () => {
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const chars = await res.json();
        set({ savedCharacterNames: chars.map((c: { name: string }) => c.name) });
      }
    } catch (e) {
      console.error('Fetch characters failed:', e);
    }
  },

  deleteCharacter: async (name: string) => {
    try {
      await fetch(`/api/character?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      get().fetchSavedCharacters();
    } catch (e) {
      console.error('Delete failed:', e);
    }
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