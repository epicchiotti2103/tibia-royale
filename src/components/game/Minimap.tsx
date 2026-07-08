'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { TILE_SIZE, TILE_COLORS, TileType } from '@/lib/game/types';
import { MONSTERS } from '@/lib/game/monsters';

const MINIMAP_SCALE = 2.5;

interface ZoneInfo {
  name: string;
  difficulty: string;
  emoji: string;
  color: string;
}

function getZoneForPosition(x: number, y: number): ZoneInfo {
  // Town: x 35-65, y 35-61
  if (x >= 35 && x <= 65 && y >= 35 && y <= 61) {
    return { name: 'Town', difficulty: 'Safe', emoji: '🏘️', color: '#f1c40f' };
  }
  // North Forest: x 5-95, y 2-30
  if (x >= 5 && x <= 95 && y >= 2 && y <= 30) {
    // Snow area in the NE corner of the north zone
    if (x >= 66 && x <= 95 && y >= 2 && y <= 30) {
      return { name: 'Snow', difficulty: 'Hard', emoji: '❄️', color: '#85c1e9' };
    }
    return { name: 'Forest', difficulty: 'Easy', emoji: '🌲', color: '#82e0aa' };
  }
  // Desert: x 2-32, y 5-63
  if (x >= 2 && x <= 32 && y >= 5 && y <= 63) {
    return { name: 'Desert', difficulty: 'Medium', emoji: '🏜️', color: '#f0b27a' };
  }
  // East Plains: x 66-95, y 35-95
  if (x >= 66 && x <= 95 && y >= 35 && y <= 95) {
    return { name: 'East Plains', difficulty: 'Medium', emoji: '🌾', color: '#abebc6' };
  }
  // Swamp: x 5-65, y 65-98
  if (x >= 5 && x <= 65 && y >= 65 && y <= 98) {
    return { name: 'Swamp', difficulty: 'Medium', emoji: '🌊', color: '#a3e4d7' };
  }
  // Cave/Volcano: lower-right area (fallback for remaining)
  if (x >= 66 && y >= 65) {
    return { name: 'Cave', difficulty: 'Hard', emoji: '🌋', color: '#f1948a' };
  }
  return { name: 'Wilderness', difficulty: 'Unknown', emoji: '🗺️', color: '#aeb6bf' };
}

function getMonsterColor(definitionId: string, time: number): string {
  const exp = MONSTERS[definitionId]?.experience ?? 0;
  if (exp > 200) {
    // Boss / Legendary - pulsing red
    const pulse = 0.6 + 0.4 * Math.sin(time * 4);
    const r = Math.round(231 * pulse);
    return `rgb(${r}, 50, 50)`;
  }
  if (exp >= 100) {
    return '#e67e22'; // hard - orange
  }
  if (exp >= 30) {
    return '#f1c40f'; // medium - yellow
  }
  return '#2ecc71'; // easy - green
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const player = useGameStore((s) => s.player);
  const gameMap = useGameStore((s) => s.gameMap);
  const monsters = useGameStore((s) => s.monsters);
  const zone = player ? getZoneForPosition(player.position.x, player.position.y) : { name: 'Wilderness', difficulty: 'Unknown', emoji: '🗺️', color: '#aeb6bf' };

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

    function draw(timestamp: number) {
      const time = timestamp / 1000;

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

      // Subtle grid lines every 10 tiles
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 0.5;
      for (let gx = -viewRadius; gx <= viewRadius; gx += 10) {
        const worldX = player.position.x + gx;
        const alignedX = Math.round(worldX / 10) * 10 - player.position.x;
        if (Math.abs(alignedX) < viewRadius) {
          const sx = (centerX + alignedX) * MINIMAP_SCALE;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, canvas.height);
          ctx.stroke();
        }
      }
      for (let gy = -viewRadius; gy <= viewRadius; gy += 10) {
        const worldY = player.position.y + gy;
        const alignedY = Math.round(worldY / 10) * 10 - player.position.y;
        if (Math.abs(alignedY) < viewRadius) {
          const sy = (centerY + alignedY) * MINIMAP_SCALE;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(canvas.width, sy);
          ctx.stroke();
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

      // Draw monsters with danger-based color coding
      for (const monster of monsters) {
        if (monster.isDead) continue;
        const dx = monster.position.x - player.position.x;
        const dy = monster.position.y - player.position.y;
        if (Math.abs(dx) < viewRadius && Math.abs(dy) < viewRadius) {
          ctx.fillStyle = getMonsterColor(monster.definitionId, time);
          const exp = MONSTERS[monster.definitionId]?.experience ?? 0;
          // Boss dots are slightly larger
          const extra = exp > 200 ? 1.5 : 0;
          ctx.fillRect(
            (centerX + dx) * MINIMAP_SCALE - extra,
            (centerY + dy) * MINIMAP_SCALE - extra,
            MINIMAP_SCALE + extra * 2,
            MINIMAP_SCALE + extra * 2
          );
        }
      }

      // Draw player (white dot with pulsing outline)
      const px = centerX * MINIMAP_SCALE;
      const py = centerY * MINIMAP_SCALE;
      const pulseSize = 1 + 0.5 * Math.sin(time * 3);

      // Pulsing white outline
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.4 * Math.sin(time * 3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + MINIMAP_SCALE / 2, py + MINIMAP_SCALE / 2, MINIMAP_SCALE / 2 + pulseSize + 1, 0, Math.PI * 2);
      ctx.stroke();

      // White fill (slightly larger)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 0.5, py - 0.5, MINIMAP_SCALE + 1, MINIMAP_SCALE + 1);

      // Vignette overlay - radial gradient darkening edges
      const halfW = canvas.width / 2;
      const halfH = canvas.height / 2;
      const outerRadius = Math.max(halfW, halfH);
      const innerRadius = outerRadius * 0.5;
      const vignette = ctx.createRadialGradient(halfW, halfH, innerRadius, halfW, halfH, outerRadius);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Compass "N" indicator in top-right corner
      const nX = canvas.width - 12;
      const nY = 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(nX - 1, nY - 7, 12, 12);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', nX + 5, nY - 1);

      // Border
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [player, gameMap, monsters]);

  if (!player) return null;

  const difficultyColor =
    zone.difficulty === 'Safe'
      ? 'text-green-400'
      : zone.difficulty === 'Easy'
        ? 'text-green-300'
        : zone.difficulty === 'Medium'
          ? 'text-yellow-300'
          : zone.difficulty === 'Hard'
            ? 'text-red-400'
            : 'text-gray-400';

  return (
    <div className="absolute top-12 right-0 z-10">
      {/* Zone name label */}
      <div className="flex items-center justify-center mb-1 px-2 py-0.5 bg-black/70 rounded-t border border-amber-700/50 border-b-0">
        <span className="text-xs font-bold tracking-wide" style={{ color: zone.color }}>
          {zone.emoji} {zone.name}
        </span>
        <span className={`text-[10px] ml-1.5 ${difficultyColor}`}>
          ({zone.difficulty})
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-b"
        style={{
          width: '125px',
          height: '125px',
          imageRendering: 'pixelated',
          boxShadow: '0 0 12px rgba(241, 196, 15, 0.15), 0 0 4px rgba(0, 0, 0, 0.6)',
        }}
      />
    </div>
  );
}