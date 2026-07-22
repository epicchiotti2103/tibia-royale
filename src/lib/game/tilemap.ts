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

export function generateGameMap(): GameMap {
  const map = createEmptyMap(100, 100);

  // ============ TOWN (center, safe area) ============
  fillRect(map, 35, 35, 30, 25, TileType.STONE_FLOOR);
  drawRect(map, 34, 34, 32, 27, TileType.WALL);

  // Town entrances
  map[60][49] = TileType.STONE_FLOOR;
  map[60][50] = TileType.STONE_FLOOR;
  map[34][49] = TileType.STONE_FLOOR;
  map[34][50] = TileType.STONE_FLOOR;
  map[47][65] = TileType.STONE_FLOOR;
  map[48][65] = TileType.STONE_FLOOR;
  map[47][34] = TileType.STONE_FLOOR;
  map[48][34] = TileType.STONE_FLOOR;

  // Town buildings
  fillRect(map, 37, 37, 8, 6, TileType.WOOD_FLOOR);
  drawRect(map, 37, 37, 8, 6, TileType.WALL);
  map[42][41] = TileType.WOOD_FLOOR; // door

  fillRect(map, 55, 37, 8, 6, TileType.STONE_FLOOR);
  drawRect(map, 55, 37, 8, 6, TileType.WALL);
  map[55][59] = TileType.STONE_FLOOR; // door

  fillRect(map, 37, 50, 6, 6, TileType.WOOD_FLOOR);
  drawRect(map, 37, 50, 6, 6, TileType.WALL);
  map[53][40] = TileType.WOOD_FLOOR; // door

  addRandomBushes(map, 36, 36, 28, 23, 0.02);

  // ============ PATHS ============
  createPath(map, 50, 34, 50, 5, 2);
  createPath(map, 50, 60, 50, 95, 2);
  createPath(map, 65, 47, 95, 47, 2);
  createPath(map, 34, 47, 5, 47, 2);

  // ============ NORTH FOREST (easy monsters) ============
  fillRect(map, 5, 2, 90, 28, TileType.DARK_GRASS);
  addRandomTrees(map, 5, 2, 90, 28, 0.2);
  addRandomBushes(map, 5, 2, 90, 28, 0.06);
  fillRect(map, 48, 2, 4, 32, TileType.DARK_GRASS);
  fillRect(map, 40, 10, 20, 10, TileType.GRASS);
  addRandomBushes(map, 40, 10, 20, 10, 0.04);

  // ============ SOUTH SWAMP (medium monsters) ============
  fillRect(map, 5, 65, 90, 33, TileType.SWAMP);
  fillRect(map, 15, 72, 8, 6, TileType.WATER);
  fillRect(map, 55, 80, 10, 8, TileType.WATER);
  fillRect(map, 75, 68, 6, 5, TileType.WATER);
  fillRect(map, 48, 60, 4, 40, TileType.BRIDGE);
  addRandomTrees(map, 5, 65, 90, 33, 0.1);

  // ============ EAST CAVE/MOUNTAINS (hard monsters) ============
  fillRect(map, 70, 5, 28, 58, TileType.STONE);
  addRandomRocks(map, 70, 5, 28, 58, 0.12);
  // Cave entrance area
  fillRect(map, 78, 20, 12, 15, TileType.STONE_FLOOR);
  drawRect(map, 78, 20, 12, 15, TileType.WALL);
  map[26][78] = TileType.STONE_FLOOR;

  // Deep cave (dungeon)
  fillRect(map, 82, 22, 8, 10, TileType.STONE_FLOOR);
  fillRect(map, 70, 40, 15, 12, TileType.STONE_FLOOR);
  drawRect(map, 70, 40, 15, 12, TileType.WALL);
  map[45][70] = TileType.STONE_FLOOR;

  // ============ WEST DESERT (medium-hard) ============
  fillRect(map, 2, 5, 30, 58, TileType.SAND);
  addRandomRocks(map, 2, 5, 30, 58, 0.04);
  fillRect(map, 12, 25, 6, 5, TileType.WATER);
  addRandomTrees(map, 10, 23, 10, 9, 0.12);

  // ============ WATER BORDERS ============
  for (let y = 2; y < 65; y++) {
    const x = 68;
    if (map[y][x] === TileType.GRASS || map[y][x] === TileType.DARK_GRASS || map[y][x] === TileType.DIRT) {
      map[y][x] = TileType.WATER;
      if (y + 1 < 100 && (map[y + 1][x] === TileType.GRASS || map[y + 1][x] === TileType.DARK_GRASS)) {
        map[y + 1][x] = TileType.WATER;
      }
    }
  }
  fillRect(map, 42, 68, 4, 3, TileType.BRIDGE);

  // ============ CORNER AREAS ============
  fillRect(map, 2, 2, 10, 10, TileType.GRASS);
  addRandomBushes(map, 2, 2, 10, 10, 0.08);

  fillRect(map, 88, 2, 10, 10, TileType.SNOW);
  addRandomRocks(map, 88, 2, 10, 10, 0.08);

  fillRect(map, 2, 88, 10, 10, TileType.LAVA);
  fillRect(map, 5, 88, 3, 10, TileType.STONE);

  fillRect(map, 88, 88, 10, 10, TileType.DARK_GRASS);
  addRandomTrees(map, 88, 88, 10, 10, 0.3);

  // ============ NPC DEFINITIONS ============
  const npcs: NPCDefinition[] = [
    {
      id: 'merchant',
      name: 'Merchant Aldric',
      position: { x: 41, y: 40 },
      type: 'merchant',
      greeting: 'Welcome to my shop! I have weapons, armor, and potions. You can also sell your loot here!',
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
        'battle_axe',
        'magic_staff',
        'arcane_staff',
        'crossbow',
        'wooden_shield',
        'iron_shield',
        'leather_armor',
        'chain_mail',
        'plate_armor',
        'mage_robe',
        'mystic_robe',
        'leather_helmet',
        'iron_helmet',
        'leather_legs',
        'chain_legs',
        'leather_boots',
        'steel_boots',
        'enchanted_boots',
        'ring_of_life',
        'ring_of_mana',
        'assassin_dagger',
        'crystal_sword',
        'divine_staff',
        'holy_crossbow',
        'druid_cloak',
        'knight_armor',
        'plate_legs',
        'amulet_of_power',
        'ring_of_fire',
        'ring_of_ice',
        'health_potion_ultra',
        'mana_potion_ultra',
        'sage_wand',
        'paladin_lance',
        'shadow_blade',
        'mage_hood',
        'dragon_helmet',
        'enchanted_shield',
        'paladin_boots',
        'amulet_of_wisdom',
        'warrior_amulet',
        'ring_of_fortune',
        'health_potion_grand',
        'mana_potion_grand',
        'excalibur',
        'staff_of_destruction',
        'nature_staff',
        'sniper_crossbow',
        'dragon_scale_armor',
        'archmage_robe',
        'ancient_bark_armor',
        'templar_armor',
        'kings_crown',
        'visor_of_shadow',
        'aegis',
        'buckler_of_dawn',
        'boots_of_speed',
        'iron_greaves',
        'dragon_leggings',
        'pendant_of_vitality',
        'ring_of_the_abyss',
        'berserker_ring',
        'raw_meat',
        'feather',
        'crab_claw',
        'bone_sword',
        'spiked_club',
        'hunter_bow',
        'rune_blade',
        'tribal_shield',
        'iron_helm',
        'wolf_pelt_cloak',
        'war_hammer',
        'frost_staff',
        'hunting_crossbow',
        'tortoise_shield',
        'wolf_helm',
        'mercenary_sword',
        'iron_gauntlets',
        'gemstone_ring',
        'spirit_amulet',
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
      greeting: 'Welcome to the Bank of Tibia Lands!',
      color: '#2ecc71',
      icon: '🧑‍💼',
    },
    {
      id: 'quest_giver',
      name: 'Old Sage Marcus',
      position: { x: 50, y: 45 },
      type: 'quest',
      greeting: 'Ah, an adventurer! These lands are full of dangerous creatures. Will you help us?',
      color: '#9b59b6',
      icon: '🧙',
    },
  ];

  // ============ MONSTER ZONES ============
  const monsterZones: MonsterZone[] = [
    // Forest - easy (rats, bats, snakes)
    {
      id: 'forest_easy',
      area: { x: 8, y: 4, width: 80, height: 24 },
      monsterIds: ['rat', 'bat', 'snake', 'wild_dog'],
      maxMonsters: 25,
      spawnRate: 4000,
    },
    // Forest clearing - medium (spiders, goblins)
    {
      id: 'forest_medium',
      area: { x: 40, y: 10, width: 20, height: 10 },
      monsterIds: ['spider', 'goblin', 'wild_dog', 'mantis'],
      maxMonsters: 16,
      spawnRate: 6000,
    },
    // Swamp - medium (snakes, spiders, wolves, scorpions)
    {
      id: 'swamp',
      area: { x: 5, y: 65, width: 60, height: 33 },
      monsterIds: ['snake', 'spider', 'wolf', 'scorpion', 'toad', 'thornback'],
      maxMonsters: 30,
      spawnRate: 5000,
    },
    // Desert - medium-hard (wolves, orcs, trolls)
    {
      id: 'desert',
      area: { x: 2, y: 5, width: 30, height: 58 },
      monsterIds: ['wolf', 'orc', 'goblin', 'scorpion'],
      maxMonsters: 20,
      spawnRate: 6000,
    },
    // Cave - hard (skeletons, wraiths, dark mages)
    {
      id: 'cave',
      area: { x: 78, y: 20, width: 12, height: 15 },
      monsterIds: ['skeleton', 'wraith', 'dark_mage', 'ghost'],
      maxMonsters: 15,
      spawnRate: 7000,
    },
    // Deep cave - very hard (dark mages, fire elementals, demons)
    {
      id: 'deep_cave',
      area: { x: 70, y: 40, width: 15, height: 12 },
      monsterIds: ['dark_mage', 'fire_elemental', 'demon', 'stone_golem', 'ghost'],
      maxMonsters: 12,
      spawnRate: 10000,
    },
    // Snow peak - hard (wraiths, trolls)
    {
      id: 'snow_peak',
      area: { x: 88, y: 2, width: 10, height: 10 },
      monsterIds: ['wraith', 'troll'],
      maxMonsters: 8,
      spawnRate: 8000,
    },
    // Lava fields - boss area (fire elementals, demons, demon lord)
    {
      id: 'lava_fields',
      area: { x: 2, y: 88, width: 10, height: 10 },
      monsterIds: ['fire_elemental', 'demon', 'demon_lord'],
      maxMonsters: 6,
      spawnRate: 20000,
    },
    // Dark forest - dragon area (trolls, dragons, ancient dragon)
    {
      id: 'dark_forest',
      area: { x: 88, y: 88, width: 10, height: 10 },
      monsterIds: ['troll', 'dragon', 'ancient_dragon'],
      maxMonsters: 5,
      spawnRate: 30000,
    },
    // Swamp deep - harder monsters
    {
      id: 'swamp_deep',
      area: { x: 65, y: 70, width: 30, height: 28 },
      monsterIds: ['scorpion', 'orc', 'troll'],
      maxMonsters: 15,
      spawnRate: 7000,
    },
    // Additional forest variety
    {
      id: 'forest_rabbits',
      area: { x: 15, y: 5, width: 20, height: 15 },
      monsterIds: ['rabbit', 'bee', 'cat'],
      maxMonsters: 18,
      spawnRate: 3000,
    },
    // Bandit camp in forest
    {
      id: 'bandit_camp',
      area: { x: 55, y: 12, width: 12, height: 8 },
      monsterIds: ['bandit', 'goblin'],
      maxMonsters: 10,
      spawnRate: 5000,
    },
    // Desert bandits
    {
      id: 'desert_bandits',
      area: { x: 15, y: 40, width: 15, height: 18 },
      monsterIds: ['bandit', 'pirate', 'orc'],
      maxMonsters: 15,
      spawnRate: 6000,
    },
    // Swamp mushrooms and boars
    {
      id: 'swamp_creatures',
      area: { x: 20, y: 75, width: 25, height: 20 },
      monsterIds: ['mushroom', 'boar', 'scorpion', 'toad'],
      maxMonsters: 20,
      spawnRate: 5000,
    },
    // Deep cave expansion - golems and necromancers
    {
      id: 'deep_cave_boss',
      area: { x: 82, y: 22, width: 8, height: 10 },
      monsterIds: ['golem', 'necromancer', 'vampire'],
      maxMonsters: 8,
      spawnRate: 12000,
    },
    // Snow peak expansion
    {
      id: 'frozen_peak',
      area: { x: 88, y: 2, width: 10, height: 10 },
      monsterIds: ['wraith', 'vampire', 'golem'],
      maxMonsters: 10,
      spawnRate: 8000,
    },
    // Lava fields expansion
    {
      id: 'inferno',
      area: { x: 2, y: 88, width: 10, height: 10 },
      monsterIds: ['fire_elemental', 'phoenix', 'demon', 'demon_lord'],
      maxMonsters: 8,
      spawnRate: 15000,
    },
    // Dark forest expansion
    {
      id: 'dark_forest_deep',
      area: { x: 88, y: 88, width: 10, height: 10 },
      monsterIds: ['dragon', 'ancient_dragon', 'hydra', 'lich_king'],
      maxMonsters: 6,
      spawnRate: 25000,
    },
    // New area: Lich King lair (south-east deep swamp)
    {
      id: 'lich_lair',
      area: { x: 75, y: 85, width: 15, height: 13 },
      monsterIds: ['vampire', 'necromancer', 'lich_king', 'kraken'],
      maxMonsters: 6,
      spawnRate: 20000,
    },
    // === NEW ANIMAL ZONES ===
    { id: 'forest_deer', area: { x: 25, y: 5, width: 20, height: 15 }, monsterIds: ['deer', 'rabbit', 'bee'], maxMonsters: 15, spawnRate: 4000 },
    { id: 'forest_bear', area: { x: 60, y: 8, width: 20, height: 12 }, monsterIds: ['bear', 'wolf', 'deer', 'war_wolf'], maxMonsters: 14, spawnRate: 8000 },
    { id: 'swamp_croc', area: { x: 10, y: 80, width: 25, height: 15 }, monsterIds: ['crocodile', 'frog', 'snake'], maxMonsters: 15, spawnRate: 5000 },
    { id: 'beach_crabs', area: { x: 40, y: 65, width: 15, height: 8 }, monsterIds: ['crab', 'snake'], maxMonsters: 12, spawnRate: 4000 },
    { id: 'mountain_hawks', area: { x: 72, y: 8, width: 15, height: 12 }, monsterIds: ['hawk', 'wraith', 'eagle'], maxMonsters: 12, spawnRate: 6000 },
    { id: 'labyrinth', area: { x: 75, y: 55, width: 20, height: 15 }, monsterIds: ['minotaur', 'skeleton', 'golem', 'stone_golem'], maxMonsters: 12, spawnRate: 10000 },
    { id: 'desert_cobra', area: { x: 5, y: 30, width: 15, height: 15 }, monsterIds: ['cobra', 'scorpion', 'bandit'], maxMonsters: 15, spawnRate: 5000 },
  ];

  return {
    tiles: map,
    spawnPoint: { x: 50, y: 47 },
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