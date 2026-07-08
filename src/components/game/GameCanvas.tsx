'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  TILE_SIZE,
  TileType,
  Direction,
  TILE_COLORS,
  DamageNumber,
  SpellEffect,
  DIR_OFFSETS,
  MonsterSpriteSet,
} from '@/lib/game/types';
import { MONSTERS } from '@/lib/game/monsters';

// =============================================
// Sprite image cache
// =============================================
const spriteCache: Record<string, HTMLImageElement> = {};
const spriteLoadPromises: Record<string, Promise<void>> = {};

function loadSprite(url: string): Promise<HTMLImageElement> {
  if (spriteCache[url]) return Promise.resolve(spriteCache[url]);
  if (spriteLoadPromises[url]) {
    return spriteLoadPromises[url].then(() => spriteCache[url]);
  }
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
  return spriteLoadPromises[url];
}

function preloadSprites() {
  for (const def of Object.values(MONSTERS)) {
    if (def.sprites) {
      loadSprite(def.sprites.north);
      loadSprite(def.sprites.south);
      loadSprite(def.sprites.east);
      loadSprite(def.sprites.west);
    }
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

function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Direction.EAST : Direction.WEST;
  }
  return dy > 0 ? Direction.SOUTH : Direction.NORTH;
}

// =============================================
// Tile detail rendering
// =============================================
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

// =============================================
// Player sprite rendering
// =============================================
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
  hasBuff: boolean
) {
  const ts = TILE_SIZE;
  const cx = x + ts / 2;
  const cy = y + ts / 2;

  // Buff aura
  if (hasBuff) {
    const time = Date.now() / 300;
    ctx.strokeStyle = `rgba(255, 165, 0, ${0.3 + Math.sin(time) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + Math.sin(time) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

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

  // Weapon (sword) in hand
  ctx.fillStyle = '#a0a0a0';
  ctx.strokeStyle = '#707070';
  ctx.lineWidth = 1;
  const dirOff = DIR_OFFSETS[direction];
  const swordX = cx + dirOff.x * 14;
  const swordY = cy + dirOff.y * 14;
  ctx.save();
  ctx.translate(swordX, swordY);
  const angle = direction === Direction.NORTH ? -Math.PI / 2 : direction === Direction.SOUTH ? Math.PI / 2 : direction === Direction.EAST ? 0 : Math.PI;
  ctx.rotate(angle);
  // Sword blade
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(-1, -12, 3, 12);
  // Sword tip
  ctx.beginPath();
  ctx.moveTo(-1, -12);
  ctx.lineTo(0.5, -16);
  ctx.lineTo(2, -12);
  ctx.fill();
  // Handle
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-2, 0, 5, 4);
  // Guard
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(-3, -1, 7, 2);
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx + dirOff.x * 18, cy + dirOff.y * 18);
  ctx.lineTo(cx + dirOff.x * 14 + (dirOff.y !== 0 ? -3 : 0), cy + dirOff.y * 14 + (dirOff.x !== 0 ? -3 : 0));
  ctx.lineTo(cx + dirOff.x * 14 + (dirOff.y !== 0 ? 3 : 0), cy + dirOff.y * 14 + (dirOff.x !== 0 ? 3 : 0));
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

// =============================================
// Monster rendering
// =============================================
function drawMonster(
  ctx: CanvasRenderingContext2D,
  name: string,
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
      // Fallback to colored rectangle while loading
      drawMonsterFallback(ctx, cx, cy, color);
    }
  } else {
    // No sprites — draw classic colored monster
    drawMonsterFallback(ctx, cx, cy, color);
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
        ctx.roundRect(cx - 10, cy - 6, 20, 18, 4);
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
  color: string
) {
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
  const cleanupSpellEffects = useGameStore((s) => s.cleanupSpellEffects);
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
          ctx.roundRect(cx - 10, cy - 6, 20, 18, 4);
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
        drawMonster(ctx, def.name, def.color, def.icon, screenX, screenY, monster.health, monster.maxHealth, def.sprites, monster.direction as Direction, monster.lastHitTime);
      }
    }

    for (const other of currentOthers) {
      const screenX = other.position.x * TILE_SIZE - camX;
      const screenY = other.position.y * TILE_SIZE - camY;
      if (screenX > -TILE_SIZE && screenX < canvasWidth && screenY > -TILE_SIZE && screenY < canvasHeight) {
        drawPlayerSprite(ctx, other.name, screenX, screenY, other.direction as Direction, '#3498db', other.level, other.health, other.maxHealth, false);
      }
    }

    const playerScreenX = currentPlayer.position.x * TILE_SIZE - camX;
    const playerScreenY = currentPlayer.position.y * TILE_SIZE - camY;
    const hasBuff = Date.now() < currentBuffEnd;
    drawPlayerSprite(ctx, currentPlayer.name, playerScreenX, playerScreenY, currentPlayer.direction, '#e67e22', currentPlayer.stats.level, currentPlayer.stats.health, currentPlayer.stats.maxHealth, hasBuff);

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

      // Auto-attack when holding Space
      if (keysPressed.current.has(' ')) {
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

      // Q1/Q2 = quick potions
      if (key === 'q') {
        e.preventDefault();
        const s = useGameStore.getState();
        if (s.player) {
          // Use HP potion first if hurt, otherwise MP
          const needHP = s.player.stats.health < s.player.stats.maxHealth * 0.8;
          const potions = s.player.inventory.filter(i =>
            needHP ? i.itemId.startsWith('health_potion') : i.itemId.startsWith('mana_potion')
          ).sort((a, b) => {
            const order = needHP
              ? ['health_potion_large', 'health_potion_medium', 'health_potion_small']
              : ['mana_potion_large', 'mana_potion_medium', 'mana_potion_small'];
            return order.indexOf(a.itemId) - order.indexOf(b.itemId);
          });
          if (potions.length > 0) s.consumeInventoryItem(potions[0].id);
        }
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
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}