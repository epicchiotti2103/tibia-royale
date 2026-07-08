// =============================================
// Tibia-Style Game - Core Types & Constants
// =============================================

export const TILE_SIZE = 32;
export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 100;
export const VIEWPORT_TILES_X = 15;
export const VIEWPORT_TILES_Y = 11;
export const GAME_FPS = 30;
export const TICK_RATE = 1000 / GAME_FPS;

// Vocation types (like Tibia)
export enum Vocation {
  KNIGHT = 'Knight',
  SORCERER = 'Sorcerer',
  DRUID = 'Druid',
  PALADIN = 'Paladin',
}

// Tile types
export enum TileType {
  GRASS = 0,
  DIRT = 1,
  WATER = 2,
  STONE = 3,
  SAND = 4,
  SNOW = 5,
  LAVA = 6,
  WALL = 7,
  WOOD_FLOOR = 8,
  STONE_FLOOR = 9,
  DARK_GRASS = 10,
  SWAMP = 11,
  BRIDGE = 12,
  TREE = 13,
  ROCK = 14,
  BUSH = 15,
  STAIRS_DOWN = 16,
  STAIRS_UP = 17,
}

// Walkable tiles
export const WALKABLE_TILES: Set<TileType> = new Set([
  TileType.GRASS,
  TileType.DIRT,
  TileType.STONE,
  TileType.SAND,
  TileType.SNOW,
  TileType.WOOD_FLOOR,
  TileType.STONE_FLOOR,
  TileType.DARK_GRASS,
  TileType.SWAMP,
  TileType.BRIDGE,
]);

// Non-walkable tiles (objects blocking movement)
export const SOLID_TILES: Set<TileType> = new Set([
  TileType.WATER,
  TileType.WALL,
  TileType.LAVA,
  TileType.TREE,
  TileType.ROCK,
]);

// Item rarity
export enum Rarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
}

// Item types
export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  SHIELD = 'shield',
  HELMET = 'helmet',
  LEGS = 'legs',
  BOOTS = 'boots',
  RING = 'ring',
  AMULET = 'amulet',
  CONSUMABLE = 'consumable',
  GOLD = 'gold',
  QUEST = 'quest',
}

// Equipment slots
export enum EquipSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  SHIELD = 'shield',
  HELMET = 'helmet',
  LEGS = 'legs',
  BOOTS = 'boots',
  RING = 'ring',
  AMULET = 'amulet',
}

export interface Position {
  x: number;
  y: number;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  slot?: number; // inventory slot position
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description: string;
  weight: number;
  attack?: number;
  defense?: number;
  magicAttack?: number;
  magicDefense?: number;
  healAmount?: number;
  manaAmount?: number;
  levelReq: number;
  vocationReq?: Vocation[];
  stackable: boolean;
  sellPrice: number;
  buyPrice: number;
  color: string; // for canvas rendering
  icon: string; // emoji for UI
}

export interface MonsterDefinition {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number; // tiles per second
  experience: number;
  lootTable: LootDrop[];
  color: string;
  icon: string;
  aggressive: boolean;
  chaseRange: number;
  attackRange: number;
  attackSpeed: number; // ms between attacks
}

export interface LootDrop {
  itemId: string;
  chance: number; // 0-1
  minQuantity: number;
  maxQuantity: number;
}

export interface NPCDefinition {
  id: string;
  name: string;
  position: Position;
  type: 'merchant' | 'healer' | 'quest' | 'banker';
  greeting: string;
  color: string;
  icon: string;
  shopItems?: string[]; // item IDs the merchant sells
}

export interface PlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  skillPoints: number;
}

export interface PlayerData {
  id?: string;
  name: string;
  vocation: Vocation;
  position: Position;
  direction: Direction;
  stats: PlayerStats;
  equipment: Record<EquipSlot, string | null>;
  inventory: InventoryItem[];
  gold: number;
}

export interface MonsterInstance {
  id: string;
  definitionId: string;
  position: Position;
  health: number;
  maxHealth: number;
  lastAttackTime: number;
  targetId?: string;
  spawnPosition: Position;
  respawnTime: number;
  isDead: boolean;
  deathTime?: number;
}

export interface OtherPlayer {
  id: string;
  name: string;
  position: Position;
  direction: Direction;
  vocation: Vocation;
  level: number;
  health: number;
  maxHealth: number;
}

export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

export interface ChatMessage {
  id: string;
  type: 'player' | 'system' | 'npc' | 'combat';
  sender: string;
  content: string;
  timestamp: number;
  color?: string;
}

export interface DamageNumber {
  id: string;
  position: Position;
  value: number;
  type: 'damage' | 'heal' | 'miss' | 'xp';
  timestamp: number;
}

export interface SpellEffect {
  id: string;
  type: 'sword_slash' | 'projectile' | 'explosion' | 'heal_aura' | 'whirlwind' | 'lightning' | 'earthquake' | 'war_cry';
  position: Position;
  direction?: Direction;
  targetPosition?: Position;
  color: string;
  startTime: number;
  duration: number;
  size?: number;
  damage?: number;
}

export interface GameMap {
  tiles: TileType[][];
  spawnPoint: Position;
  npcs: NPCDefinition[];
  monsterZones: MonsterZone[];
  name: string;
}

// Direction offsets
export const DIR_OFFSETS: Record<Direction, Position> = {
  [Direction.NORTH]: { x: 0, y: -1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.SOUTH]: { x: 0, y: 1 },
  [Direction.WEST]: { x: -1, y: 0 },
};

export interface MonsterZone {
  id: string;
  area: { x: number; y: number; width: number; height: number };
  monsterIds: string[];
  maxMonsters: number;
  spawnRate: number; // ms
}

export interface VocationStats {
  baseHealth: number;
  healthPerLevel: number;
  baseMana: number;
  manaPerLevel: number;
  baseAttack: number;
  attackPerLevel: number;
  baseDefense: number;
  defensePerLevel: number;
  baseMagicAttack: number;
  magicAttackPerLevel: number;
  baseMagicDefense: number;
  magicDefensePerLevel: number;
  baseSpeed: number;
}

export const VOCATION_STATS: Record<Vocation, VocationStats> = {
  [Vocation.KNIGHT]: {
    baseHealth: 110,
    healthPerLevel: 18,
    baseMana: 40,
    manaPerLevel: 10,
    baseAttack: 6,
    attackPerLevel: 3.5,
    baseDefense: 6,
    defensePerLevel: 5,
    baseMagicAttack: 1,
    magicAttackPerLevel: 1,
    baseMagicDefense: 2,
    magicDefensePerLevel: 2,
    baseSpeed: 3.5,
  },
  [Vocation.SORCERER]: {
    baseHealth: 90,
    healthPerLevel: 14,
    baseMana: 200,
    manaPerLevel: 40,
    baseAttack: 3,
    attackPerLevel: 1.5,
    baseDefense: 4,
    defensePerLevel: 3.5,
    baseMagicAttack: 35,
    magicAttackPerLevel: 18,
    baseMagicDefense: 15,
    magicDefensePerLevel: 10,
    baseSpeed: 3,
  },
  [Vocation.DRUID]: {
    baseHealth: 100,
    healthPerLevel: 16,
    baseMana: 120,
    manaPerLevel: 28,
    baseAttack: 6,
    attackPerLevel: 2,
    baseDefense: 5,
    defensePerLevel: 4,
    baseMagicAttack: 12,
    magicAttackPerLevel: 8,
    baseMagicDefense: 10,
    magicDefensePerLevel: 7,
    baseSpeed: 3.5,
  },
  [Vocation.PALADIN]: {
    baseHealth: 120,
    healthPerLevel: 18,
    baseMana: 60,
    manaPerLevel: 15,
    baseAttack: 10,
    attackPerLevel: 5,
    baseDefense: 7,
    defensePerLevel: 5.5,
    baseMagicAttack: 5,
    magicAttackPerLevel: 3.5,
    baseMagicDefense: 5,
    magicDefensePerLevel: 4,
    baseSpeed: 5,
  },
};

export function calculateStats(vocation: Vocation, level: number): PlayerStats {
  const vs = VOCATION_STATS[vocation];
  const experienceToNext = Math.floor(100 * Math.pow(1.8, level - 1));
  return {
    level,
    experience: 0,
    experienceToNext,
    health: vs.baseHealth + vs.healthPerLevel * (level - 1),
    maxHealth: vs.baseHealth + vs.healthPerLevel * (level - 1),
    mana: vs.baseMana + vs.manaPerLevel * (level - 1),
    maxMana: vs.baseMana + vs.manaPerLevel * (level - 1),
    attack: vs.baseAttack + vs.attackPerLevel * (level - 1),
    defense: vs.baseDefense + vs.defensePerLevel * (level - 1),
    magicAttack: vs.baseMagicAttack + vs.magicAttackPerLevel * (level - 1),
    magicDefense: vs.baseMagicDefense + vs.magicDefensePerLevel * (level - 1),
    speed: vs.baseSpeed,
    skillPoints: 0,
  };
}

export const TILE_COLORS: Record<TileType, string> = {
  [TileType.GRASS]: '#4a7c3f',
  [TileType.DIRT]: '#8b7355',
  [TileType.WATER]: '#3b6db5',
  [TileType.STONE]: '#808080',
  [TileType.SAND]: '#d4bc7c',
  [TileType.SNOW]: '#e8e8f0',
  [TileType.LAVA]: '#d44a00',
  [TileType.WALL]: '#5a5a5a',
  [TileType.WOOD_FLOOR]: '#a0784c',
  [TileType.STONE_FLOOR]: '#9a9a9a',
  [TileType.DARK_GRASS]: '#2d5a25',
  [TileType.SWAMP]: '#4a6b3a',
  [TileType.BRIDGE]: '#8b6914',
  [TileType.TREE]: '#2d6b1e',
  [TileType.ROCK]: '#6b6b6b',
  [TileType.BUSH]: '#3a7a2e',
  [TileType.STAIRS_DOWN]: '#4a4a4a',
  [TileType.STAIRS_UP]: '#6a6a6a',
};