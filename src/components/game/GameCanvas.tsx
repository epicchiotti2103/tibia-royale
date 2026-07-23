'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileControls } from '@/components/game/MobileControls';
import {
  TILE_SIZE,
  TileType,
  Direction,
  TILE_COLORS,
  DamageNumber,
  SpellEffect,
  DIR_OFFSETS,
  MonsterSpriteSet,
  Vocation,
} from '@/lib/game/types';
import { MONSTERS } from '@/lib/game/monsters';
import { drawMonsterCreature } from '@/lib/game/monster-drawings';

// =============================================
// Sprite image cache
// =============================================
const spriteCache: Record<string, HTMLImageElement> = {};
const spriteLoadPromises: Record<string, Promise<void>> = {};

function loadSprite(url: string): Promise<HTMLImageElement | undefined> {
  if (spriteCache[url]) return Promise.resolve(spriteCache[url]);
  if (!spriteLoadPromises[url]) {
    spriteLoadPromises[url] = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        spriteCache[url] = img;
        resolve();
      };
      img.onerror = () => {
        resolve(); // Don't block on error
      };
      img.src = url;
    });
  }
  return spriteLoadPromises[url].then(() => spriteCache[url]);
}

const PLAYER_SPRITES: Record<string, MonsterSpriteSet> = {
  [Vocation.KNIGHT]: {
    north: '/sprites/player_knight/north.png',
    south: '/sprites/player_knight/south.png',
    east: '/sprites/player_knight/east.png',
    west: '/sprites/player_knight/west.png',
  },
  [Vocation.SORCERER]: {
    north: '/sprites/player_sorcerer/north.png',
    south: '/sprites/player_sorcerer/south.png',
    east: '/sprites/player_sorcerer/east.png',
    west: '/sprites/player_sorcerer/west.png',
  },
  [Vocation.DRUID]: {
    north: '/sprites/player_druid/north.png',
    south: '/sprites/player_druid/south.png',
    east: '/sprites/player_druid/east.png',
    west: '/sprites/player_druid/west.png',
  },
  [Vocation.PALADIN]: {
    north: '/sprites/player_paladin/north.png',
    south: '/sprites/player_paladin/south.png',
    east: '/sprites/player_paladin/east.png',
    west: '/sprites/player_paladin/west.png',
  },
};

function preloadSprites() {
  for (const def of Object.values(MONSTERS)) {
    if (def.sprites) {
      loadSprite(def.sprites.north);
      loadSprite(def.sprites.south);
      loadSprite(def.sprites.east);
      loadSprite(def.sprites.west);
    }
  }
  // Preload player vocation sprites
  for (const sprites of Object.values(PLAYER_SPRITES)) {
    loadSprite(sprites.north);
    loadSprite(sprites.south);
    loadSprite(sprites.east);
    loadSprite(sprites.west);
  }
}

function getSpriteForDirection(sprites: MonsterSpriteSet, direction: Direction): string {
  switch (direction) {
    case Direction.NORTH: return sprites.north;
    case Direction.EAST: return sprites.east;
    case Direction.SOUTH: return sprites.south;
    case Direction.WEST: return sprites.west;
    default: return sprites.south;
  }
}

export function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Direction.EAST : Direction.WEST;
  }
  return dy > 0 ? Direction.SOUTH : Direction.NORTH;
}

// =============================================
// Pseudo-random tile hash (deterministic per tile)
// =============================================
function tileHash(x: number, y: number, seed: number = 0): number {
  let h = (seed * 374761393 + x * 668265263 + y * 1274126177) | 0;
  h = ((h ^ (h >> 13)) * 1103515245 + 12345) | 0;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff;
}

// =============================================
// Tile detail rendering
// =============================================
function drawTileDetail(ctx: CanvasRenderingContext2D, tile: TileType, screenX: number, screenY: number, tileX: number, tileY: number) {
  const ts = TILE_SIZE;
  const cx = screenX + ts / 2;
  const cy = screenY + ts / 2;
  const time = Date.now() / 1000;

  switch (tile) {
    case TileType.GRASS: {
      // Scattered grass blades using deterministic hash
      const bladeCount = 6 + Math.floor(tileHash(tileX, tileY, 1) * 5);
      for (let i = 0; i < bladeCount; i++) {
        const bx = tileHash(tileX, tileY, i * 3 + 10);
        const by = tileHash(tileX, tileY, i * 3 + 11);
        const bh = tileHash(tileX, tileY, i * 3 + 12);
        const gx = screenX + bx * (ts - 4) + 2;
        const gy = screenY + by * (ts - 4) + 2;
        const height = 3 + bh * 5;
        // Darker green blade
        ctx.fillStyle = `rgb(${30 + Math.floor(bx * 20)}, ${55 + Math.floor(by * 25)}, ${22 + Math.floor(bh * 15)})`;
        ctx.fillRect(gx, gy - height, 1, height);
      }
      // Occasional small flowers
      const flowerCount = Math.floor(tileHash(tileX, tileY, 50) * 3);
      const flowerColors = ['#c4c020', '#d04030', '#d080d0', '#f0f0f0'];
      for (let i = 0; i < flowerCount; i++) {
        const fx = tileHash(tileX, tileY, i + 60);
        const fy = tileHash(tileX, tileY, i + 70);
        const fc = Math.floor(tileHash(tileX, tileY, i + 80) * flowerColors.length);
        ctx.fillStyle = flowerColors[fc];
        ctx.fillRect(screenX + fx * (ts - 6) + 3, screenY + fy * (ts - 6) + 3, 2, 2);
      }
      break;
    }

    case TileType.WATER: {
      // Darker grid pattern underneath
      ctx.strokeStyle = 'rgba(0,20,50,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY + ts / 2);
      ctx.lineTo(screenX + ts, screenY + ts / 2);
      ctx.moveTo(screenX + ts / 2, screenY);
      ctx.lineTo(screenX + ts / 2, screenY + ts);
      ctx.stroke();
      // Animated wave lines with varying opacity
      for (let i = 0; i < 3; i++) {
        const waveY = screenY + 5 + i * 10;
        const opacity = 0.15 + Math.sin(time * 1.5 + tileX + i * 2) * 0.1;
        ctx.strokeStyle = `rgba(80,160,220,${opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let wx = 0; wx < ts; wx += 2) {
          const wy = waveY + Math.sin(time * 2 + wx * 0.3 + tileX * 3 + i) * 2;
          if (wx === 0) ctx.moveTo(screenX + wx, wy);
          else ctx.lineTo(screenX + wx, wy);
        }
        ctx.stroke();
      }
      // Subtle highlight
      ctx.fillStyle = `rgba(120,200,255,${0.05 + Math.sin(time + tileY) * 0.03})`;
      ctx.fillRect(screenX + 4, screenY + 4, ts - 8, 2);
      break;
    }

    case TileType.TREE: {
      // Shadow underneath
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + 6, 11, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Trunk
      ctx.fillStyle = '#3a2210';
      ctx.fillRect(cx - 2, cy + 1, 4, ts / 2 - 1);
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(cx - 1, cy + 1, 2, ts / 2 - 1);
      // Canopy - multiple overlapping circles for fullness
      const canopyColors = ['#0a3a08', '#0e440c', '#0c3e0a', '#124e10', '#0b3c09'];
      const offsets = [
        [0, -4, 12], [-5, -1, 9], [5, -1, 9], [-3, -7, 8], [3, -7, 8],
        [0, -2, 11], [-7, -4, 7], [7, -4, 7],
      ];
      for (let i = 0; i < offsets.length; i++) {
        ctx.fillStyle = canopyColors[i % canopyColors.length];
        ctx.beginPath();
        ctx.arc(cx + offsets[i][0], cy + offsets[i][1], offsets[i][2], 0, Math.PI * 2);
        ctx.fill();
      }
      // Highlight on top
      ctx.fillStyle = 'rgba(40,120,30,0.3)';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TileType.WALL: {
      // Stone brick pattern with mortar
      const brickH = ts / 4;
      const brickW = ts / 2;
      // Mortar lines
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      for (let row = 0; row <= 4; row++) {
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + row * brickH);
        ctx.lineTo(screenX + ts, screenY + row * brickH);
        ctx.stroke();
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let col = 0; col <= 2; col++) {
          const bx = screenX + col * brickW + offset;
          if (bx >= screenX && bx <= screenX + ts) {
            ctx.beginPath();
            ctx.moveTo(bx, screenY + row * brickH);
            ctx.lineTo(bx, screenY + (row + 1) * brickH);
            ctx.stroke();
          }
        }
      }
      // Subtle 3D shadow on bottom-right edges
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(screenX + ts - 3, screenY, 3, ts);
      ctx.fillRect(screenX, screenY + ts - 3, ts, 3);
      // Top-left highlight
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(screenX, screenY, 3, ts);
      ctx.fillRect(screenX, screenY, ts, 3);
      // Texture dots for stone grain
      for (let i = 0; i < 5; i++) {
        const dx = tileHash(tileX, tileY, i + 100);
        const dy = tileHash(tileX, tileY, i + 110);
        const shade = 30 + Math.floor(dx * 20);
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.3)`;
        ctx.fillRect(screenX + dx * (ts - 4) + 2, screenY + dy * (ts - 4) + 2, 2, 2);
      }
      break;
    }

    case TileType.ROCK: {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + 4, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Main boulder body
      ctx.fillStyle = '#454545';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top-left highlight
      ctx.fillStyle = 'rgba(180,180,180,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 2, 7, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Bottom-right shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy + 4, 8, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Texture dots
      for (let i = 0; i < 4; i++) {
        const dx = tileHash(tileX, tileY, i + 200);
        const dy = tileHash(tileX, tileY, i + 210);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(100,100,100,0.4)' : 'rgba(30,30,30,0.3)';
        ctx.fillRect(screenX + 8 + dx * 16, screenY + 8 + dy * 16, 2, 2);
      }
      break;
    }

    case TileType.LAVA: {
      // Darker cracks
      ctx.strokeStyle = 'rgba(30,5,0,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX + 4, screenY + 8);
      ctx.lineTo(screenX + 14, screenY + 12);
      ctx.lineTo(screenX + 20, screenY + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screenX + 10, screenY + 22);
      ctx.lineTo(screenX + 22, screenY + 26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(screenX + 2, screenY + 28);
      ctx.lineTo(screenX + 12, screenY + 20);
      ctx.stroke();
      // Animated bright bubbles
      for (let i = 0; i < 4; i++) {
        const bx = tileHash(tileX, tileY, i + 300);
        const by = tileHash(tileX, tileY, i + 310);
        const phase = time * 2 + tileX + tileY + i * 1.5;
        const pulse = 0.4 + Math.sin(phase) * 0.3;
        const size = 3 + Math.sin(phase * 1.3) * 2;
        // Orange glow
        ctx.fillStyle = `rgba(255,${140 + Math.floor(Math.sin(phase) * 60)},0,${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(screenX + 5 + bx * (ts - 10), screenY + 5 + by * (ts - 10), size + 2, 0, Math.PI * 2);
        ctx.fill();
        // Yellow hot center
        ctx.fillStyle = `rgba(255,220,50,${pulse * 0.7})`;
        ctx.beginPath();
        ctx.arc(screenX + 5 + bx * (ts - 10), screenY + 5 + by * (ts - 10), size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case TileType.BUSH: {
      // Shadow underneath
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx + 1, cy + 5, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Dark outer circles
      const bushParts = [
        [cx - 4, cy, 8],
        [cx + 4, cy, 8],
        [cx, cy - 3, 9],
        [cx - 6, cy - 1, 6],
        [cx + 6, cy - 1, 6],
      ];
      for (const [px, py, r] of bushParts) {
        ctx.fillStyle = '#143a0e';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Lighter center
      ctx.fillStyle = '#1e5a16';
      ctx.beginPath();
      ctx.arc(cx, cy - 1, 5, 0, Math.PI * 2);
      ctx.fill();
      // Berry dots
      for (let i = 0; i < 3; i++) {
        const bx = tileHash(tileX, tileY, i + 400);
        const by = tileHash(tileX, tileY, i + 410);
        ctx.fillStyle = i === 0 ? '#a02020' : '#802040';
        ctx.beginPath();
        ctx.arc(screenX + 8 + bx * 16, screenY + 8 + by * 16, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case TileType.BRIDGE: {
      // Wooden planks
      const plankW = (ts - 4) / 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(screenX + 2 + i * plankW, screenY);
        ctx.lineTo(screenX + 2 + i * plankW, screenY + ts);
        ctx.stroke();
      }
      // Wood grain lines on each plank
      for (let i = 0; i < 4; i++) {
        const grainX = screenX + 2 + i * plankW + plankW / 2;
        ctx.strokeStyle = 'rgba(60,30,5,0.2)';
        ctx.beginPath();
        ctx.moveTo(grainX - 1, screenY + 2);
        ctx.lineTo(grainX + 1, screenY + ts - 2);
        ctx.stroke();
      }
      // Nail dots at intersections
      ctx.fillStyle = '#2a1a08';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          ctx.beginPath();
          ctx.arc(screenX + 2 + col * plankW, screenY + 4 + row * 10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case TileType.DARK_GRASS: {
      // Scattered dark grass blades
      const bladeCount = 8 + Math.floor(tileHash(tileX, tileY, 1) * 6);
      for (let i = 0; i < bladeCount; i++) {
        const bx = tileHash(tileX, tileY, i * 3 + 500);
        const by = tileHash(tileX, tileY, i * 3 + 501);
        const bh = tileHash(tileX, tileY, i * 3 + 502);
        const gx = screenX + bx * (ts - 4) + 2;
        const gy = screenY + by * (ts - 4) + 2;
        const height = 2 + bh * 4;
        ctx.fillStyle = `rgb(${15 + Math.floor(bx * 15)}, ${28 + Math.floor(by * 20)}, ${10 + Math.floor(bh * 10)})`;
        ctx.fillRect(gx, gy - height, 1, height);
      }
      // Occasional dark mushroom dots
      const mushroomCount = Math.floor(tileHash(tileX, tileY, 550) * 2);
      for (let i = 0; i < mushroomCount; i++) {
        const mx = tileHash(tileX, tileY, i + 560);
        const my = tileHash(tileX, tileY, i + 570);
        // Stem
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(screenX + mx * (ts - 6) + 3, screenY + my * (ts - 6) + 5, 1, 3);
        // Cap
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(screenX + mx * (ts - 6) + 2, screenY + my * (ts - 6) + 4, 3, 2);
      }
      break;
    }

    case TileType.SWAMP: {
      // Algae patches
      for (let i = 0; i < 3; i++) {
        const ax = tileHash(tileX, tileY, i + 600);
        const ay = tileHash(tileX, tileY, i + 610);
        ctx.fillStyle = `rgba(20,50,10,${0.3 + ax * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(screenX + 5 + ax * (ts - 10), screenY + 5 + ay * (ts - 10), 4 + ax * 3, 2 + ay * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Murky bubbles (animated)
      for (let i = 0; i < 2; i++) {
        const bx = tileHash(tileX, tileY, i + 620);
        const by = tileHash(tileX, tileY, i + 630);
        const bubblePhase = time + tileX * 2 + i * 3;
        const rise = (bubblePhase % 3) / 3; // 0-1 cycle
        const alpha = 0.3 * (1 - rise);
        ctx.fillStyle = `rgba(40,70,30,${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX + 5 + bx * (ts - 10), screenY + ts - 4 - rise * (ts - 8), 2 + bx * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Dead tree stump
      if (tileHash(tileX, tileY, 640) > 0.75) {
        ctx.fillStyle = '#1a1408';
        ctx.fillRect(cx - 2, cy, 4, 8);
        ctx.fillStyle = '#221a0a';
        ctx.fillRect(cx - 3, cy - 1, 6, 3);
      }
      break;
    }

    case TileType.SNOW: {
      // Sparkle effects
      for (let i = 0; i < 5; i++) {
        const sx = tileHash(tileX, tileY, i + 700);
        const sy = tileHash(tileX, tileY, i + 710);
        const sparkle = Math.sin(time * 3 + tileX + tileY + i * 2) * 0.5 + 0.5;
        if (sparkle > 0.7) {
          ctx.fillStyle = `rgba(255,255,255,${sparkle * 0.8})`;
          ctx.fillRect(screenX + sx * (ts - 4) + 2, screenY + sy * (ts - 4) + 2, 1, 1);
        }
      }
      // Small snow mounds
      for (let i = 0; i < 2; i++) {
        const mx = tileHash(tileX, tileY, i + 720);
        const my = tileHash(tileX, tileY, i + 730);
        ctx.fillStyle = 'rgba(200,210,230,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 6 + mx * (ts - 12), screenY + 6 + my * (ts - 12), 5, 3, mx * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case TileType.DIRT: {
      // Small pebble dots
      for (let i = 0; i < 5; i++) {
        const px = tileHash(tileX, tileY, i + 800);
        const py = tileHash(tileX, tileY, i + 810);
        const shade = 40 + Math.floor(px * 30);
        ctx.fillStyle = `rgb(${shade + 20},${shade + 10},${shade - 10})`;
        ctx.fillRect(screenX + 3 + px * (ts - 6), screenY + 3 + py * (ts - 6), 2, 1);
      }
      // Occasional grass tufts
      const tuftCount = Math.floor(tileHash(tileX, tileY, 820) * 3);
      for (let i = 0; i < tuftCount; i++) {
        const tx = tileHash(tileX, tileY, i + 830);
        const ty = tileHash(tileX, tileY, i + 840);
        ctx.fillStyle = '#2a4a1a';
        const gx = screenX + 4 + tx * (ts - 8);
        const gy = screenY + 4 + ty * (ts - 8);
        ctx.fillRect(gx, gy - 3, 1, 3);
        ctx.fillRect(gx + 2, gy - 4, 1, 4);
        ctx.fillRect(gx - 1, gy - 2, 1, 2);
      }
      break;
    }

    case TileType.STONE_FLOOR: {
      // Brick/tile pattern with grout lines
      const brickW2 = ts / 2;
      const brickH2 = ts / 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(screenX, screenY + brickH2);
      ctx.lineTo(screenX + ts, screenY + brickH2);
      ctx.stroke();
      // Vertical line (offset for brick pattern)
      ctx.beginPath();
      ctx.moveTo(screenX + brickW2, screenY);
      ctx.lineTo(screenX + brickW2, screenY + ts);
      ctx.stroke();
      // Subtle texture on each brick quadrant
      for (let qy = 0; qy < 2; qy++) {
        for (let qx = 0; qx < 2; qx++) {
          const shade = 60 + Math.floor(tileHash(tileX + qx, tileY + qy, 900) * 20);
          ctx.fillStyle = `rgba(${shade},${shade},${shade},0.15)`;
          ctx.fillRect(screenX + qx * brickW2 + 1, screenY + qy * brickH2 + 1, brickW2 - 2, brickH2 - 2);
        }
      }
      break;
    }

    case TileType.WOOD_FLOOR: {
      // Plank divisions (horizontal planks)
      const plankH = ts / 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + i * plankH);
        ctx.lineTo(screenX + ts, screenY + i * plankH);
        ctx.stroke();
      }
      // Wood grain lines on each plank
      for (let i = 0; i < 4; i++) {
        const py = screenY + i * plankH;
        const grainOffset = tileHash(tileX, tileY, i + 950) * 3;
        ctx.strokeStyle = 'rgba(40,20,5,0.15)';
        ctx.lineWidth = 1;
        // Two grain lines per plank
        ctx.beginPath();
        ctx.moveTo(screenX + 2, py + plankH * 0.3 + grainOffset);
        ctx.lineTo(screenX + ts - 2, py + plankH * 0.35 + grainOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 2, py + plankH * 0.7 - grainOffset);
        ctx.lineTo(screenX + ts - 2, py + plankH * 0.65 - grainOffset);
        ctx.stroke();
        // Subtle knot
        if (tileHash(tileX, tileY, i + 960) > 0.7) {
          const kx = screenX + 5 + tileHash(tileX, tileY, i + 970) * (ts - 10);
          const ky = py + plankH / 2;
          ctx.fillStyle = 'rgba(30,15,5,0.2)';
          ctx.beginPath();
          ctx.ellipse(kx, ky, 3, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case TileType.SAND: {
      // Sand grain dots
      for (let i = 0; i < 8; i++) {
        const sx = tileHash(tileX, tileY, i + 1000);
        const sy = tileHash(tileX, tileY, i + 1010);
        const shade = 100 + Math.floor(sx * 40);
        ctx.fillStyle = `rgba(${shade + 20},${shade + 10},${shade - 30},0.3)`;
        ctx.fillRect(screenX + 2 + sx * (ts - 4), screenY + 2 + sy * (ts - 4), 1, 1);
      }
      // Occasional small rock
      if (tileHash(tileX, tileY, 1020) > 0.85) {
        const rx = screenX + 8 + tileHash(tileX, tileY, 1030) * 16;
        const ry = screenY + 8 + tileHash(tileX, tileY, 1040) * 16;
        ctx.fillStyle = '#5a5040';
        ctx.beginPath();
        ctx.ellipse(rx, ry, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Occasional tiny cactus
      if (tileHash(tileX, tileY, 1050) > 0.92) {
        const cax = screenX + ts / 2 + (tileHash(tileX, tileY, 1060) - 0.5) * 10;
        const cay = screenY + ts / 2 + (tileHash(tileX, tileY, 1070) - 0.5) * 10;
        ctx.fillStyle = '#2a5a1a';
        ctx.fillRect(cax - 1, cay - 4, 2, 8);
        ctx.fillRect(cax + 2, cay - 2, 3, 2);
        ctx.fillRect(cax - 5, cay - 1, 3, 2);
      }
      break;
    }

    default:
      break;
  }
}

// =============================================
// Player sprite rendering — Vocation-specific (Tibia Premium style)
// =============================================

interface VocationOutfit {
  // Body/armor colors
  bodyMain: string;       // primary body/armor color
  bodyDark: string;       // darker shade for depth
  bodyLight: string;      // highlight
  // Skin/hair
  skinColor: string;
  hairColor: string;
  // Legs
  legsColor: string;
  bootsColor: string;
  // Weapon colors
  weaponMetal: string;
  weaponHandle: string;
  weaponType: 'sword' | 'staff' | 'bow' | 'spear';
  // Shield
  hasShield: boolean;
  shieldColor: string;
  shieldTrim: string;
  // Head
  hasHelmet: boolean;
  helmetColor: string;
  helmetPlume: string;
  // Cape
  hasCape: boolean;
  capeColor: string;
  // Robe (for casters)
  hasRobe: boolean;
  robeColor: string;
  robeTrim: string;
  // Glow (for magic users)
  glowColor: string | null;
}

const VOCATION_OUTFITS: Record<string, VocationOutfit> = {
  [Vocation.KNIGHT]: {
    bodyMain: '#8a8a9a', bodyDark: '#5a5a6a', bodyLight: '#aaaabc',
    skinColor: '#f0c8a0', hairColor: '#4a3020',
    legsColor: '#6a6a7a', bootsColor: '#5a3a1a',
    weaponMetal: '#d0d0e0', weaponHandle: '#6a3a10', weaponType: 'sword',
    hasShield: true, shieldColor: '#7a7a8a', shieldTrim: '#DAA520',
    hasHelmet: true, helmetColor: '#7a7a8a', helmetPlume: '#cc2222',
    hasCape: true, capeColor: '#cc2222',
    hasRobe: false, robeColor: '', robeTrim: '',
    glowColor: null,
  },
  [Vocation.SORCERER]: {
    bodyMain: '#2a1a4a', bodyDark: '#1a0a2a', bodyLight: '#4a3a6a',
    skinColor: '#f0d0b0', hairColor: '#1a1a2a',
    legsColor: '#2a1a4a', bootsColor: '#3a2a1a',
    weaponMetal: '#8a6aff', weaponHandle: '#4a2a0a', weaponType: 'staff',
    hasShield: false, shieldColor: '', shieldTrim: '',
    hasHelmet: false, helmetColor: '', helmetPlume: '',
    hasCape: false, capeColor: '',
    hasRobe: true, robeColor: '#1a0a3a', robeTrim: '#8a6aff',
    glowColor: '#8a6aff',
  },
  [Vocation.DRUID]: {
    bodyMain: '#2a4a1a', bodyDark: '#1a3a0a', bodyLight: '#4a6a3a',
    skinColor: '#e8c898', hairColor: '#3a5a2a',
    legsColor: '#3a4a2a', bootsColor: '#5a4020',
    weaponMetal: '#8B4513', weaponHandle: '#3a2010', weaponType: 'staff',
    hasShield: false, shieldColor: '', shieldTrim: '',
    hasHelmet: false, helmetColor: '', helmetPlume: '',
    hasCape: false, capeColor: '',
    hasRobe: true, robeColor: '#1a3a0a', robeTrim: '#4a8a2a',
    glowColor: '#4aff4a',
  },
  [Vocation.PALADIN]: {
    bodyMain: '#3a6a3a', bodyDark: '#2a4a2a', bodyLight: '#5a8a5a',
    skinColor: '#f0c8a0', hairColor: '#6a4a20',
    legsColor: '#3a5a3a', bootsColor: '#4a3018',
    weaponMetal: '#c0c0c0', weaponHandle: '#5a3a10', weaponType: 'bow',
    hasShield: false, shieldColor: '', shieldTrim: '',
    hasHelmet: true, helmetColor: '#4a6a3a', helmetPlume: '#2a8a2a',
    hasCape: true, capeColor: '#2a6a2a',
    hasRobe: false, robeColor: '', robeTrim: '',
    glowColor: null,
  },
};

function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  direction: Direction,
  color: string,
  level: number,
  health: number,
  maxHealth: number,
  hasBuff: boolean,
  vocation?: Vocation
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;
  const facingSouth = direction === Direction.SOUTH;
  const facingNorth = direction === Direction.NORTH;
  const facingEast = direction === Direction.EAST;
  const facingWest = direction === Direction.WEST;
  const facingSide = facingEast || facingWest;
  const sideFlip = facingWest ? -1 : 1;

  // Pick outfit
  const effectiveVoc = vocation || Vocation.KNIGHT;
  const outfit = VOCATION_OUTFITS[effectiveVoc];
  const isCaster = effectiveVoc === Vocation.SORCERER || effectiveVoc === Vocation.DRUID;
  const isKnight = effectiveVoc === Vocation.KNIGHT;
  const isPaladin = effectiveVoc === Vocation.PALADIN;

  // ---- Try AI sprite first ----
  const playerSprites = PLAYER_SPRITES[effectiveVoc];
  if (playerSprites) {
    const spriteUrl = getSpriteForDirection(playerSprites, direction);
    const img = spriteCache[spriteUrl];
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, y + ts - 2, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Buff aura
      if (hasBuff) {
        const t = Date.now() / 300;
        ctx.strokeStyle = `rgba(255,165,0,${0.3 + Math.sin(t) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 16 + Math.sin(t) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Magic user glow
      if (outfit.glowColor) {
        const t = Date.now() / 400;
        const gc = outfit.glowColor;
        const r2 = parseInt(gc.slice(1, 3), 16) || 100;
        const g2 = parseInt(gc.slice(3, 5), 16) || 100;
        const b2 = parseInt(gc.slice(5, 7), 16) || 200;
        ctx.fillStyle = `rgba(${r2},${g2},${b2},${0.18 + Math.sin(t) * 0.12})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 16 + Math.sin(t) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the AI sprite (larger for better visibility, like Tibia characters)
      const spriteSize = ts + 16;
      const sx = cx - spriteSize / 2;
      const sy = cy - spriteSize / 2 - 4;
      // Subtle dark outline for contrast against tiles
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.drawImage(img, sx, sy, spriteSize, spriteSize);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Name
      drawPlayerLabels(ctx, cx, y, name, effectiveVoc, level, health, maxHealth);
      return;
    }
  }

  // ====== CANVAS FALLBACK (premium Tibia outfits) ======
  const time = Date.now() / 1000;
  const walkBob = Math.sin(time * 4) * 0.8; // subtle idle bob

  // ---- Buff aura ----
  if (hasBuff) {
    const t = Date.now() / 300;
    ctx.strokeStyle = `rgba(255,165,0,${0.3 + Math.sin(t) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + Math.sin(t) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- Magic user glow ----
  if (outfit.glowColor) {
    const t = Date.now() / 400;
    const gc = outfit.glowColor;
    const r2 = parseInt(gc.slice(1, 3), 16) || 100;
    const g2 = parseInt(gc.slice(3, 5), 16) || 100;
    const b2 = parseInt(gc.slice(5, 7), 16) || 200;
    ctx.fillStyle = `rgba(${r2},${g2},${b2},${0.18 + Math.sin(t) * 0.12})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + Math.sin(t) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Shadow ----
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ts - 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const by = cy + walkBob; // bobbing Y offset

  // ---- Cape (back layer, visible from north/side/south-back) ----
  if (outfit.hasCape) {
    ctx.fillStyle = outfit.capeColor;
    ctx.beginPath();
    if (facingNorth) {
      // Cape drapes down behind, wider
      ctx.moveTo(cx - 7, by - 4);
      ctx.quadraticCurveTo(cx - 10, by + 6, cx - 6, by + 13);
      ctx.lineTo(cx + 6, by + 13);
      ctx.quadraticCurveTo(cx + 10, by + 6, cx + 7, by - 4);
    } else if (facingSide) {
      const offX = facingWest ? 4 : -4;
      ctx.moveTo(cx + offX - 5, by - 4);
      ctx.quadraticCurveTo(cx + offX - 8, by + 5, cx + offX - 5, by + 13);
      ctx.lineTo(cx + offX + 5, by + 13);
      ctx.quadraticCurveTo(cx + offX + 4, by + 5, cx + offX + 4, by - 4);
    } else {
      // South - cape peek behind shoulders
      ctx.moveTo(cx - 6, by - 5);
      ctx.quadraticCurveTo(cx - 8, by + 2, cx - 5, by + 10);
      ctx.lineTo(cx - 2, by + 10);
      ctx.quadraticCurveTo(cx - 3, by + 2, cx - 2, by - 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 2, by - 5);
      ctx.quadraticCurveTo(cx + 3, by + 2, cx + 2, by + 10);
      ctx.lineTo(cx + 5, by + 10);
      ctx.quadraticCurveTo(cx + 8, by + 2, cx + 6, by - 5);
    }
    ctx.fill();
    // Cape inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();
    // Cape gold clasp at top (for paladin)
    if (isPaladin && facingNorth) {
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(cx, by - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Robe (caster back layer) ----
  if (outfit.hasRobe) {
    ctx.fillStyle = outfit.robeColor;
    ctx.beginPath();
    if (facingSouth) {
      ctx.moveTo(cx - 8, by - 3);
      ctx.lineTo(cx - 10, by + 13);
      ctx.lineTo(cx + 10, by + 13);
      ctx.lineTo(cx + 8, by - 3);
    } else if (facingNorth) {
      ctx.moveTo(cx - 8, by - 3);
      ctx.lineTo(cx - 9, by + 14);
      ctx.lineTo(cx + 9, by + 14);
      ctx.lineTo(cx + 8, by - 3);
    } else {
      const rx = facingWest ? -3 : 3;
      ctx.moveTo(cx + rx - 7, by - 3);
      ctx.lineTo(cx + rx - 9, by + 14);
      ctx.lineTo(cx + rx + 7, by + 14);
      ctx.lineTo(cx + rx + 6, by - 3);
    }
    ctx.fill();
    // Robe trim at bottom (double line for premium feel)
    ctx.strokeStyle = outfit.robeTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (facingSouth || facingNorth) {
      ctx.moveTo(cx - 10, by + 13);
      ctx.lineTo(cx + 10, by + 13);
    } else {
      const rx = facingWest ? -3 : 3;
      ctx.moveTo(cx + rx - 9, by + 14);
      ctx.lineTo(cx + rx + 7, by + 14);
    }
    ctx.stroke();
    // Second trim line
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (facingSouth || facingNorth) {
      ctx.moveTo(cx - 9, by + 11);
      ctx.lineTo(cx + 9, by + 11);
    } else {
      const rx = facingWest ? -3 : 3;
      ctx.moveTo(cx + rx - 8, by + 12);
      ctx.lineTo(cx + rx + 6, by + 12);
    }
    ctx.stroke();
    // Robe center line
    ctx.strokeStyle = `${outfit.robeTrim}55`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, by - 1);
    ctx.lineTo(cx, by + 13);
    ctx.stroke();
    // Arcane runes on robe (for sorcerer)
    if (effectiveVoc === Vocation.SORCERER && facingSouth) {
      ctx.fillStyle = '#8a6aff66';
      ctx.beginPath();
      ctx.arc(cx - 4, by + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, by + 8, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 5, by + 3, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Vine pattern on druid robe
    if (effectiveVoc === Vocation.DRUID && facingSouth) {
      ctx.strokeStyle = '#4a8a2a44';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 2, by + 2);
      ctx.quadraticCurveTo(cx - 4, by + 6, cx - 1, by + 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 2, by + 3);
      ctx.quadraticCurveTo(cx + 4, by + 7, cx + 2, by + 10);
      ctx.stroke();
    }
  }

  // ---- Legs/boots ----
  if (!outfit.hasRobe || facingSouth) {
    const legSpread = facingSide ? 1 : 2;
    // Left leg
    ctx.fillStyle = outfit.legsColor;
    ctx.fillRect(cx - 5 - legSpread, by + 4, 5, 8);
    // Right leg
    ctx.fillRect(cx + legSpread, by + 4, 5, 8);
    // Leg armor lines (knight)
    if (isKnight) {
      ctx.strokeStyle = '#9a9aaa55';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5 - legSpread, by + 7);
      ctx.lineTo(cx - legSpread, by + 7);
      ctx.moveTo(cx + legSpread, by + 7);
      ctx.lineTo(cx + 5 + legSpread, by + 7);
      ctx.stroke();
    }
    // Boots - more detailed
    ctx.fillStyle = outfit.bootsColor;
    // Left boot
    ctx.fillRect(cx - 5 - legSpread, by + 10, 5, 3);
    ctx.fillRect(cx - 6 - legSpread, by + 11, 7, 2); // boot wider at bottom
    // Right boot
    ctx.fillRect(cx + legSpread, by + 10, 5, 3);
    ctx.fillRect(cx - 1 + legSpread, by + 11, 7, 2);
    // Boot straps
    if (isKnight || isPaladin) {
      ctx.strokeStyle = '#3a2a1055';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5 - legSpread, by + 11);
      ctx.lineTo(cx - legSpread, by + 11);
      ctx.moveTo(cx + legSpread, by + 11);
      ctx.lineTo(cx + 5 + legSpread, by + 11);
      ctx.stroke();
    }
  } else {
    // Robe covers legs, just show boot tips
    ctx.fillStyle = outfit.bootsColor;
    ctx.fillRect(cx - 5, by + 11, 4, 2);
    ctx.fillRect(cx + 1, by + 11, 4, 2);
  }

  // ---- Body / Armor ----
  // Darker armor underlayer
  ctx.fillStyle = outfit.bodyDark;
  if (outfit.hasRobe) {
    ctx.beginPath();
    ctx.ellipse(cx, by + 1, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(cx - 8, by - 6, 16, 13);
  }
  // Main armor/body
  ctx.fillStyle = outfit.bodyMain;
  if (outfit.hasRobe) {
    ctx.beginPath();
    ctx.ellipse(cx, by, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robe collar
    ctx.strokeStyle = outfit.robeTrim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, by - 3, 6, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  } else {
    ctx.fillRect(cx - 7, by - 5, 14, 11);
    // Armor highlight on chest
    ctx.fillStyle = outfit.bodyLight;
    ctx.fillRect(cx - 5, by - 4, 3, 6);

    // Knight: segmented plate armor
    if (isKnight) {
      // Chest plate segments
      ctx.strokeStyle = '#9a9aaa';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - 6, by - 2);
      ctx.lineTo(cx + 6, by - 2);
      ctx.moveTo(cx - 6, by + 1);
      ctx.lineTo(cx + 6, by + 1);
      ctx.stroke();
      // Center rivet line
      ctx.fillStyle = '#DAA52088';
      ctx.fillRect(cx - 0.5, by - 4, 1, 9);
      // Side rivets
      ctx.beginPath();
      ctx.arc(cx - 5, by - 3, 0.7, 0, Math.PI * 2);
      ctx.arc(cx - 5, by + 2, 0.7, 0, Math.PI * 2);
      ctx.arc(cx + 5, by - 3, 0.7, 0, Math.PI * 2);
      ctx.arc(cx + 5, by + 2, 0.7, 0, Math.PI * 2);
      ctx.fill();
      // Belt with golden buckle
      ctx.fillStyle = '#4a2a0a';
      ctx.fillRect(cx - 7, by + 4, 14, 3);
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(cx - 7, by + 4, 14, 3);
      // Belt buckle
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(cx - 2, by + 4.5, 4, 2);
      ctx.fillStyle = '#4a2a0a';
      ctx.fillRect(cx - 0.5, by + 5, 1, 1);
    }

    // Paladin: leather armor with emblem
    if (isPaladin) {
      // Studded leather lines
      ctx.strokeStyle = '#2a4a2a';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, by - 2);
      ctx.lineTo(cx + 6, by - 2);
      ctx.moveTo(cx - 6, by + 1);
      ctx.lineTo(cx + 6, by + 1);
      ctx.stroke();
      // Chest emblem (gold sun/cross)
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(cx, by - 1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a4a2a';
      ctx.beginPath();
      ctx.arc(cx, by - 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(cx - 0.5, by - 3.5, 1, 5);
      ctx.fillRect(cx - 2.5, by - 1.5, 5, 1);
      // Belt
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(cx - 7, by + 4, 14, 2.5);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(cx - 1.5, by + 4.2, 3, 2);
    }
  }

  // ---- Shoulder Pauldrons (Knight) ----
  if (isKnight && !facingNorth) {
    ctx.fillStyle = outfit.bodyMain;
    ctx.strokeStyle = outfit.bodyLight;
    ctx.lineWidth = 0.5;
    // Left pauldron
    if (!facingSide || facingEast) {
      ctx.beginPath();
      ctx.ellipse(cx - 8, by - 4, 4, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Pauldron rivet
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(cx - 8, by - 4, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Right pauldron
    if (!facingSide || facingWest) {
      ctx.fillStyle = outfit.bodyMain;
      ctx.beginPath();
      ctx.ellipse(cx + 8, by - 4, 4, 3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = outfit.bodyLight;
      ctx.stroke();
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(cx + 8, by - 4, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Arms ----
  const armY = by - 2;
  ctx.fillStyle = outfit.bodyMain;
  if (facingSide) {
    ctx.fillRect(cx + sideFlip * 7, armY, 4, 9);
    ctx.fillStyle = outfit.bodyDark;
    ctx.fillRect(cx - sideFlip * 5, armY, 3, 8);
  } else {
    ctx.fillRect(cx - 10, armY, 3, 9);
    ctx.fillRect(cx + 7, armY, 3, 9);
  }
  // Gauntlets/Bracers
  if (isKnight) {
    ctx.fillStyle = '#8a8a9a';
    if (facingSide) {
      ctx.fillRect(cx + sideFlip * 7, armY + 6, 4, 3);
    } else {
      ctx.fillRect(cx - 10, armY + 6, 3, 3);
      ctx.fillRect(cx + 7, armY + 6, 3, 3);
    }
  }
  if (isPaladin) {
    ctx.fillStyle = '#3a4a2a';
    if (facingSide) {
      ctx.fillRect(cx + sideFlip * 7, armY + 5, 4, 2);
    } else {
      ctx.fillRect(cx - 10, armY + 5, 3, 2);
      ctx.fillRect(cx + 7, armY + 5, 3, 2);
    }
  }
  // Hands (skin)
  ctx.fillStyle = outfit.skinColor;
  if (facingSide) {
    ctx.fillRect(cx + sideFlip * 7, armY + 7, 4, 3);
  } else {
    ctx.fillRect(cx - 10, armY + 7, 3, 3);
    ctx.fillRect(cx + 7, armY + 7, 3, 3);
  }

  // ---- Shield (Knight) ----
  if (outfit.hasShield) {
    const shX = facingSide ? cx - sideFlip * 12 : cx - 12;
    const shY = by - 2;
    // Shield body - larger, more detailed
    ctx.fillStyle = outfit.shieldColor;
    ctx.beginPath();
    ctx.moveTo(shX - 5, shY - 6);
    ctx.lineTo(shX + 5, shY - 6);
    ctx.lineTo(shX + 5, shY + 4);
    ctx.lineTo(shX, shY + 8);
    ctx.lineTo(shX - 5, shY + 4);
    ctx.closePath();
    ctx.fill();
    // Shield border - double
    ctx.strokeStyle = outfit.shieldTrim;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = outfit.shieldTrim + '88';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(shX - 3.5, shY - 4.5);
    ctx.lineTo(shX + 3.5, shY - 4.5);
    ctx.lineTo(shX + 3.5, shY + 3);
    ctx.lineTo(shX, shY + 6);
    ctx.lineTo(shX - 3.5, shY + 3);
    ctx.closePath();
    ctx.stroke();
    // Shield cross emblem
    ctx.strokeStyle = outfit.shieldTrim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(shX, shY - 4);
    ctx.lineTo(shX, shY + 6);
    ctx.moveTo(shX - 3, shY - 0.5);
    ctx.lineTo(shX + 3, shY - 0.5);
    ctx.stroke();
    // Shield highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(shX - 3, shY - 5, 3, 5);
    // Center gem
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.arc(shX, shY - 0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(shX - 0.3, shY - 1, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Quiver (Paladin, on back) ----
  if (isPaladin && (facingNorth || (facingSide && facingEast))) {
    const qX = facingNorth ? cx + 3 : cx + sideFlip * 2;
    const qY = by - 4;
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(qX - 2, qY, 5, 12);
    ctx.strokeStyle = '#3a2010';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(qX - 2, qY, 5, 12);
    // Arrow fletchings sticking out
    ctx.fillStyle = '#cc4444';
    ctx.fillRect(qX - 1, qY - 3, 1, 4);
    ctx.fillRect(qX + 1, qY - 4, 1, 5);
    ctx.fillRect(qX + 0, qY - 2, 1, 3);
    // Arrow tips
    ctx.fillStyle = '#aaa';
    ctx.fillRect(qX - 1, qY + 10, 1, 3);
    ctx.fillRect(qX + 1, qY + 11, 1, 2);
  }

  // ---- Weapon ----
  const weaponX = facingSide ? cx + sideFlip * 12 : cx + 12;
  const weaponY = by - 2;
  ctx.save();
  ctx.translate(weaponX, weaponY);

  if (outfit.weaponType === 'sword') {
    const swAngle = facingSouth ? Math.PI / 2 : facingNorth ? -Math.PI / 2 : facingEast ? 0 : Math.PI;
    ctx.rotate(swAngle);
    // Blade - wider, more detailed
    ctx.fillStyle = outfit.weaponMetal;
    ctx.beginPath();
    ctx.moveTo(-1.5, -14);
    ctx.lineTo(1.5, -14);
    ctx.lineTo(2, 0);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.fill();
    // Blade tip
    ctx.beginPath();
    ctx.moveTo(-1.5, -14);
    ctx.lineTo(0, -19);
    ctx.lineTo(1.5, -14);
    ctx.fill();
    // Blade center line (fuller)
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-0.5, -18, 1, 16);
    // Blade edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-1.5, -13, 0.8, 12);
    // Crossguard - ornate
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(-4, -1, 9, 2.5);
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(-3.5, -0.5, 8, 1.5);
    // Handle - wrapped leather
    ctx.fillStyle = outfit.weaponHandle;
    ctx.fillRect(-2, 1.5, 5, 5);
    // Handle wrap
    ctx.strokeStyle = '#4a2a0a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-2, 3); ctx.lineTo(3, 3);
    ctx.moveTo(-2, 5); ctx.lineTo(3, 5);
    ctx.stroke();
    // Pommel - ornate
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.arc(0.5, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.arc(0.5, 7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (outfit.weaponType === 'staff') {
    // Staff body - wooden
    ctx.fillStyle = effectiveVoc === Vocation.SORCERER ? '#3a2060' : '#5a3a18';
    ctx.fillRect(-2, -16, 4, 24);
    // Staff highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-0.5, -15, 1, 22);
    // Staff wrapping
    ctx.strokeStyle = effectiveVoc === Vocation.SORCERER ? '#8a6aff44' : '#4a8a2a44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -8); ctx.lineTo(2, -8);
    ctx.moveTo(-2, -4); ctx.lineTo(2, -4);
    ctx.moveTo(-2, 0); ctx.lineTo(2, 0);
    ctx.moveTo(-2, 4); ctx.lineTo(2, 4);
    ctx.stroke();
    // Orb on top with glow
    const orbColor = effectiveVoc === Vocation.SORCERER ? '#8a6aff' : '#4aff4a';
    const orbR = effectiveVoc === Vocation.SORCERER ? '138,106,255' : '74,255,74';
    const t = Date.now() / 400;
    // Outer glow
    ctx.fillStyle = `rgba(${orbR},${0.12 + Math.sin(t) * 0.08})`;
    ctx.beginPath();
    ctx.arc(0, -17, 8, 0, Math.PI * 2);
    ctx.fill();
    // Inner glow
    ctx.fillStyle = `rgba(${orbR},${0.2 + Math.sin(t) * 0.1})`;
    ctx.beginPath();
    ctx.arc(0, -17, 5, 0, Math.PI * 2);
    ctx.fill();
    // Orb
    ctx.fillStyle = orbColor;
    ctx.beginPath();
    ctx.arc(0, -17, 4, 0, Math.PI * 2);
    ctx.fill();
    // Orb bright center
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 2) * 0.2})`;
    ctx.beginPath();
    ctx.arc(-1, -18, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Floating particles
    for (let i = 0; i < 3; i++) {
      const px = Math.sin(time * 2 + i * 2.1) * 6;
      const py = -17 + Math.cos(time * 1.5 + i * 1.7) * 5;
      ctx.fillStyle = `rgba(${orbR},0.5)`;
      ctx.beginPath();
      ctx.arc(px, py, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (outfit.weaponType === 'bow') {
    // Crossbow body
    ctx.strokeStyle = '#6a3a18';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sideFlip * 3, -2, 11, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();
    // Crossbow prod (metal arms)
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sideFlip * 3, -2, 12, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();
    // Crossbow mechanism
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sideFlip * -1, -4, sideFlip * 4, 3);
    // Bowstring
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const bTop = -2 + Math.sin(-Math.PI / 2.5) * 11;
    const bBot = -2 + Math.sin(Math.PI / 2.5) * 11;
    ctx.moveTo(sideFlip * 3 + Math.cos(-Math.PI / 2.5) * 11, bTop);
    ctx.lineTo(sideFlip * -1, -2.5);
    ctx.lineTo(sideFlip * 3 + Math.cos(Math.PI / 2.5) * 11, bBot);
    ctx.stroke();
    // Arrow loaded
    if (facingSouth || facingSide) {
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(-0.5, -20, 1.2, 14);
      // Arrowhead
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(-2, -20);
      ctx.lineTo(0.5, -24);
      ctx.lineTo(3, -20);
      ctx.fill();
      // Fletching
      ctx.fillStyle = '#cc4444';
      ctx.beginPath();
      ctx.moveTo(-1.5, -7);
      ctx.lineTo(0.5, -9);
      ctx.lineTo(2.5, -7);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-1, -5);
      ctx.lineTo(0.5, -7);
      ctx.lineTo(2, -5);
      ctx.fill();
    }
  }

  ctx.restore();

  // ---- Head ----
  const headY = by - 10;
  const headX = facingSide ? cx + sideFlip * 1 : cx;

  // Helmet
  if (outfit.hasHelmet) {
    if (isKnight) {
      // Full plate helmet with T-visor
      ctx.fillStyle = outfit.helmetColor;
      if (facingSouth) {
        // Helmet dome
        ctx.beginPath();
        ctx.arc(cx, headY, 7.5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - 7.5, headY, 15, 3);
        // Visor slit (T-shape)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - 5, headY - 2, 10, 2);
        ctx.fillRect(cx - 1, headY - 5, 2, 3);
        // Visor frame
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx - 5.5, headY - 2.5, 11, 3);
        // Plume base
        ctx.fillStyle = '#6a3a10';
        ctx.fillRect(cx - 1.5, headY - 8, 3, 3);
        // Plume feathers
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(cx, headY - 8);
        ctx.quadraticCurveTo(cx + 8, headY - 14, cx + 3, headY - 17);
        ctx.quadraticCurveTo(cx + 1, headY - 13, cx - 1, headY - 17);
        ctx.quadraticCurveTo(cx - 7, headY - 14, cx, headY - 8);
        ctx.fill();
        // Plume highlight
        ctx.fillStyle = '#ff444444';
        ctx.beginPath();
        ctx.moveTo(cx + 1, headY - 9);
        ctx.quadraticCurveTo(cx + 5, headY - 13, cx + 2, headY - 15);
        ctx.quadraticCurveTo(cx + 1, headY - 11, cx + 1, headY - 9);
        ctx.fill();
        // Helmet rivets
        ctx.fillStyle = '#DAA52066';
        ctx.beginPath();
        ctx.arc(cx - 6, headY, 0.8, 0, Math.PI * 2);
        ctx.arc(cx + 6, headY, 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (facingNorth) {
        ctx.beginPath();
        ctx.arc(cx, headY, 7.5, 0, Math.PI);
        ctx.fill();
        ctx.fillRect(cx - 7.5, headY - 3, 15, 3);
        // Plume from behind - flowing
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(cx - 4, headY + 2);
        ctx.quadraticCurveTo(cx - 10, headY - 6, cx, headY - 10);
        ctx.quadraticCurveTo(cx + 10, headY - 6, cx + 4, headY + 2);
        ctx.fill();
        ctx.fillStyle = '#ff444433';
        ctx.beginPath();
        ctx.moveTo(cx - 2, headY);
        ctx.quadraticCurveTo(cx - 6, headY - 5, cx, headY - 8);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(headX, headY, 7.5, 0, Math.PI * 2);
        ctx.fill();
        // Side visor slit
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(headX + sideFlip * 2, headY - 2, 4, 2);
        // Plume
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(headX, headY - 7.5);
        ctx.quadraticCurveTo(headX + sideFlip * 10, headY - 14, headX + sideFlip * 5, headY - 17);
        ctx.quadraticCurveTo(headX + sideFlip * 2, headY - 12, headX, headY - 7.5);
        ctx.fill();
      }
    } else if (isPaladin) {
      // Ranger hood/helmet
      ctx.fillStyle = outfit.helmetColor;
      if (facingSouth) {
        ctx.beginPath();
        ctx.arc(cx, headY, 7, Math.PI * 1.1, Math.PI * 1.9);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, headY - 1, 7.5, Math.PI, 0);
        ctx.fill();
        // Face opening (hood frame)
        ctx.strokeStyle = '#2a4a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, headY + 1, 5.5, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        // Green plume/feather
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(cx, headY - 7);
        ctx.quadraticCurveTo(cx + 7, headY - 13, cx + 3, headY - 15);
        ctx.quadraticCurveTo(cx, headY - 11, cx - 2, headY - 15);
        ctx.quadraticCurveTo(cx - 6, headY - 13, cx, headY - 7);
        ctx.fill();
      } else if (facingNorth) {
        ctx.beginPath();
        ctx.arc(cx, headY, 8, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(cx - 3, headY + 2);
        ctx.quadraticCurveTo(cx - 8, headY - 4, cx, headY - 8);
        ctx.quadraticCurveTo(cx + 8, headY - 4, cx + 3, headY + 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(headX, headY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = outfit.helmetPlume;
        ctx.beginPath();
        ctx.moveTo(headX, headY - 7);
        ctx.quadraticCurveTo(headX + sideFlip * 9, headY - 13, headX + sideFlip * 4, headY - 15);
        ctx.fill();
      }
    }
  } else {
    // Head (skin)
    ctx.fillStyle = outfit.skinColor;
    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = outfit.hairColor;
    if (facingSouth) {
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 6, Math.PI * 1.05, Math.PI * 1.95);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX, headY - 2, 6.5, Math.PI, 0);
      ctx.fill();
    } else if (facingNorth) {
      ctx.beginPath();
      ctx.arc(headX, headY, 7.5, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(headX, headY - 1, 6.5, Math.PI * 0.7, Math.PI * 2.3);
      ctx.fill();
    }

    // Eyes
    if (facingSouth) {
      ctx.fillStyle = '#222';
      ctx.fillRect(headX - 3, headY - 1, 2, 2);
      ctx.fillRect(headX + 1, headY - 1, 2, 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(headX - 2.5, headY - 0.5, 1, 1);
      ctx.fillRect(headX + 1.5, headY - 0.5, 1, 1);
      // Mouth
      ctx.fillStyle = '#c8a080';
      ctx.fillRect(headX - 1, headY + 2, 2, 0.8);
    } else if (facingEast) {
      ctx.fillStyle = '#222';
      ctx.fillRect(headX + 1, headY - 1, 2, 2);
    } else if (facingWest) {
      ctx.fillStyle = '#222';
      ctx.fillRect(headX - 3, headY - 1, 2, 2);
    }

    // Sorcerer: Wizard Hat
    if (effectiveVoc === Vocation.SORCERER) {
      const hatColor = '#1a0a3a';
      const hatTrim = '#8a6aff';
      // Hat brim
      ctx.fillStyle = hatColor;
      ctx.beginPath();
      ctx.ellipse(headX, headY - 5, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hat cone
      ctx.beginPath();
      ctx.moveTo(headX - 7, headY - 5);
      ctx.lineTo(headX + 2, headY - 18);
      ctx.lineTo(headX + 7, headY - 5);
      ctx.fill();
      // Hat bend (slightly curved tip)
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY - 18);
      ctx.quadraticCurveTo(headX + 6, headY - 20, headX + 5, headY - 16);
      ctx.fill();
      // Hat band
      ctx.fillStyle = hatTrim;
      ctx.fillRect(headX - 7, headY - 6.5, 14, 2);
      // Stars on hat
      ctx.fillStyle = '#DAA52088';
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 12, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + 3, headY - 9, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX - 4, headY - 8, 0.6, 0, Math.PI * 2);
      ctx.fill();
      // Hat trim gold edge
      ctx.strokeStyle = '#DAA52066';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(headX, headY - 5, 10, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Druid: Hood with leaf ornament
    if (effectiveVoc === Vocation.DRUID) {
      ctx.fillStyle = outfit.bodyDark;
      if (facingSouth) {
        ctx.beginPath();
        ctx.arc(headX, headY + 1, 8, Math.PI * 0.1, Math.PI * 0.9);
        ctx.fill();
        // Hood point
        ctx.beginPath();
        ctx.moveTo(headX - 7, headY - 2);
        ctx.lineTo(headX, headY - 10);
        ctx.lineTo(headX + 7, headY - 2);
        ctx.fill();
        // Leaf ornament on hood
        ctx.fillStyle = '#4a8a2a';
        ctx.beginPath();
        ctx.ellipse(headX, headY - 10, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6aaa3a';
        ctx.beginPath();
        ctx.ellipse(headX + 0.5, headY - 11, 1, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Vine trim on hood edge
        ctx.strokeStyle = '#4a8a2a88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(headX, headY + 1, 7.5, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      } else if (facingNorth) {
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI);
        ctx.fill();
        // Hood point from behind
        ctx.beginPath();
        ctx.moveTo(headX - 6, headY - 3);
        ctx.lineTo(headX, headY - 11);
        ctx.lineTo(headX + 6, headY - 3);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#4a8a2a';
        ctx.beginPath();
        ctx.ellipse(headX, headY - 11, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI);
        ctx.fill();
        // Hood point
        ctx.beginPath();
        ctx.moveTo(headX - 5, headY - 3);
        ctx.lineTo(headX, headY - 11);
        ctx.lineTo(headX + 5, headY - 3);
        ctx.fill();
        // Leaf
        ctx.fillStyle = '#4a8a2a';
        ctx.beginPath();
        ctx.ellipse(headX + sideFlip * 1, headY - 11, 2, 4, sideFlip * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---- Draw labels (shared) ----
  drawPlayerLabels(ctx, cx, y, name, effectiveVoc, level, health, maxHealth);
}

// =============================================
// Player name/vocation/health labels (shared by sprite & canvas)
// =============================================
function drawPlayerLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  name: string,
  vocation: Vocation,
  level: number,
  health: number,
  maxHealth: number,
) {
  // Name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.strokeText(name, cx, y - 8);
  ctx.fillText(name, cx, y - 8);

  // Vocation label with colored background pill
  if (vocation) {
    const label = `${vocation} Lv.${level}`;
    ctx.font = '7px monospace';
    const vColor = vocation === Vocation.KNIGHT ? '#e74c3c' : vocation === Vocation.SORCERER ? '#9b59b6' : vocation === Vocation.DRUID ? '#2ecc71' : '#f1c40f';
    const tw = ctx.measureText(label).width;
    // Pill background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.rect(cx - tw / 2 - 3, y - 5, tw + 6, 10);
    ctx.fill();
    // Text
    ctx.fillStyle = vColor;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeText(label, cx, y + 2);
    ctx.fillText(label, cx, y + 2);
  } else {
    ctx.font = '7px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.strokeText(`Lv.${level}`, cx, y + 2);
    ctx.fillText(`Lv.${level}`, cx, y + 2);
  }

  // Health bar (shown when damaged)
  if (health < maxHealth) {
    const barWidth = 30;
    const barHeight = 3;
    const barX = cx - barWidth / 2;
    const barY = y - 3;
    // Background
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.rect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    ctx.fill();
    // Empty bar
    ctx.fillStyle = '#111';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // Health fill
    const hpPercent = health / maxHealth;
    ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barWidth * hpPercent, 1);
  }
}

// =============================================
// Monster rendering
// =============================================
function drawMonster(
  ctx: CanvasRenderingContext2D,
  name: string,
  monsterId: string,
  color: string,
  _icon: string,
  x: number,
  y: number,
  health: number,
  maxHealth: number,
  sprites?: MonsterSpriteSet,
  direction?: Direction,
  lastHitTime?: number
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ts - 3, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Try to draw sprite image if available
  if (sprites && direction !== undefined) {
    const spriteUrl = getSpriteForDirection(sprites, direction);
    const img = spriteCache[spriteUrl];
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw the sprite centered on the tile
      const spriteSize = ts + 4; // slightly larger than tile
      const sx = cx - spriteSize / 2;
      const sy = cy - spriteSize / 2 - 2;
      ctx.drawImage(img, sx, sy, spriteSize, spriteSize);
    } else {
      // Fallback to creature drawing while loading
      drawMonsterFallback(ctx, cx, cy, color, monsterId, direction);
    }
  } else {
    // No sprites — draw creature shape
    drawMonsterFallback(ctx, cx, cy, color, monsterId, direction);
  }

  // Hit flash overlay
  if (lastHitTime) {
    const flashElapsed = Date.now() - lastHitTime;
    if (flashElapsed < 150) {
      const flashAlpha = 0.6 * (1 - flashElapsed / 150);
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#ffffff';
      if (sprites && direction !== undefined) {
        const spriteSize = ts + 4;
        ctx.fillRect(cx - spriteSize / 2, cy - spriteSize / 2 - 2, spriteSize, spriteSize);
      } else {
        ctx.beginPath();
        ctx.rect(cx - 12, cy - 10, 24, 22);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }
  }

  // Name
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(name, cx, y - 6);
  ctx.fillText(name, cx, y - 6);

  // Health bar
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

function drawMonsterFallback(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  monsterId?: string,
  direction?: Direction
) {
  if (monsterId && direction !== undefined) {
    drawMonsterCreature(ctx, monsterId, cx, cy, direction);
    return;
  }
  // Ultimate fallback for unknown monsters
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(cx - 10, cy - 6, 20, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx - 4, cy, 2, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2);
  ctx.fill();
}

// =============================================
// NPC rendering
// =============================================
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

// =============================================
// Damage number rendering
// =============================================
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

// =============================================
// Spell effect rendering
// =============================================
function renderSpellEffects(
  ctx: CanvasRenderingContext2D,
  effects: SpellEffect[],
  camX: number,
  camY: number
) {
  const now = Date.now();

  for (const ef of effects) {
    const elapsed = now - ef.startTime;
    const progress = Math.min(1, elapsed / ef.duration);
    const alpha = 1 - progress;

    const sx = ef.position.x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const sy = ef.position.y * TILE_SIZE + TILE_SIZE / 2 - camY;

    switch (ef.type) {
      case 'sword_slash': {
        // Arc slash animation
        const dir = ef.direction ?? Direction.SOUTH;
        const baseAngle = dir === Direction.NORTH ? -Math.PI / 2 : dir === Direction.SOUTH ? Math.PI / 2 : dir === Direction.EAST ? 0 : Math.PI;
        const swingAngle = baseAngle - 0.8 + progress * 1.6;
        const radius = 18 + progress * 8;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = ef.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, swingAngle - 0.8, swingAngle + 0.2);
        ctx.stroke();

        // Second trail
        ctx.globalAlpha = alpha * 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, radius - 4, swingAngle - 0.6, swingAngle);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'projectile': {
        // Traveling projectile (fireball, energy beam)
        if (!ef.targetPosition || !ef.direction) break;
        const tx = ef.targetPosition.x * TILE_SIZE + TILE_SIZE / 2 - camX;
        const ty = ef.targetPosition.y * TILE_SIZE + TILE_SIZE / 2 - camY;

        const projX = sx + (tx - sx) * progress;
        const projY = sy + (ty - sy) * progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Trail
        const trailLen = 5;
        for (let i = 0; i < trailLen; i++) {
          const t = Math.max(0, progress - i * 0.08);
          const trailX = sx + (tx - sx) * t;
          const trailY = sy + (ty - sy) * t;
          ctx.globalAlpha = alpha * (1 - i / trailLen) * 0.4;
          ctx.fillStyle = ef.color;
          ctx.beginPath();
          ctx.arc(trailX, trailY, 6 - i, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main projectile
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ef.color;
        ctx.shadowColor = ef.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(projX, projY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(projX, projY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Explosion on impact
        if (progress > 0.85) {
          const expProgress = (progress - 0.85) / 0.15;
          ctx.globalAlpha = (1 - expProgress) * 0.8;
          ctx.fillStyle = ef.color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(tx, ty, 10 + expProgress * 20, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        break;
      }

      case 'explosion': {
        if (!ef.targetPosition) break;
        const tx = ef.targetPosition.x * TILE_SIZE + TILE_SIZE / 2 - camX;
        const ty = ef.targetPosition.y * TILE_SIZE + TILE_SIZE / 2 - camY;

        ctx.save();
        // Expanding ring
        const radius = 5 + progress * 25;
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = ef.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner flash
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(tx, ty, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Particles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const px = tx + Math.cos(angle) * radius * 1.2;
          const py = ty + Math.sin(angle) * radius * 1.2;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = ef.color;
          ctx.beginPath();
          ctx.arc(px, py, 3 * (1 - progress), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'heal_aura': {
        ctx.save();
        // Green rising particles
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + progress * 0.5;
          const radius = 10 + progress * 15;
          const px = sx + Math.cos(angle) * radius;
          const py = sy + Math.sin(angle) * radius - progress * 20;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillStyle = ef.color;
          ctx.shadowColor = ef.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cross healing symbol
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 8);
        ctx.lineTo(sx, sy + 8);
        ctx.moveTo(sx - 8, sy);
        ctx.lineTo(sx + 8, sy);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'whirlwind': {
        ctx.save();
        const spinAngle = progress * Math.PI * 4;
        const radius = 12 + progress * 20;

        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = ef.color;
        ctx.shadowBlur = 8;

        // Spinning arcs
        for (let a = 0; a < 3; a++) {
          const arcStart = spinAngle + (a * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(sx, sy, radius, arcStart, arcStart + Math.PI * 0.5);
          ctx.stroke();
        }

        // Center flash
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = ef.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'lightning': {
        if (!ef.targetPosition) break;
        const tx = ef.targetPosition.x * TILE_SIZE + TILE_SIZE / 2 - camX;
        const ty = ef.targetPosition.y * TILE_SIZE + TILE_SIZE / 2 - camY;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Lightning bolt (jagged line)
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;

        const segments = 6;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 20);
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const lx = sx + (tx - sx) * t + (Math.random() - 0.5) * 15 * (1 - Math.abs(t - 0.5) * 2);
          const ly = sy + (ty - sy) * t + (Math.random() - 0.5) * 15 * (1 - Math.abs(t - 0.5) * 2);
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();

        // Bright core
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Impact flash
        if (progress > 0.5) {
          const flashP = (progress - 0.5) / 0.5;
          ctx.globalAlpha = (1 - flashP) * 0.8;
          ctx.fillStyle = '#f1c40f';
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(tx, ty, 15 + flashP * 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'earthquake': {
        ctx.save();
        const radius = 10 + progress * 40;
        ctx.globalAlpha = alpha * 0.5;

        // Shockwave rings
        for (let r = 0; r < 3; r++) {
          const ringRadius = radius * (0.5 + r * 0.3);
          ctx.strokeStyle = ef.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ground cracks (lines radiating out)
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const len = radius * (0.5 + Math.random() * 0.5);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'war_cry': {
        ctx.save();
        const radius = 10 + progress * 30;

        // Expanding sound wave rings
        for (let i = 0; i < 3; i++) {
          const ringR = radius * (0.6 + i * 0.2);
          ctx.globalAlpha = alpha * (0.4 - i * 0.1);
          ctx.strokeStyle = ef.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // "POW" text effect
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ef.color;
        ctx.font = `bold ${14 + progress * 6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = ef.color;
        ctx.shadowBlur = 10;
        ctx.fillText('ATK UP!', sx, sy - 20 - progress * 10);
        ctx.restore();
        break;
      }
    }
  }
}

// =============================================
// Level up celebration rendering
// =============================================
function renderLevelUpCelebration(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  levelUpTime: number,
  playerScreenX: number,
  playerScreenY: number
) {
  const elapsed = Date.now() - levelUpTime;
  if (elapsed > 2500) return;

  const progress = elapsed / 2500;
  const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

  ctx.save();

  // === In-world effects centered on the player ===
  const pcx = playerScreenX + TILE_SIZE / 2;
  const pcy = playerScreenY + TILE_SIZE / 2;

  // Expanding golden ring (0 to 60px over 2 seconds, fading out)
  if (elapsed < 2000) {
    const ringProgress = elapsed / 2000;
    const ringRadius = ringProgress * 60;
    const ringAlpha = 1 - ringProgress;
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3 * (1 - ringProgress) + 1;
    ctx.beginPath();
    ctx.arc(pcx, pcy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 10 golden particles flying outward from the player position
  if (elapsed < 2000) {
    const particleProgress = elapsed / 2000;
    const particleAlpha = 1 - particleProgress;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + i * 0.3;
      const dist = particleProgress * 50 + 8;
      const px = pcx + Math.cos(angle) * dist;
      const py = pcy + Math.sin(angle) * dist;
      const size = 2.5 * (1 - particleProgress);
      ctx.globalAlpha = particleAlpha * 0.9;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === Canvas-center HUD celebration ===
  ctx.globalAlpha = alpha;

  // Golden radial burst
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2 - 40;
  const burstRadius = 80 + progress * 60;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + progress * 2;
    const rayLen = burstRadius * (0.6 + Math.sin(progress * 10 + i) * 0.4);
    ctx.strokeStyle = `hsl(${45 + i * 3}, 100%, ${60 + progress * 20}%)`;
    ctx.lineWidth = 3 - progress * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
    ctx.stroke();
  }

  // Rising golden particles
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const r = 30 + progress * 80;
    const px = cx + Math.cos(angle + progress * 3) * r;
    const py = cy + Math.sin(angle + progress * 3) * r - progress * 60;
    const size = 3 * (1 - progress);
    ctx.fillStyle = `hsl(${40 + i * 5}, 100%, 70%)`;
    ctx.globalAlpha = alpha * (1 - progress) * 0.8;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // "LEVEL UP!" text
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${28 + Math.sin(progress * 8) * 4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#f1c40f';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 4;
  ctx.strokeText('⭐ LEVEL UP! ⭐', cx, cy);
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('⭐ LEVEL UP! ⭐', cx, cy);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// =============================================
// Target reticle rendering
// =============================================
function renderTargetReticle(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  direction: Direction,
  monsters: { id: string; position: { x: number; y: number }; isDead: boolean; definitionId: string }[],
  camX: number,
  camY: number
) {
  const dirOff = DIR_OFFSETS[direction];

  // Check monsters in front
  for (const m of monsters) {
    if (m.isDead) continue;
    const dx = m.position.x - playerX;
    const dy = m.position.y - playerY;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));

    if (dist > 5) continue; // only show reticle for nearby monsters

    // Check if monster is in the direction player faces (with some tolerance)
    const dotProduct = dx * dirOff.x + dy * dirOff.y;
    if (dotProduct <= 0 && dist > 1) continue; // allow adjacent regardless of direction

    const mx = m.position.x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const my = m.position.y * TILE_SIZE + TILE_SIZE / 2 - camY;

    // Pulsing red targeting reticle
    const time = Date.now() / 300;
    const pulse = 0.6 + Math.sin(time) * 0.3;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);

    // Corner brackets
    const s = 18;
    const c = 5;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(mx - s, my - s + c); ctx.lineTo(mx - s, my - s); ctx.lineTo(mx - s + c, my - s);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(mx + s - c, my - s); ctx.lineTo(mx + s, my - s); ctx.lineTo(mx + s, my - s + c);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(mx - s, my + s - c); ctx.lineTo(mx - s, my + s); ctx.lineTo(mx - s + c, my + s);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(mx + s - c, my + s); ctx.lineTo(mx + s, my + s); ctx.lineTo(mx + s, my + s - c);
    ctx.stroke();

    ctx.setLineDash([]);

    // Highlight the closest one
    if (dist <= 1) {
      ctx.strokeStyle = `rgba(255, 80, 80, ${pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(mx - s - 2, my - s - 2, (s + 2) * 2, (s + 2) * 2);
    }

    ctx.restore();
    break; // only show reticle on one monster (closest in direction)
  }
}

// =============================================
// Main Game Canvas Component
// =============================================
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMoveTime = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const touchDirection = useRef<Direction | null>(null);
  const touchAttack = useRef(false);
  const lastFrameTime = useRef(0);
  const isMobile = useIsMobile();
  const animFrameRef = useRef<number>(0);

  const player = useGameStore((s) => s.player);
  const gameMap = useGameStore((s) => s.gameMap);
  const monsters = useGameStore((s) => s.monsters);
  const otherPlayers = useGameStore((s) => s.otherPlayers);
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const movePlayer = useGameStore((s) => s.movePlayer);
  const attackMonster = useGameStore((s) => s.attackMonster);
  const interactNPC = useGameStore((s) => s.interactNPC);
  const updateMatchTimer = useGameStore((s) => s.updateMatchTimer);
  const updateMonsters = useGameStore((s) => s.updateMonsters);
  const cleanupDamageNumbers = useGameStore((s) => s.cleanupDamageNumbers);
  const cleanupSpellEffects = useGameStore((s) => s.cleanupSpellEffects);
  const regenMana = useGameStore((s) => s.regenMana);

  const moveDelay = player ? 300 / player.stats.speed : 300;

  // Render function - uses refs to avoid closure issues
  const doRender = useCallback(() => {
    try {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const currentPlayer = useGameStore.getState().player;
    const currentMap = useGameStore.getState().gameMap;
    const currentMonsters = useGameStore.getState().monsters;
    const currentLoot = useGameStore.getState().droppedLoot;
    const currentOthers = useGameStore.getState().otherPlayers;
    const currentBots = useGameStore.getState().bots;
    const currentDmgNumbers = useGameStore.getState().damageNumbers;
    const currentSpellEffects = useGameStore.getState().spellEffects;
    const currentBuffEnd = useGameStore.getState().buffEndTime;
    const screenShakeTime = useGameStore.getState().screenShakeTime;
    const levelUpTime = useGameStore.getState().levelUpTime;
    if (!ctx || !currentPlayer) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Screen shake offset
    let shakeX = 0;
    let shakeY = 0;
    const shakeElapsed = Date.now() - screenShakeTime;
    if (shakeElapsed < 300) {
      const intensity = (1 - shakeElapsed / 300) * 6;
      shakeX = (Math.random() - 0.5) * intensity * 2;
      shakeY = (Math.random() - 0.5) * intensity * 2;
    }

    const camX = currentPlayer.position.x * TILE_SIZE - canvasWidth / 2 + TILE_SIZE / 2 + shakeX;
    const camY = currentPlayer.position.y * TILE_SIZE - canvasHeight / 2 + TILE_SIZE / 2 + shakeY;

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

        // Base color with subtle per-tile variation (darker atmosphere)
        const baseColor = TILE_COLORS[tile] || '#333';
        const variation = 0.88 + tileHash(x, y, 999) * 0.24; // 0.88-1.12
        const r = Math.min(255, Math.max(0, Math.round(parseInt(baseColor.slice(1, 3), 16) * variation)));
        const g = Math.min(255, Math.max(0, Math.round(parseInt(baseColor.slice(3, 5), 16) * variation)));
        const b = Math.min(255, Math.max(0, Math.round(parseInt(baseColor.slice(5, 7), 16) * variation)));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Tibia-style grid lines (1px semi-transparent dark border)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        drawTileDetail(ctx, tile, screenX, screenY, x, y);
      }
    }

    for (const npc of currentMap.npcs) {
      const screenX = npc.position.x * TILE_SIZE - camX;
      const screenY = npc.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawNPC(ctx, npc.name, npc.color, npc.icon, screenX, screenY);
      }
    }

    // Draw Safe Zone during Arena
    const matchPhase = useGameStore.getState().matchPhase;
    if (matchPhase === 'arena') {
       const safeZoneRadius = useGameStore.getState().safeZoneRadius;
       const cx = 50 * TILE_SIZE + (TILE_SIZE / 2) - camX;
       const cy = 50 * TILE_SIZE + (TILE_SIZE / 2) - camY;
       
       ctx.save();
       ctx.strokeStyle = 'rgba(255, 60, 60, 0.7)';
       ctx.lineWidth = 4;
       ctx.beginPath();
       ctx.arc(cx, cy, safeZoneRadius * TILE_SIZE, 0, Math.PI * 2);
       ctx.stroke();
       
       // Fill outer area with red tint
       ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
       ctx.beginPath();
       ctx.rect(0, 0, canvasWidth, canvasHeight);
       ctx.arc(cx, cy, safeZoneRadius * TILE_SIZE, 0, Math.PI * 2, true);
       ctx.fill();
       
       ctx.restore();
    }

    // Draw dropped loot (chests)
    for (const loot of currentLoot) {
      const screenX = loot.position.x * TILE_SIZE - camX;
      const screenY = loot.position.y * TILE_SIZE - camY;
      
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        // Glowing aura
        const glowPhase = (Date.now() % 2000) / 2000;
        const radius = (TILE_SIZE / 2) + Math.sin(glowPhase * Math.PI * 2) * 4;
        
        const itemDef = ITEMS[loot.itemId];
        const icon = itemDef?.icon || '📦';
        const color = itemDef?.color || '#f1c40f';
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, radius, 0, Math.PI * 2);
        
        const grad = ctx.createRadialGradient(
          screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 0,
          screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, radius
        );
        
        // Convert hex color to rgba for gradient
        // Assuming hex format #RRGGBB
        let r = 255, g = 215, b = 0;
        if (color.startsWith('#') && color.length === 7) {
            r = parseInt(color.slice(1, 3), 16);
            g = parseInt(color.slice(3, 5), 16);
            b = parseInt(color.slice(5, 7), 16);
        }
        
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Chest/Item icon
        ctx.font = `${TILE_SIZE * 0.7}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 2);
        
        ctx.restore();
      }
    }

    for (const monster of currentMonsters) {
      const def = MONSTERS[monster.definitionId];
      if (!def) continue;

      // Death fade animation
      if (monster.isDead) {
        if (!monster.deathTime) continue;
        const deathAge = Date.now() - monster.deathTime;
        if (deathAge > 1500) continue; // fully faded

        const screenX = monster.position.x * TILE_SIZE - camX;
        const screenY = monster.position.y * TILE_SIZE - camY;
        if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
          const fadeAlpha = 1 - deathAge / 1500;
          const shrinkScale = 1 - (deathAge / 1500) * 0.5;
          ctx.save();
          ctx.globalAlpha = fadeAlpha;
          ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          ctx.scale(shrinkScale, shrinkScale);
          ctx.translate(-(screenX + TILE_SIZE / 2), -(screenY + TILE_SIZE / 2));

          // Red-tinted death sprite
          const ts = TILE_SIZE;
          const cx = screenX + ts / 2;
          const cy = screenY + ts / 2;
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.rect(cx - 10, cy - 6, 20, 18);
          ctx.fill();
          // X eyes
          ctx.strokeStyle = '#999';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 6, cy - 2); ctx.lineTo(cx - 2, cy + 2);
          ctx.moveTo(cx - 2, cy - 2); ctx.lineTo(cx - 6, cy + 2);
          ctx.moveTo(cx + 2, cy - 2); ctx.lineTo(cx + 6, cy + 2);
          ctx.moveTo(cx + 6, cy - 2); ctx.lineTo(cx + 2, cy + 2);
          ctx.stroke();

          ctx.restore();
        }
        continue;
      }

      const screenX = monster.position.x * TILE_SIZE - camX;
      const screenY = monster.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawMonster(ctx, def.name, monster.definitionId, def.color, def.icon, screenX, screenY, monster.health, monster.maxHealth, def.sprites, monster.direction as Direction, monster.lastHitTime);
      }
    }

    for (const other of currentOthers) {
      const screenX = other.position.x * TILE_SIZE - camX;
      const screenY = other.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawPlayerSprite(ctx, other.name, screenX, screenY, other.direction as Direction, '#3498db', other.level, other.health, other.maxHealth, false, other.vocation as Vocation);
      }
    }

    // Draw bots
    for (const bot of currentBots) {
      const screenX = bot.position.x * TILE_SIZE - camX;
      const screenY = bot.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawPlayerSprite(ctx, bot.name, screenX, screenY, bot.direction, '#e74c3c', bot.stats.level, bot.stats.health, bot.stats.maxHealth, false, bot.vocation);
      }
    }

    const playerScreenX = currentPlayer.position.x * TILE_SIZE - camX;
    const playerScreenY = currentPlayer.position.y * TILE_SIZE - camY;
    const hasBuff = Date.now() < currentBuffEnd;
    drawPlayerSprite(ctx, currentPlayer.name, playerScreenX, playerScreenY, currentPlayer.direction, '#e67e22', currentPlayer.stats.level, currentPlayer.stats.health, currentPlayer.stats.maxHealth, hasBuff, currentPlayer.vocation);

    // Level up celebration (in-world ring + particles, drawn after player, before spell effects)
    if (levelUpTime > 0) {
      renderLevelUpCelebration(ctx, canvasWidth, canvasHeight, levelUpTime, playerScreenX, playerScreenY);
    }

    // Render spell effects
    renderSpellEffects(ctx, currentSpellEffects, camX, camY);

    renderDamageNumbers(ctx, currentDmgNumbers, camX, camY);

    // Target reticle on monster in front of player
    renderTargetReticle(ctx, currentPlayer.position.x, currentPlayer.position.y, currentPlayer.direction, currentMonsters, camX, camY);

    // Day/Night cycle overlay
    const gameMinutes = Date.now() / 100;
    const totalGameHours = (gameMinutes / 60) % 24;
    let nightAlpha = 0;
    if (totalGameHours >= 21 || totalGameHours < 6) {
      nightAlpha = 0.35;
    } else if (totalGameHours >= 18) {
      nightAlpha = 0.15 + (totalGameHours - 18) / 3 * 0.2;
    } else if (totalGameHours < 8) {
      nightAlpha = 0.35 - (totalGameHours - 6) / 2 * 0.35;
    }
    if (nightAlpha > 0) {
      ctx.fillStyle = `rgba(10, 10, 40, ${nightAlpha})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Area name indicator
    const px = currentPlayer.position.x;
    const py = currentPlayer.position.y;
    let areaName = '';
    let areaColor = '#fff';
    if (px >= 34 && px <= 66 && py >= 34 && py <= 61) { areaName = 'Tibia Town (Safe Zone)'; areaColor = '#f1c40f'; }
    else if (px >= 5 && px <= 95 && py >= 2 && py <= 30) { areaName = 'Northern Forest'; areaColor = '#2ecc71'; }
    else if (px >= 5 && px <= 95 && py >= 65 && py <= 98) { areaName = 'Southern Swamp'; areaColor = '#27ae60'; }
    else if (px >= 2 && px <= 32 && py >= 5 && py <= 63) { areaName = 'Western Desert'; areaColor = '#e67e22'; }
    else if (px >= 70 && px <= 98 && py >= 5 && py <= 63) { areaName = 'Eastern Mountains'; areaColor = '#95a5a6'; }
    else if (px >= 2 && px <= 12 && py >= 88 && py <= 98) { areaName = 'Lava Fields (BOSS)'; areaColor = '#e74c3c'; }
    else if (px >= 88 && px <= 98 && py >= 88 && py <= 98) { areaName = 'Dark Forest (LEGEND)'; areaColor = '#c0392b'; }

    if (areaName) {
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(areaName, canvasWidth / 2 + 1, 21);
      ctx.fillStyle = areaColor;
      ctx.fillText(areaName, canvasWidth / 2, 20);
    }

    // Safe zone indicator
    const inTown = currentPlayer.position.x >= 35 && currentPlayer.position.x < 65 && currentPlayer.position.y >= 35 && currentPlayer.position.y < 60;
    if (inTown) {
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText('🛡️ SAFE', canvasWidth / 2 + 1, 36);
      ctx.fillStyle = '#2ecc71';
      ctx.fillText('🛡️ SAFE', canvasWidth / 2, 35);
    }
    } catch (e: any) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'red';
          ctx.font = '16px monospace';
          ctx.fillText("Crash: " + e.message, 20, 50);
          ctx.fillText(e.stack || '', 20, 80);
        }
      }
      console.error(e);
    }
  }, []);

  // Game loop ref to avoid self-reference
  const gameLoopRef = useRef<((timestamp: number) => void) | null>(null);

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
        let direction: Direction | null = null;
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
          direction = Direction.NORTH;
        } else if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
          direction = Direction.SOUTH;
        } else if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
          direction = Direction.WEST;
        } else if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
          direction = Direction.EAST;
        } else if (touchDirection.current !== null) {
          direction = touchDirection.current;
        }
        if (direction !== null) {
          store.movePlayer(direction);
          moved = true;
        }
        if (moved) lastMoveTime.current = now;
      }

      store.updateMatchTimer(deltaTime);
      store.updateMonsters(deltaTime);
      store.updateLoot(deltaTime);
      store.updateBots(deltaTime);
      store.regenMana(deltaTime);

      // Auto-attack when holding Space or touch attack button
      if (keysPressed.current.has(' ') || touchAttack.current) {
        const autoAttackDelay = 500; // ms between auto-attacks
        const now = Date.now();
        if (now - store.lastAutoAttackTime > autoAttackDelay) {
          store.attackMonster();
          useGameStore.setState({ lastAutoAttackTime: now });
        }
      }

      if (now % 500 < 20) {
        store.cleanupDamageNumbers();
        store.cleanupSpellEffects();
      }

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

      // Space = physical attack with sword (also auto-attacks when held)
      if (key === ' ') {
        e.preventDefault();
        const s = useGameStore.getState();
        const now = Date.now();
        if (now - s.lastAutoAttackTime > 500) {
          s.attackMonster();
          useGameStore.setState({ lastAutoAttackTime: now });
        }
      }
      // E = interact with NPC
      if (key === 'e') {
        useGameStore.getState().interactNPC();
      }

      // I, O, P = cast skills (Mac-friendly keys)
      if (key === 'i') { e.preventDefault(); if (!useGameStore.getState().showSkillPanel) useGameStore.getState().castSkill(0); }
      if (key === 'o') { e.preventDefault(); if (!useGameStore.getState().showSkillPanel) useGameStore.getState().castSkill(1); }
      if (key === 'p') { e.preventDefault(); if (!useGameStore.getState().showSkillPanel) useGameStore.getState().castSkill(2); }
      if (key === 'k') { e.preventDefault(); useGameStore.getState().toggleSkillPanel(); }
      if (e.key === 'Escape') { e.preventDefault(); if (useGameStore.getState().showSkillPanel) useGameStore.getState().toggleSkillPanel(); }

      // Q = quick potion
      if (key === 'q') {
        e.preventDefault();
        useGameStore.getState().quickUsePotion();
      }

      // 1-9 = use inventory items
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

  // Preload monster sprites
  useEffect(() => {
    preloadSprites();
  }, []);

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
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
      {isMobile && (
        <MobileControls
          touchDirection={touchDirection}
          touchAttack={touchAttack}
        />
      )}
    </div>
  );
}