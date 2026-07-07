// =============================================
// Tibia-Style Game - Tile Map Generator
// =============================================

import { GameMap, TileType, NPCDefinition, MonsterZone } from './types';

function createEmptyMap(width: number, height: number): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = TileType.GRASS;
    }
  }
  return map;
}

function fillRect(map: TileType[][], x: number, y: number, w: number, h: number, tile: TileType) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        map[ny][nx] = tile;
      }
    }
  }
}

function drawRect(map: TileType[][], x: number, y: number, w: number, h: number, tile: TileType) {
  for (let dx = 0; dx < w; dx++) {
    if (y >= 0 && y < map.length && x + dx >= 0 && x + dx < map[0].length) map[y][x + dx] = tile;
    if (y + h - 1 >= 0 && y + h - 1 < map.length && x + dx >= 0 && x + dx < map[0].length) map[y + h - 1][x + dx] = tile;
  }
  for (let dy = 0; dy < h; dy++) {
    if (y + dy >= 0 && y + dy < map.length && x >= 0 && x < map[0].length) map[y + dy][x] = tile;
    if (y + dy >= 0 && y + dy < map.length && x + w - 1 >= 0 && x + w - 1 < map[0].length) map[y + dy][x + w - 1] = tile;
  }
}

function addRandomTrees(map: TileType[][], x: number, y: number, w: number, h: number, density: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (map[ny][nx] === TileType.GRASS && Math.random() < density) {
          map[ny][nx] = TileType.TREE;
        }
      }
    }
  }
}

function addRandomRocks(map: TileType[][], x: number, y: number, w: number, h: number, density: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (map[ny][nx] === TileType.GRASS && Math.random() < density) {
          map[ny][nx] = TileType.ROCK;
        }
      }
    }
  }
}

function addRandomBushes(map: TileType[][], x: number, y: number, w: number, h: number, density: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (map[ny][nx] === TileType.GRASS && Math.random() < density) {
          map[ny][nx] = TileType.BUSH;
        }
      }
    }
  }
}

function createPath(map: TileType[][], x1: number, y1: number, x2: number, y2: number, width: number = 1) {
  let cx = x1, cy = y1;
  while (cx !== x2 || cy !== y2) {
    for (let w = -Math.floor(width / 2); w <= Math.floor(width / 2); w++) {
      const nx = cx + (Math.abs(x2 - cx) > Math.abs(y2 - cy) ? 0 : w);
      const ny = cy + (Math.abs(x2 - cx) > Math.abs(y2 - cy) ? w : 0);
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (map[ny][nx] !== TileType.WATER && map[ny][nx] !== TileType.WALL) {
          map[ny][nx] = TileType.DIRT;
        }
      }
    }

    if (Math.abs(x2 - cx) > Math.abs(y2 - cy)) {
      cx += cx < x2 ? 1 : -1;
    } else {
      cy += cy < y2 ? 1 : -1;
    }
  }
}

// Simple seeded random for consistent maps
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateGameMap(): GameMap {
  const map = createEmptyMap(100, 100);

  // ============ TOWN (center, safe area) ============
  // Town area - stone floor
  fillRect(map, 35, 35, 30, 25, TileType.STONE_FLOOR);

  // Town walls
  drawRect(map, 34, 34, 32, 27, TileType.WALL);

  // Town entrance (south)
  map[60][49] = TileType.STONE_FLOOR;
  map[60][50] = TileType.STONE_FLOOR;

  // Town entrance (north)
  map[34][49] = TileType.STONE_FLOOR;
  map[34][50] = TileType.STONE_FLOOR;

  // Town entrance (east)
  map[47][65] = TileType.STONE_FLOOR;
  map[48][65] = TileType.STONE_FLOOR;

  // Town entrance (west)
  map[47][34] = TileType.STONE_FLOOR;
  map[48][34] = TileType.STONE_FLOOR;

  // Town buildings
  // Merchant shop
  fillRect(map, 37, 37, 8, 6, TileType.WOOD_FLOOR);
  drawRect(map, 37, 37, 8, 6, TileType.WALL);
  map[42][41] = TileType.WOOD_FLOOR; // door

  // Healer temple
  fillRect(map, 55, 37, 8, 6, TileType.STONE_FLOOR);
  drawRect(map, 55, 37, 8, 6, TileType.WALL);
  map[55][59] = TileType.STONE_FLOOR; // door

  // Bank
  fillRect(map, 37, 50, 6, 6, TileType.WOOD_FLOOR);
  drawRect(map, 37, 50, 6, 6, TileType.WALL);
  map[53][40] = TileType.WOOD_FLOOR; // door

  // Town decorations
  addRandomBushes(map, 36, 36, 28, 23, 0.02);

  // ============ PATHS ============
  // North path to forest
  createPath(map, 50, 34, 50, 5, 2);

  // South path to swamp
  createPath(map, 50, 60, 50, 95, 2);

  // East path to cave
  createPath(map, 65, 47, 95, 47, 2);

  // West path to desert
  createPath(map, 34, 47, 5, 47, 2);

  // ============ NORTH FOREST (easy monsters) ============
  fillRect(map, 5, 2, 90, 28, TileType.DARK_GRASS);
  addRandomTrees(map, 5, 2, 90, 28, 0.25);
  addRandomBushes(map, 5, 2, 90, 28, 0.08);
  // Clear path area
  fillRect(map, 48, 2, 4, 32, TileType.DARK_GRASS);
  // Forest clearing
  fillRect(map, 40, 10, 20, 10, TileType.GRASS);
  addRandomBushes(map, 40, 10, 20, 10, 0.05);

  // ============ SOUTH SWAMP (medium monsters) ============
  fillRect(map, 5, 65, 90, 33, TileType.SWAMP);
  // Water pools in swamp
  fillRect(map, 15, 72, 8, 6, TileType.WATER);
  fillRect(map, 55, 80, 10, 8, TileType.WATER);
  fillRect(map, 75, 68, 6, 5, TileType.WATER);
  // Bridge
  fillRect(map, 48, 60, 4, 40, TileType.BRIDGE);
  // Swamp trees
  addRandomTrees(map, 5, 65, 90, 33, 0.12);

  // ============ EAST CAVE/MOUNTAINS (hard monsters) ============
  fillRect(map, 70, 5, 28, 58, TileType.STONE);
  addRandomRocks(map, 70, 5, 28, 58, 0.15);
  // Cave entrance area
  fillRect(map, 78, 20, 12, 15, TileType.STONE_FLOOR);
  drawRect(map, 78, 20, 12, 15, TileType.WALL);
  map[26][78] = TileType.STONE_FLOOR; // entrance

  // Deep cave (dungeon)
  fillRect(map, 82, 22, 8, 10, TileType.STONE_FLOOR);
  fillRect(map, 70, 40, 15, 12, TileType.STONE_FLOOR);
  drawRect(map, 70, 40, 15, 12, TileType.WALL);
  map[45][70] = TileType.STONE_FLOOR; // entrance

  // ============ WEST DESERT (medium-hard) ============
  fillRect(map, 2, 5, 30, 58, TileType.SAND);
  addRandomRocks(map, 2, 5, 30, 58, 0.05);
  // Oasis
  fillRect(map, 12, 25, 6, 5, TileType.WATER);
  addRandomTrees(map, 10, 23, 10, 9, 0.15);

  // ============ WATER BORDERS ============
  // River running north-south
  for (let y = 2; y < 65; y++) {
    const x = 68;
    if (map[y][x] === TileType.GRASS || map[y][x] === TileType.DARK_GRASS || map[y][x] === TileType.DIRT) {
      map[y][x] = TileType.WATER;
      if (y + 1 < 100 && (map[y + 1][x] === TileType.GRASS || map[y + 1][x] === TileType.DARK_GRASS)) {
        map[y + 1][x] = TileType.WATER;
      }
    }
  }
  // Bridge over river
  fillRect(map, 42, 68, 4, 3, TileType.BRIDGE);

  // ============ CORNER AREAS ============
  // NW - peaceful meadow
  fillRect(map, 2, 2, 10, 10, TileType.GRASS);
  addRandomBushes(map, 2, 2, 10, 10, 0.1);

  // NE - mountain peak
  fillRect(map, 88, 2, 10, 10, TileType.SNOW);
  addRandomRocks(map, 88, 2, 10, 10, 0.1);

  // SW - lava fields
  fillRect(map, 2, 88, 10, 10, TileType.LAVA);
  // Small safe path through
  fillRect(map, 5, 88, 3, 10, TileType.STONE);

  // SE - dark forest
  fillRect(map, 88, 88, 10, 10, TileType.DARK_GRASS);
  addRandomTrees(map, 88, 88, 10, 10, 0.35);

  // ============ NPC DEFINITIONS ============
  const npcs: NPCDefinition[] = [
    {
      id: 'merchant',
      name: 'Merchant Aldric',
      position: { x: 41, y: 40 },
      type: 'merchant',
      greeting: 'Welcome to my shop, adventurer! I have the finest goods in the land.',
      color: '#e67e22',
      icon: '🧑‍🍳',
      shopItems: [
        'health_potion_small',
        'health_potion_medium',
        'health_potion_large',
        'mana_potion_small',
        'mana_potion_medium',
        'mana_potion_large',
        'wooden_sword',
        'short_sword',
        'long_sword',
        'wooden_shield',
        'leather_armor',
        'chain_mail',
        'leather_helmet',
        'leather_legs',
        'leather_boots',
        'magic_staff',
        'crossbow',
      ],
    },
    {
      id: 'healer',
      name: 'Priestess Elena',
      position: { x: 59, y: 40 },
      type: 'healer',
      greeting: 'May the light heal your wounds, brave adventurer.',
      color: '#f1c40f',
      icon: '👩‍⚕️',
    },
    {
      id: 'banker',
      name: 'Banker Grimm',
      position: { x: 40, y: 53 },
      type: 'banker',
      greeting: 'Welcome to the Bank of Tibia. Your gold is safe here.',
      color: '#2ecc71',
      icon: '🧑‍💼',
    },
    {
      id: 'quest_giver',
      name: 'Old Sage Marcus',
      position: { x: 50, y: 45 },
      type: 'quest',
      greeting: 'Ah, an adventurer! These lands are plagued by monsters. Will you help us?',
      color: '#9b59b6',
      icon: '🧙',
    },
  ];

  // ============ MONSTER ZONES ============
  const monsterZones: MonsterZone[] = [
    // Forest - easy
    {
      id: 'forest_easy',
      area: { x: 8, y: 4, width: 80, height: 24 },
      monsterIds: ['rat', 'snake'],
      maxMonsters: 15,
      spawnRate: 5000,
    },
    {
      id: 'forest_medium',
      area: { x: 40, y: 10, width: 20, height: 10 },
      monsterIds: ['spider', 'wolf'],
      maxMonsters: 8,
      spawnRate: 8000,
    },
    // Swamp - medium
    {
      id: 'swamp',
      area: { x: 5, y: 65, width: 90, height: 33 },
      monsterIds: ['snake', 'spider', 'wolf'],
      maxMonsters: 20,
      spawnRate: 6000,
    },
    // Desert - medium-hard
    {
      id: 'desert',
      area: { x: 2, y: 5, width: 30, height: 58 },
      monsterIds: ['wolf', 'orc'],
      maxMonsters: 15,
      spawnRate: 7000,
    },
    // Cave - hard
    {
      id: 'cave',
      area: { x: 78, y: 20, width: 12, height: 15 },
      monsterIds: ['skeleton', 'orc'],
      maxMonsters: 10,
      spawnRate: 8000,
    },
    {
      id: 'deep_cave',
      area: { x: 70, y: 40, width: 15, height: 12 },
      monsterIds: ['skeleton', 'demon'],
      maxMonsters: 8,
      spawnRate: 12000,
    },
    // Lava fields - boss area
    {
      id: 'lava_fields',
      area: { x: 2, y: 88, width: 10, height: 10 },
      monsterIds: ['demon'],
      maxMonsters: 3,
      spawnRate: 30000,
    },
    // Dark forest - dragon
    {
      id: 'dark_forest',
      area: { x: 88, y: 88, width: 10, height: 10 },
      monsterIds: ['dragon'],
      maxMonsters: 1,
      spawnRate: 60000,
    },
  ];

  return {
    tiles: map,
    spawnPoint: { x: 50, y: 47 }, // Town center
    npcs,
    monsterZones,
    name: 'Tibia Lands',
  };
}

let cachedMap: GameMap | null = null;

export function getGameMap(): GameMap {
  if (!cachedMap) {
    cachedMap = generateGameMap();
  }
  return cachedMap;
}