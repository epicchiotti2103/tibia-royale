'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { TILE_SIZE, TILE_COLORS, TileType } from '@/lib/game/types';
import { MONSTERS } from '@/lib/game/monsters';

const MINIMAP_SCALE = 2.5;

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useGameStore((s) => s.player);
  const gameMap = useGameStore((s) => s.gameMap);
  const monsters = useGameStore((s) => s.monsters);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !player) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const map = gameMap;
    const mapW = map.tiles[0].length;
    const mapH = map.tiles.length;
    const viewRadius = 25; // tiles around player to show

    canvas.width = viewRadius * 2 * MINIMAP_SCALE;
    canvas.height = viewRadius * 2 * MINIMAP_SCALE;

    const centerX = viewRadius;
    const centerY = viewRadius;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let dy = -viewRadius; dy < viewRadius; dy++) {
      for (let dx = -viewRadius; dx < viewRadius; dx++) {
        const tx = player.position.x + dx;
        const ty = player.position.y + dy;

        if (tx < 0 || tx >= mapW || ty < 0 || ty >= mapH) continue;

        const tile = map.tiles[ty][tx];
        const sx = (centerX + dx) * MINIMAP_SCALE;
        const sy = (centerY + dy) * MINIMAP_SCALE;

        // Simplified minimap colors
        let color = '#333';
        switch (tile) {
          case TileType.GRASS: color = '#3a6b2f'; break;
          case TileType.DARK_GRASS: color = '#1d4a18'; break;
          case TileType.WATER: color = '#1a4a8a'; break;
          case TileType.WALL: color = '#444'; break;
          case TileType.WOOD_FLOOR: color = '#6a4a2c'; break;
          case TileType.STONE_FLOOR: color = '#5a5a5a'; break;
          case TileType.DIRT: color = '#6a5a3a'; break;
          case TileType.SAND: color = '#b09a5a'; break;
          case TileType.SNOW: color = '#c8c8d8'; break;
          case TileType.LAVA: color = '#a03000'; break;
          case TileType.SWAMP: color = '#2a4a1a'; break;
          case TileType.BRIDGE: color = '#6a4904'; break;
          case TileType.TREE: color = '#0a3a06'; break;
          case TileType.ROCK: color = '#3a3a3a'; break;
          case TileType.BUSH: color = '#1a5a12'; break;
          case TileType.STONE: color = '#4a4a4a'; break;
          default: color = '#333';
        }

        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, MINIMAP_SCALE, MINIMAP_SCALE);
      }
    }

    // Draw NPCs (yellow dots)
    for (const npc of gameMap.npcs) {
      const dx = npc.position.x - player.position.x;
      const dy = npc.position.y - player.position.y;
      if (Math.abs(dx) < viewRadius && Math.abs(dy) < viewRadius) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(
          (centerX + dx) * MINIMAP_SCALE - 1,
          (centerY + dy) * MINIMAP_SCALE - 1,
          MINIMAP_SCALE + 2,
          MINIMAP_SCALE + 2
        );
      }
    }

    // Draw monsters (red dots)
    for (const monster of monsters) {
      if (monster.isDead) continue;
      const dx = monster.position.x - player.position.x;
      const dy = monster.position.y - player.position.y;
      if (Math.abs(dx) < viewRadius && Math.abs(dy) < viewRadius) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(
          (centerX + dx) * MINIMAP_SCALE,
          (centerY + dy) * MINIMAP_SCALE,
          MINIMAP_SCALE,
          MINIMAP_SCALE
        );
      }
    }

    // Draw player (white dot, centered)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      centerX * MINIMAP_SCALE - 1,
      centerY * MINIMAP_SCALE - 1,
      MINIMAP_SCALE + 2,
      MINIMAP_SCALE + 2
    );

    // Border
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

  }, [player, gameMap, monsters]);

  if (!player) return null;

  return (
    <div className="absolute top-12 right-0 z-10">
      <canvas
        ref={canvasRef}
        className="border border-amber-700/50 rounded"
        style={{
          width: '125px',
          height: '125px',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}