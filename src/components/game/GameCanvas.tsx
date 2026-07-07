'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  TILE_SIZE,
  VIEWPORT_TILES_X,
  VIEWPORT_TILES_Y,
  TileType,
  Direction,
  WALKABLE_TILES,
  SOLID_TILES,
  TILE_COLORS,
  DamageNumber,
} from '@/lib/game/types';
import { MONSTERS } from '@/lib/game/monsters';

// Direction offsets
const DIR_OFFSETS = {
  [Direction.NORTH]: { x: 0, y: -1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.SOUTH]: { x: 0, y: 1 },
  [Direction.WEST]: { x: -1, y: 0 },
};

function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Direction.EAST : Direction.WEST;
  }
  return dy > 0 ? Direction.SOUTH : Direction.NORTH;
}

function drawTileDetail(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number) {
  const ts = TILE_SIZE;
  switch (tile) {
    case TileType.GRASS: {
      ctx.fillStyle = '#5a8c4f';
      for (let i = 0; i < 3; i++) {
        const gx = x + 5 + (i * 10) + Math.sin(x + y + i) * 3;
        const gy = y + ts - 8 - (i * 4);
        ctx.fillRect(gx, gy, 2, 6);
      }
      break;
    }
    case TileType.WATER: {
      ctx.fillStyle = 'rgba(100,180,255,0.3)';
      const time = Date.now() / 1000;
      ctx.fillRect(x + 4 + Math.sin(time + x) * 2, y + 8, 8, 2);
      ctx.fillRect(x + 16 + Math.cos(time + y) * 2, y + 20, 10, 2);
      break;
    }
    case TileType.TREE: {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x + ts / 2 - 2, y + ts / 2, 4, ts / 2);
      ctx.fillStyle = '#1a6b0e';
      ctx.beginPath();
      ctx.arc(x + ts / 2, y + ts / 2 - 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228b1a';
      ctx.beginPath();
      ctx.arc(x + ts / 2 - 3, y + ts / 2 - 4, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TileType.WALL: {
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
      ctx.beginPath();
      ctx.moveTo(x, y + ts / 2);
      ctx.lineTo(x + ts, y + ts / 2);
      ctx.stroke();
      break;
    }
    case TileType.ROCK: {
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.ellipse(x + ts / 2, y + ts / 2 + 2, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.ellipse(x + ts / 2, y + ts / 2, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TileType.LAVA: {
      const time = Date.now() / 500;
      ctx.fillStyle = `rgba(255, ${100 + Math.sin(time + x) * 50}, 0, 0.6)`;
      ctx.fillRect(x, y, ts, ts);
      ctx.fillStyle = `rgba(255, 200, 0, ${0.3 + Math.sin(time * 2 + y) * 0.2})`;
      ctx.fillRect(x + 8 + Math.sin(time) * 3, y + 8, 8, 8);
      break;
    }
    case TileType.BUSH: {
      ctx.fillStyle = '#2a6a1e';
      ctx.beginPath();
      ctx.arc(x + ts / 2, y + ts / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8a2e';
      ctx.beginPath();
      ctx.arc(x + ts / 2 + 3, y + ts / 2 - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TileType.BRIDGE: {
      ctx.fillStyle = '#7a5914';
      ctx.fillRect(x + 2, y, ts - 4, ts);
      ctx.fillStyle = '#6a4904';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + 2, y + i * 8, ts - 4, 1);
      }
      break;
    }
    case TileType.DARK_GRASS: {
      ctx.fillStyle = '#3a6a35';
      for (let i = 0; i < 4; i++) {
        const gx = x + 3 + (i * 7) + Math.sin(x + y + i) * 2;
        const gy = y + ts - 6 - (i * 3);
        ctx.fillRect(gx, gy, 1, 5);
      }
      break;
    }
    case TileType.SWAMP: {
      ctx.fillStyle = '#3a5b2a';
      ctx.fillRect(x + 6 + Math.sin(Date.now() / 2000 + x) * 2, y + 12, 6, 2);
      ctx.fillRect(x + 18 + Math.cos(Date.now() / 2500 + y) * 2, y + 22, 8, 2);
      break;
    }
    case TileType.SNOW: {
      ctx.fillStyle = 'rgba(200,220,255,0.3)';
      ctx.fillRect(x + 5, y + 10, 3, 2);
      ctx.fillRect(x + 20, y + 18, 4, 2);
      break;
    }
    default:
      break;
  }
}

function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  direction: Direction,
  color: string,
  level: number,
  health: number,
  maxHealth: number
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ts - 3, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(cx - 6, cy - 4, 12, 14);

  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 7, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#000';
  if (direction === Direction.SOUTH) {
    ctx.fillRect(cx - 3, cy - 7, 2, 2);
    ctx.fillRect(cx + 1, cy - 7, 2, 2);
  } else if (direction === Direction.EAST) {
    ctx.fillRect(cx + 1, cy - 7, 2, 2);
  } else if (direction === Direction.WEST) {
    ctx.fillRect(cx - 3, cy - 7, 2, 2);
  }

  ctx.fillStyle = color;
  const dirOffsets = DIR_OFFSETS[direction];
  ctx.beginPath();
  ctx.moveTo(cx + dirOffsets.x * 18, cy + dirOffsets.y * 18);
  ctx.lineTo(cx + dirOffsets.x * 14 + (dirOffsets.y !== 0 ? -3 : 0), cy + dirOffsets.y * 14 + (dirOffsets.x !== 0 ? -3 : 0));
  ctx.lineTo(cx + dirOffsets.x * 14 + (dirOffsets.y !== 0 ? 3 : 0), cy + dirOffsets.y * 14 + (dirOffsets.x !== 0 ? 3 : 0));
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(name, cx, y - 8);
  ctx.fillText(name, cx, y - 8);

  ctx.font = '7px monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.strokeText(`Lv.${level}`, cx, y - 0);
  ctx.fillText(`Lv.${level}`, cx, y - 0);

  if (health < maxHealth) {
    const barWidth = 28;
    const barHeight = 3;
    const barX = cx - barWidth / 2;
    const barY = y - 3;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpPercent = health / maxHealth;
    ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
}

function drawMonster(
  ctx: CanvasRenderingContext2D,
  name: string,
  color: string,
  _icon: string,
  x: number,
  y: number,
  health: number,
  maxHealth: number
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ts - 3, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(cx - 10, cy - 6, 20, 18, 4);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx - 4, cy, 2, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(name, cx, y - 6);
  ctx.fillText(name, cx, y - 6);

  const barWidth = 30;
  const barHeight = 3;
  const barX = cx - barWidth / 2;
  const barY = y - 2;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const hpPercent = health / maxHealth;
  ctx.fillStyle = hpPercent > 0.5 ? '#e74c3c' : hpPercent > 0.25 ? '#c0392b' : '#8b0000';
  ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
}

function drawNPC(
  ctx: CanvasRenderingContext2D,
  name: string,
  color: string,
  _icon: string,
  x: number,
  y: number
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;

  ctx.fillStyle = `${color}22`;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(cx - 6, cy - 2, 12, 12);

  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 6, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(name, cx, y - 10);
  ctx.fillText(name, cx, y - 10);

  const time = Date.now() / 500;
  const bounce = Math.sin(time) * 2;
  ctx.fillStyle = '#f1c40f';
  ctx.font = '10px sans-serif';
  ctx.fillText('!', cx, y - 18 + bounce);
}

function renderDamageNumbers(
  ctx: CanvasRenderingContext2D,
  numbers: DamageNumber[],
  camX: number,
  camY: number
) {
  const now = Date.now();
  for (const dn of numbers) {
    const age = now - dn.timestamp;
    const alpha = Math.max(0, 1 - age / 2000);
    const yOffset = -age / 100;

    const screenX = dn.position.x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const screenY = dn.position.y * TILE_SIZE + yOffset - camY;

    ctx.globalAlpha = alpha;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';

    if (dn.type === 'damage') {
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const text = `-${Math.abs(dn.value)}`;
      ctx.strokeText(text, screenX, screenY);
      ctx.fillText(text, screenX, screenY);
    } else if (dn.type === 'heal') {
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const text = `+${dn.value}`;
      ctx.strokeText(text, screenX, screenY);
      ctx.fillText(text, screenX, screenY);
    } else if (dn.type === 'miss') {
      ctx.fillStyle = '#888';
      const text = 'MISS';
      ctx.fillText(text, screenX, screenY);
    } else if (dn.type === 'xp') {
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const text = `+${dn.value} XP`;
      ctx.strokeText(text, screenX, screenY);
      ctx.fillText(text, screenX, screenY);
    }
    ctx.globalAlpha = 1;
  }
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMoveTime = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastFrameTime = useRef(0);
  const animFrameRef = useRef<number>(0);

  const player = useGameStore((s) => s.player);
  const gameMap = useGameStore((s) => s.gameMap);
  const monsters = useGameStore((s) => s.monsters);
  const otherPlayers = useGameStore((s) => s.otherPlayers);
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const movePlayer = useGameStore((s) => s.movePlayer);
  const attackMonster = useGameStore((s) => s.attackMonster);
  const interactNPC = useGameStore((s) => s.interactNPC);
  const updateMonsters = useGameStore((s) => s.updateMonsters);
  const cleanupDamageNumbers = useGameStore((s) => s.cleanupDamageNumbers);
  const regenMana = useGameStore((s) => s.regenMana);

  const moveDelay = player ? 300 / player.stats.speed : 300;

  // Render function - uses refs to avoid closure issues
  const doRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const currentPlayer = useGameStore.getState().player;
    const currentMap = useGameStore.getState().gameMap;
    const currentMonsters = useGameStore.getState().monsters;
    const currentOthers = useGameStore.getState().otherPlayers;
    const currentDmgNumbers = useGameStore.getState().damageNumbers;
    if (!ctx || !currentPlayer) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const camX = currentPlayer.position.x * TILE_SIZE - canvasWidth / 2 + TILE_SIZE / 2;
    const camY = currentPlayer.position.y * TILE_SIZE - canvasHeight / 2 + TILE_SIZE / 2;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const startTileX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const startTileY = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endTileX = Math.min(currentMap.tiles[0].length, Math.ceil((camX + canvasWidth) / TILE_SIZE) + 1);
    const endTileY = Math.min(currentMap.tiles.length, Math.ceil((camY + canvasHeight) / TILE_SIZE) + 1);

    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = currentMap.tiles[y][x];
        const screenX = x * TILE_SIZE - camX;
        const screenY = y * TILE_SIZE - camY;

        ctx.fillStyle = TILE_COLORS[tile] || '#333';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        drawTileDetail(ctx, tile, screenX, screenY);
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const screenX = x * TILE_SIZE - camX;
        const screenY = y * TILE_SIZE - camY;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }

    for (const npc of currentMap.npcs) {
      const screenX = npc.position.x * TILE_SIZE - camX;
      const screenY = npc.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawNPC(ctx, npc.name, npc.color, npc.icon, screenX, screenY);
      }
    }

    for (const monster of currentMonsters) {
      if (monster.isDead) continue;
      const def = MONSTERS[monster.definitionId];
      if (!def) continue;
      const screenX = monster.position.x * TILE_SIZE - camX;
      const screenY = monster.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawMonster(ctx, def.name, def.color, def.icon, screenX, screenY, monster.health, monster.maxHealth);
      }
    }

    for (const other of currentOthers) {
      const screenX = other.position.x * TILE_SIZE - camX;
      const screenY = other.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawPlayerSprite(ctx, other.name, screenX, screenY, other.direction as Direction, '#3498db', other.level, other.health, other.maxHealth);
      }
    }

    const playerScreenX = currentPlayer.position.x * TILE_SIZE - camX;
    const playerScreenY = currentPlayer.position.y * TILE_SIZE - camY;
    drawPlayerSprite(ctx, currentPlayer.name, playerScreenX, playerScreenY, currentPlayer.direction, '#e67e22', currentPlayer.stats.level, currentPlayer.stats.health, currentPlayer.stats.maxHealth);

    renderDamageNumbers(ctx, currentDmgNumbers, camX, camY);
  }, []);

  // Game loop ref to avoid self-reference
  const gameLoopRef = useRef<(timestamp: number) => void>();

  // Game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      const deltaTime = lastFrameTime.current ? timestamp - lastFrameTime.current : 16;
      lastFrameTime.current = timestamp;

      const store = useGameStore.getState();
      const now = Date.now();
      const delay = store.player ? 300 / store.player.stats.speed : 300;

      if (now - lastMoveTime.current > delay) {
        let moved = false;
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
          store.movePlayer(Direction.NORTH); moved = true;
        } else if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
          store.movePlayer(Direction.SOUTH); moved = true;
        } else if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
          store.movePlayer(Direction.WEST); moved = true;
        } else if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
          store.movePlayer(Direction.EAST); moved = true;
        }
        if (moved) lastMoveTime.current = now;
      }

      store.updateMonsters(deltaTime);
      store.regenMana(deltaTime);

      if (now % 500 < 20) store.cleanupDamageNumbers();

      doRender();
      animFrameRef.current = requestAnimationFrame(gameLoopRef.current!);
    },
    [doRender]
  );

  gameLoopRef.current = gameLoop; // eslint-disable-line react-hooks/refs -- sync ref for recursive rAF

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);

      if (key === ' ') {
        e.preventDefault();
        useGameStore.getState().attackMonster();
      }
      if (key === 'e') {
        useGameStore.getState().interactNPC();
      }

      const num = parseInt(key);
      if (num >= 1 && num <= 9) {
        const store = useGameStore.getState();
        if (store.player) {
          const invItem = store.player.inventory[num - 1];
          if (invItem) {
            store.consumeInventoryItem(invItem.id);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const currentPlayer = useGameStore.getState().player;
      if (!canvas || !currentPlayer) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const camX = currentPlayer.position.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
      const camY = currentPlayer.position.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;

      const tileX = Math.floor((clickX + camX) / TILE_SIZE);
      const tileY = Math.floor((clickY + camY) / TILE_SIZE);

      const dx = tileX - currentPlayer.position.x;
      const dy = tileY - currentPlayer.position.y;
      const dist = Math.abs(dx) + Math.abs(dy);

      const store = useGameStore.getState();
      const targetMonster = store.monsters.find(
        (m) => !m.isDead && m.position.x === tileX && m.position.y === tileY
      );
      const targetNPC = store.gameMap.npcs.find(
        (n) => Math.abs(n.position.x - tileX) <= 1 && Math.abs(n.position.y - tileY) <= 1
      );

      if (targetMonster && dist <= 2) {
        const dir = getDirection(dx, dy);
        store.movePlayer(dir);
        setTimeout(() => store.attackMonster(), 50);
      } else if (targetNPC && dist <= 3) {
        const dir = getDirection(
          targetNPC.position.x - currentPlayer.position.x,
          targetNPC.position.y - currentPlayer.position.y
        );
        store.movePlayer(dir);
        setTimeout(() => store.interactNPC(), 50);
      }
    },
    []
  );

  // Canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Start game loop
  useEffect(() => {
    if (player) {
      lastFrameTime.current = 0;
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [player, gameLoop]);

  // Spawn monsters on mount
  useEffect(() => {
    const store = useGameStore.getState();
    if (store.monsters.length === 0) {
      store.spawnMonsters();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}