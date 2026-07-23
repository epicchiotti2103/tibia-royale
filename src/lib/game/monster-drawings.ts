// =============================================
// Tibia-Style Monster Pixel Art Renderer
// Each monster gets actual creature shapes instead of colored rectangles
// =============================================

import { Direction } from './types';

interface DrawCtx {
  fillStyle: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  fill(): void;
  stroke(): void;
  strokeStyle: string;
  lineWidth: number;
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, start: number, end: number): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(x: number, y: number): void;
  roundRect(x: number, y: number, w: number, h: number, r: number): void;
  globalAlpha: number;
}

type Ctx = CanvasRenderingContext2D;

// Helper to draw a pixel-art style body
function drawBody(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string, darkColor?: string) {
  ctx.fillStyle = darkColor || color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  if (darkColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy - 1, w - 1, h - 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper to draw eyes
function drawEyes(ctx: Ctx, cx: number, cy: number, spacing: number, eyeColor: string, size: number = 2, direction?: Direction) {
  ctx.fillStyle = eyeColor;
  if (direction === Direction.NORTH) {
    // No eyes visible from behind
    return;
  }
  if (direction === Direction.EAST) {
    ctx.beginPath();
    ctx.arc(cx + spacing / 2, cy, size, 0, Math.PI * 2);
    ctx.fill();
  } else if (direction === Direction.WEST) {
    ctx.beginPath();
    ctx.arc(cx - spacing / 2, cy, size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // SOUTH - both eyes visible
    ctx.beginPath();
    ctx.arc(cx - spacing / 2, cy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + spacing / 2, cy, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================
// Individual Monster Drawing Functions
// =============================================

function drawRat(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#6B4226';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headOff = direction === Direction.NORTH ? -6 : direction === Direction.SOUTH ? 6 : 0;
  const headOffX = direction === Direction.EAST ? 7 : direction === Direction.WEST ? -7 : 0;
  ctx.fillStyle = '#7B4A28';
  ctx.beginPath();
  ctx.arc(cx + headOffX, cy - 4 + (direction === Direction.NORTH ? -2 : 0), 5, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#C4956A';
  ctx.beginPath();
  ctx.arc(cx + headOffX - 3, cy - 8 + (direction === Direction.NORTH ? -2 : 0), 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + headOffX + 3, cy - 8 + (direction === Direction.NORTH ? -2 : 0), 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + headOffX, cy - 4 + (direction === Direction.NORTH ? -2 : 0), 4, '#ff0000', 1.5, direction);

  // Tail
  ctx.strokeStyle = '#C4956A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const tailX = direction === Direction.EAST ? -8 : direction === Direction.WEST ? 8 : 0;
  ctx.moveTo(cx + tailX, cy + 3);
  ctx.quadraticCurveTo(cx + tailX - 5, cy + 10, cx + tailX - 8, cy + 5);
  ctx.stroke();

  // Whiskers
  if (direction !== Direction.NORTH) {
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.5;
    const whX = cx + headOffX;
    const whY = cy - 2;
    ctx.beginPath();
    ctx.moveTo(whX, whY);
    ctx.lineTo(whX + (direction === Direction.WEST ? -8 : direction === Direction.EAST ? 8 : -6), whY - 1);
    ctx.moveTo(whX, whY + 1);
    ctx.lineTo(whX + (direction === Direction.WEST ? -8 : direction === Direction.EAST ? 8 : 6), whY + 1);
    if (direction === Direction.SOUTH) {
      ctx.moveTo(whX, whY);
      ctx.lineTo(whX - 6, whY - 1);
      ctx.moveTo(whX, whY + 1);
      ctx.lineTo(whX - 6, whY + 1);
    }
    ctx.stroke();
  }
}

function drawBat(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Wings
  ctx.fillStyle = '#2C1A3D';
  const wingSpan = direction === Direction.NORTH || direction === Direction.SOUTH ? 16 : 10;
  const wingY = cy - 4;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 4, wingY);
  ctx.quadraticCurveTo(cx - wingSpan, wingY - 12, cx - wingSpan + 4, wingY + 2);
  ctx.quadraticCurveTo(cx - wingSpan / 2, wingY + 4, cx - 4, wingY + 4);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 4, wingY);
  ctx.quadraticCurveTo(cx + wingSpan, wingY - 12, cx + wingSpan - 4, wingY + 2);
  ctx.quadraticCurveTo(cx + wingSpan / 2, wingY + 4, cx + 4, wingY + 4);
  ctx.fill();

  // Body
  ctx.fillStyle = '#3D2552';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#4A2D62';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 4, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#4A2D62';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 9);
  ctx.lineTo(cx - 1, cy - 14);
  ctx.lineTo(cx + 1, cy - 9);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - 9);
  ctx.lineTo(cx + 3, cy - 14);
  ctx.lineTo(cx + 5, cy - 9);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx, cy - 6, 3, '#ff3333', 1.5, direction);
}

function drawSnake(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Coiled body
  ctx.strokeStyle = '#2D8B2D';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const offset = Date.now() / 800;
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const sx = cx + Math.sin(t * Math.PI * 3 + offset) * 8;
    const sy = cy - 6 + t * 14;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Lighter belly line
  ctx.strokeStyle = '#4AAF4A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const sx = cx + Math.sin(t * Math.PI * 3 + offset) * 6;
    const sy = cy - 5 + t * 14;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // Head (triangle)
  const headX = cx + Math.sin(offset) * 8;
  const headY = cy - 6;
  ctx.fillStyle = '#1A6B1A';
  ctx.beginPath();
  if (direction === Direction.NORTH) {
    ctx.moveTo(headX, headY - 6);
    ctx.lineTo(headX - 4, headY + 2);
    ctx.lineTo(headX + 4, headY + 2);
  } else if (direction === Direction.SOUTH) {
    ctx.moveTo(headX, headY + 6);
    ctx.lineTo(headX - 4, headY - 2);
    ctx.lineTo(headX + 4, headY - 2);
  } else if (direction === Direction.EAST) {
    ctx.moveTo(headX + 6, headY);
    ctx.lineTo(headX - 2, headY - 4);
    ctx.lineTo(headX - 2, headY + 4);
  } else {
    ctx.moveTo(headX - 6, headY);
    ctx.lineTo(headX + 2, headY - 4);
    ctx.lineTo(headX + 2, headY + 4);
  }
  ctx.fill();

  // Eyes
  drawEyes(ctx, headX, headY, 3, '#ffff00', 1.2, direction);

  // Forked tongue
  if (direction === Direction.SOUTH || direction === Direction.EAST || direction === Direction.WEST) {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 0.8;
    const tongueDir = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
    const tongueDirY = direction === Direction.SOUTH ? 1 : 0;
    ctx.beginPath();
    ctx.moveTo(headX, headY + 3 * (direction === Direction.SOUTH ? 1 : 0) + 4 * tongueDirY);
    ctx.lineTo(headX + 3 * tongueDir, headY + 7 * (direction === Direction.SOUTH ? 1 : 0) + 3 * tongueDir);
    ctx.moveTo(headX + 3 * tongueDir, headY + 7 * (direction === Direction.SOUTH ? 1 : 0) + 3 * tongueDir);
    ctx.lineTo(headX + 5 * tongueDir, headY + 9 * (direction === Direction.SOUTH ? 1 : 0) + 2 * tongueDir);
    ctx.moveTo(headX + 3 * tongueDir, headY + 7 * (direction === Direction.SOUTH ? 1 : 0) + 3 * tongueDir);
    ctx.lineTo(headX + 5 * tongueDir, headY + 9 * (direction === Direction.SOUTH ? 1 : 0) + 4 * tongueDir);
    ctx.stroke();
  }
}

function drawSpider(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Legs (8 legs, 4 on each side)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  const legAngles = [-0.6, -0.2, 0.2, 0.6];
  for (const angle of legAngles) {
    // Left legs
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + angle * 8);
    ctx.lineTo(cx - 14, cy + angle * 12 - 3);
    ctx.stroke();
    // Right legs
    ctx.beginPath();
    ctx.moveTo(cx + 5, cy + angle * 8);
    ctx.lineTo(cx + 14, cy + angle * 12 - 3);
    ctx.stroke();
  }

  // Body (abdomen)
  ctx.fillStyle = '#2C1810';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pattern on abdomen
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a2800';
  ctx.beginPath();
  ctx.arc(cx, cy + 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Head (cephalothorax)
  ctx.fillStyle = '#3D2215';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (multiple - spiders have 8 eyes)
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#ff0000';
    const eyeOffX = direction === Direction.EAST ? 2 : direction === Direction.WEST ? -2 : 0;
    ctx.beginPath();
    ctx.arc(cx - 2 + eyeOffX, cy - 6, 1.2, 0, Math.PI * 2);
    ctx.arc(cx + 2 + eyeOffX, cy - 6, 1.2, 0, Math.PI * 2);
    ctx.arc(cx - 1 + eyeOffX, cy - 4, 1, 0, Math.PI * 2);
    ctx.arc(cx + 1 + eyeOffX, cy - 4, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fangs
  if (direction === Direction.SOUTH) {
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2);
    ctx.lineTo(cx - 1, cy + 1);
    ctx.lineTo(cx, cy - 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + 1, cy + 1);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.fill();
  }
}

function drawGoblin(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#2D6B1E';
  ctx.fillRect(cx - 5, cy - 2, 10, 12);

  // Head
  ctx.fillStyle = '#3A8528';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Pointy ears
  ctx.fillStyle = '#3A8528';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 5);
  ctx.lineTo(cx - 10, cy - 12);
  ctx.lineTo(cx - 3, cy - 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 5);
  ctx.lineTo(cx + 10, cy - 12);
  ctx.lineTo(cx + 3, cy - 7);
  ctx.fill();

  // Eyes (yellow, evil)
  drawEyes(ctx, cx, cy - 5, 4, '#ccff00', 2, direction);

  // Mouth
  if (direction === Direction.SOUTH || direction === Direction.EAST || direction === Direction.WEST) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - 2, cy - 2, 4, 1);
  }

  // Weapon (small dagger)
  const weaponOff = direction === Direction.EAST ? 6 : direction === Direction.WEST ? -6 : 0;
  ctx.fillStyle = '#aaa';
  ctx.fillRect(cx + weaponOff - 1, cy + 1, 2, 6);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cx + weaponOff - 2, cy + 6, 4, 3);

  // Legs
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(cx - 4, cy + 8, 3, 4);
  ctx.fillRect(cx + 1, cy + 8, 3, 4);

  // Loincloth
  ctx.fillStyle = '#6B3A1A';
  ctx.fillRect(cx - 5, cy + 6, 10, 3);
}

function drawWolf(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#5A5A5A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6B6B6B';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headX = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 0;
  const headY = direction === Direction.NORTH ? -8 : direction === Direction.SOUTH ? 4 : -3;
  ctx.fillStyle = '#6B6B6B';
  ctx.beginPath();
  ctx.ellipse(cx + headX, cy + headY, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#7B7B7B';
    const snoutDir = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
    const snoutY = direction === Direction.SOUTH ? 3 : 0;
    ctx.beginPath();
    ctx.ellipse(cx + headX + snoutDir, cy + headY + snoutY + 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx + headX + snoutDir * 1.3, cy + headY + snoutY + 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ears (pointed)
  ctx.fillStyle = '#5A5A5A';
  ctx.beginPath();
  ctx.moveTo(cx + headX - 4, cy + headY - 3);
  ctx.lineTo(cx + headX - 2, cy + headY - 9);
  ctx.lineTo(cx + headX, cy + headY - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + headX + 2, cy + headY - 3);
  ctx.lineTo(cx + headX + 4, cy + headY - 9);
  ctx.lineTo(cx + headX + 6, cy + headY - 3);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + headX, cy + headY - 1, 4, '#ffcc00', 1.5, direction);

  // Tail
  const tailX = direction === Direction.EAST ? -10 : direction === Direction.WEST ? 10 : 0;
  ctx.strokeStyle = '#5A5A5A';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + tailX, cy + 2);
  ctx.quadraticCurveTo(cx + tailX + (direction === Direction.SOUTH ? -5 : 5), cy - 5, cx + tailX + (direction === Direction.SOUTH ? -8 : 8), cy - 3);
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(cx - 7, cy + 5, 3, 5);
  ctx.fillRect(cx - 2, cy + 5, 3, 5);
  ctx.fillRect(cx + 3, cy + 5, 3, 5);
  ctx.fillRect(cx + 7, cy + 5, 3, 5);
}

function drawScorpion(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body segments
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 4, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail (curved upward)
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.quadraticCurveTo(cx + 2, cy - 14, cx - 2, cy - 16);
  ctx.quadraticCurveTo(cx - 6, cy - 18, cx - 4, cy - 14);
  ctx.stroke();
  // Stinger
  ctx.fillStyle = '#2a0000';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 15);
  ctx.lineTo(cx - 4, cy - 18);
  ctx.lineTo(cx - 2, cy - 15);
  ctx.fill();

  // Pincers
  ctx.strokeStyle = '#A0522D';
  ctx.lineWidth = 2;
  // Left pincer
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3);
  ctx.lineTo(cx - 10, cy - 6);
  ctx.lineTo(cx - 12, cy - 4);
  ctx.moveTo(cx - 10, cy - 6);
  ctx.lineTo(cx - 11, cy - 8);
  ctx.stroke();
  // Right pincer
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 3);
  ctx.lineTo(cx + 10, cy - 6);
  ctx.lineTo(cx + 12, cy - 4);
  ctx.moveTo(cx + 10, cy - 6);
  ctx.lineTo(cx + 11, cy - 8);
  ctx.stroke();

  // Legs (6 legs)
  ctx.strokeStyle = '#6B3410';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const legY = cy + i * 3;
    ctx.beginPath();
    ctx.moveTo(cx - 5, legY);
    ctx.lineTo(cx - 10, legY + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 5, legY);
    ctx.lineTo(cx + 10, legY + 3);
    ctx.stroke();
  }

  // Eyes
  drawEyes(ctx, cx, cy - 5, 3, '#ff0000', 1.2, direction);
}

function drawOrc(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body (larger, muscular)
  ctx.fillStyle = '#2D5A1E';
  ctx.fillRect(cx - 7, cy - 3, 14, 14);
  // Shoulders
  ctx.fillStyle = '#3A6B28';
  ctx.fillRect(cx - 10, cy - 3, 4, 6);
  ctx.fillRect(cx + 6, cy - 3, 4, 6);

  // Head
  ctx.fillStyle = '#3A6B28';
  ctx.beginPath();
  ctx.arc(cx, cy - 7, 7, 0, Math.PI * 2);
  ctx.fill();

  // Lower jaw / tusks
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#2D5A1E';
    ctx.fillRect(cx - 5, cy - 2, 10, 3);
    // Tusks
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 2);
    ctx.lineTo(cx - 3, cy + 2);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 3, cy + 2);
    ctx.lineTo(cx + 4, cy - 2);
    ctx.fill();
  }

  // Eyes (red, angry)
  drawEyes(ctx, cx, cy - 7, 5, '#ff2200', 2, direction);

  // Armor (leather vest)
  ctx.fillStyle = '#5A3A1A';
  ctx.fillRect(cx - 6, cy - 1, 12, 8);

  // Weapon (axe)
  const weaponOff = direction === Direction.EAST ? 10 : direction === Direction.WEST ? -10 : 6;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cx + weaponOff - 1, cy - 4, 3, 14);
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(cx + weaponOff + 2, cy - 6);
  ctx.lineTo(cx + weaponOff + 7, cy - 3);
  ctx.lineTo(cx + weaponOff + 2, cy);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(cx - 5, cy + 9, 4, 4);
  ctx.fillRect(cx + 1, cy + 9, 4, 4);
}

function drawTroll(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Large body
  ctx.fillStyle = '#5A3D20';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 10, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6B4D30';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 9, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#5A3D20';
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
  ctx.fill();

  // Small eyes
  drawEyes(ctx, cx, cy - 8, 4, '#ffff00', 1.5, direction);

  // Nose (big)
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#4A2D10';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Club
  const clubOff = direction === Direction.EAST ? 10 : direction === Direction.WEST ? -10 : 8;
  ctx.fillStyle = '#5A3D20';
  ctx.fillRect(cx + clubOff - 2, cy - 6, 4, 16);
  ctx.fillStyle = '#4A2D10';
  ctx.beginPath();
  ctx.arc(cx + clubOff, cy - 8, 5, 0, Math.PI * 2);
  ctx.fill();

  // Legs (short, thick)
  ctx.fillStyle = '#4A2D10';
  ctx.fillRect(cx - 6, cy + 9, 5, 4);
  ctx.fillRect(cx + 1, cy + 9, 5, 4);
}

function drawSkeleton(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Ribcage
  ctx.strokeStyle = '#D4C8A0';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 4 + i * 3);
    ctx.lineTo(cx + 5, cy - 4 + i * 3);
    ctx.stroke();
  }
  // Spine
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  // Ribs vertical
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 4);
  ctx.lineTo(cx - 5, cy + 6);
  ctx.moveTo(cx + 5, cy - 4);
  ctx.lineTo(cx + 5, cy + 6);
  ctx.stroke();

  // Skull
  ctx.fillStyle = '#E8DCC8';
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 6, 0, Math.PI * 2);
  ctx.fill();
  // Jaw
  ctx.fillStyle = '#D4C8A0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 4, 2, 0, 0, Math.PI);
  ctx.fill();

  // Eye sockets
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    // Red glow in eyes
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 10, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 10, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms (bones)
  ctx.strokeStyle = '#D4C8A0';
  ctx.lineWidth = 1.5;
  const armOff = direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 2);
  ctx.lineTo(cx - 9 - armOff, cy + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy - 2);
  ctx.lineTo(cx + 9 + armOff, cy + 4);
  ctx.stroke();

  // Legs (bones)
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 8);
  ctx.lineTo(cx - 3, cy + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 8);
  ctx.lineTo(cx + 3, cy + 14);
  ctx.stroke();

  // Weapon (bone club)
  ctx.strokeStyle = '#D4C8A0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 9 + armOff, cy + 4);
  ctx.lineTo(cx + 9 + armOff + 3, cy - 4);
  ctx.stroke();
  ctx.fillStyle = '#E8DCC8';
  ctx.beginPath();
  ctx.arc(cx + 9 + armOff + 3, cy - 5, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawWraith(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Ghostly transparent body
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 300) * 0.15;

  // Cloak / ghost body
  ctx.fillStyle = '#4A1A6B';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 12);
  ctx.quadraticCurveTo(cx - 10, cy, cx - 6, cy - 8);
  ctx.lineTo(cx + 6, cy - 8);
  ctx.quadraticCurveTo(cx + 10, cy, cx + 8, cy + 12);
  // Wavy bottom
  for (let i = 0; i < 5; i++) {
    const x = cx - 8 + i * 4;
    ctx.quadraticCurveTo(x + 2, cy + 14 + Math.sin(Date.now() / 200 + i) * 2, x + 4, cy + 12);
  }
  ctx.fill();

  // Hood
  ctx.fillStyle = '#3A0A5B';
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 6, Math.PI, 0);
  ctx.fill();

  // Eyes (glowing purple)
  ctx.fillStyle = '#cc44ff';
  ctx.shadowColor = '#cc44ff';
  ctx.shadowBlur = 6;
  drawEyes(ctx, cx, cy - 7, 4, '#cc44ff', 2, direction);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawFireElemental(ctx: Ctx, cx: number, cy: number, _direction: Direction) {
  const time = Date.now() / 200;
  // Flame body
  ctx.save();
  for (let i = 3; i >= 0; i--) {
    const flicker = Math.sin(time + i) * 2;
    ctx.globalAlpha = 0.3 + i * 0.15;
    ctx.fillStyle = i < 2 ? '#FF4500' : '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cx - 8 + i * 2, cy + 10);
    ctx.quadraticCurveTo(cx - 10 + flicker, cy, cx, cy - 14 - i * 2 + flicker);
    ctx.quadraticCurveTo(cx + 10 - flicker, cy, cx + 8 - i * 2, cy + 10);
    ctx.fill();
  }
  // Core
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#FFF8DC';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 2, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 2, cy - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDemon(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(cx - 8, cy - 2, 16, 14);

  // Wings
  ctx.fillStyle = '#4A0000';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 2);
  ctx.quadraticCurveTo(cx - 18, cy - 16, cx - 14, cy - 4);
  ctx.lineTo(cx - 8, cy + 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - 2);
  ctx.quadraticCurveTo(cx + 18, cy - 16, cx + 14, cy - 4);
  ctx.lineTo(cx + 8, cy + 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#A00000';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 10);
  ctx.lineTo(cx - 7, cy - 18);
  ctx.lineTo(cx - 3, cy - 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy - 10);
  ctx.lineTo(cx + 7, cy - 18);
  ctx.lineTo(cx + 5, cy - 10);
  ctx.fill();

  // Eyes (yellow glow)
  drawEyes(ctx, cx, cy - 6, 4, '#ffff00', 2, direction);

  // Legs
  ctx.fillStyle = '#6B0000';
  ctx.fillRect(cx - 6, cy + 10, 4, 4);
  ctx.fillRect(cx + 2, cy + 10, 4, 4);

  // Tail
  ctx.strokeStyle = '#8B0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const tailDir = direction === Direction.EAST ? -1 : direction === Direction.WEST ? 1 : (Math.random() > 0.5 ? 1 : -1);
  ctx.moveTo(cx + tailDir * 8, cy + 8);
  ctx.quadraticCurveTo(cx + tailDir * 14, cy + 4, cx + tailDir * 12, cy - 2);
  ctx.stroke();
  // Tail tip (spade)
  ctx.fillStyle = '#6B0000';
  ctx.beginPath();
  ctx.moveTo(cx + tailDir * 12, cy - 4);
  ctx.lineTo(cx + tailDir * 14, cy - 6);
  ctx.lineTo(cx + tailDir * 12, cy - 2);
  ctx.fill();
}

function drawDragon(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Wings (large)
  ctx.fillStyle = '#8B0000';
  const wingSide = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 4);
  ctx.quadraticCurveTo(cx - 16, cy - 20, cx - 8, cy - 16);
  ctx.lineTo(cx - 4, cy - 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 4);
  ctx.quadraticCurveTo(cx + 16, cy - 20, cx + 8, cy - 16);
  ctx.lineTo(cx + 4, cy - 4);
  ctx.fill();

  // Body
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CC3333';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly (lighter)
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 10 : direction === Direction.WEST ? -10 : 0;
  const hy = direction === Direction.NORTH ? -10 : direction === Direction.SOUTH ? 6 : -5;
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy + hy, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  if (direction !== Direction.NORTH) {
    const sx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
    ctx.fillStyle = '#CC3333';
    ctx.beginPath();
    ctx.ellipse(cx + hx + sx, cy + hy + 1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nostrils with smoke
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.arc(cx + hx + sx * 1.5, cy + hy, 1, 0, Math.PI * 2);
    ctx.arc(cx + hx + sx * 1.5, cy + hy + 2, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Horns
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(cx + hx - 4, cy + hy - 4);
  ctx.lineTo(cx + hx - 6, cy + hy - 12);
  ctx.lineTo(cx + hx - 2, cy + hy - 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + hx + 2, cy + hy - 5);
  ctx.lineTo(cx + hx + 6, cy + hy - 12);
  ctx.lineTo(cx + hx + 4, cy + hy - 4);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 5, '#ffcc00', 2, direction);

  // Tail
  ctx.strokeStyle = '#B22222';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const tx = direction === Direction.EAST ? -12 : direction === Direction.WEST ? 12 : 0;
  ctx.beginPath();
  ctx.moveTo(cx + tx, cy + 4);
  ctx.quadraticCurveTo(cx + tx * 1.5, cy + 10, cx + tx * 1.8, cy + 2);
  ctx.stroke();
  // Tail spike
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(cx + tx * 1.8 - 2, cy + 2);
  ctx.lineTo(cx + tx * 2, cy - 1);
  ctx.lineTo(cx + tx * 1.8 + 2, cy + 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#8B1A1A';
  ctx.fillRect(cx - 8, cy + 7, 4, 5);
  ctx.fillRect(cx - 2, cy + 7, 4, 5);
  ctx.fillRect(cx + 3, cy + 7, 4, 5);
  ctx.fillRect(cx + 8, cy + 7, 4, 5);

  // Claws
  ctx.fillStyle = '#333';
  for (const lx of [-8, -2, 3, 8]) {
    ctx.beginPath();
    ctx.moveTo(cx + lx, cy + 12);
    ctx.lineTo(cx + lx - 1, cy + 14);
    ctx.lineTo(cx + lx + 1, cy + 14);
    ctx.fill();
  }
}

function drawRabbit(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#D2B48C';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Long ears
  const earAngle = direction === Direction.EAST ? -0.3 : direction === Direction.WEST ? 0.3 : 0;
  ctx.save();
  ctx.translate(cx - 2, cy - 7);
  ctx.rotate(-0.2 + earAngle);
  ctx.fillStyle = '#D2B48C';
  ctx.fillRect(-1.5, -8, 3, 8);
  ctx.fillStyle = '#F5CBA7';
  ctx.fillRect(-0.5, -7, 1, 6);
  ctx.restore();
  ctx.save();
  ctx.translate(cx + 2, cy - 7);
  ctx.rotate(0.2 - earAngle);
  ctx.fillStyle = '#D2B48C';
  ctx.fillRect(-1.5, -8, 3, 8);
  ctx.fillStyle = '#F5CBA7';
  ctx.fillRect(-0.5, -7, 1, 6);
  ctx.restore();

  // Eyes
  drawEyes(ctx, cx, cy - 4, 3, '#222', 1.2, direction);

  // Tail (fluffy)
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 3, 0, Math.PI * 2);
  ctx.fill();

  // Paws
  ctx.fillStyle = '#C4A87C';
  ctx.fillRect(cx - 4, cy + 4, 2, 3);
  ctx.fillRect(cx + 2, cy + 4, 2, 3);
}

function drawBee(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Wings (buzzing)
  const wingOff = Math.sin(Date.now() / 50) * 3;
  ctx.fillStyle = 'rgba(200,220,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 8 + wingOff, 5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - 8 + wingOff, 5, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body (striped)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Black stripes
  ctx.fillStyle = '#222';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(cx - 5, cy + i * 4 - 1, 10, 2);
  }

  // Head
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(cx, cy - 7, 3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx, cy - 7, 2, '#fff', 1, direction);

  // Stinger
  if (direction === Direction.SOUTH || direction === Direction.EAST || direction === Direction.WEST) {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    const stDir = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
    ctx.moveTo(cx - 1 + stDir * 5, cy + 7);
    ctx.lineTo(cx + stDir * 8, cy + 8);
    ctx.lineTo(cx + 1 + stDir * 5, cy + 7);
    ctx.fill();
  }
}

function drawBoar(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body (stocky)
  ctx.fillStyle = '#5C3317';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6B4226';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bristles (spiky fur on back)
  ctx.strokeStyle = '#3A1A08';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 2, cy - 5);
    ctx.lineTo(cx + i * 2 + 1, cy - 8);
    ctx.stroke();
  }

  // Head
  const hx = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 0;
  ctx.fillStyle = '#5C3317';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy - 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#8B6B4A';
    const sx = direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0;
    ctx.beginPath();
    ctx.ellipse(cx + hx + sx, cy, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nostrils
    ctx.fillStyle = '#3A1A08';
    ctx.beginPath();
    ctx.arc(cx + hx + sx - 1, cy, 0.8, 0, Math.PI * 2);
    ctx.arc(cx + hx + sx + 1, cy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tusks
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.moveTo(cx + hx - 3, cy);
    ctx.lineTo(cx + hx - 4, cy + 4);
    ctx.lineTo(cx + hx - 2, cy + 1);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + hx + 3, cy);
    ctx.lineTo(cx + hx + 4, cy + 4);
    ctx.lineTo(cx + hx + 2, cy + 1);
    ctx.fill();
  }

  // Eyes (small, angry)
  drawEyes(ctx, cx + hx, cy - 3, 3, '#ff2200', 1.5, direction);

  // Legs
  ctx.fillStyle = '#4A2810';
  ctx.fillRect(cx - 7, cy + 6, 3, 4);
  ctx.fillRect(cx - 2, cy + 6, 3, 4);
  ctx.fillRect(cx + 3, cy + 6, 3, 4);
  ctx.fillRect(cx + 7, cy + 6, 3, 4);
}

function drawBandit(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#2C2C2C';
  ctx.fillRect(cx - 5, cy - 2, 10, 12);

  // Head
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hood/mask
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - 5, cy - 7, 10, 3);
  if (direction === Direction.SOUTH) {
    ctx.fillRect(cx - 4, cy - 7, 8, 5);
  }

  // Eyes
  drawEyes(ctx, cx, cy - 5, 3, '#fff', 1.2, direction);

  // Belt
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 5, cy + 5, 10, 2);

  // Sword
  const swordOff = direction === Direction.EAST ? 7 : direction === Direction.WEST ? -7 : 5;
  ctx.fillStyle = '#aaa';
  ctx.fillRect(cx + swordOff - 1, cy - 4, 2, 10);
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(cx + swordOff - 3, cy - 1, 6, 2);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cx + swordOff - 2, cy + 5, 4, 3);

  // Legs
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(cx - 4, cy + 8, 3, 4);
  ctx.fillRect(cx + 1, cy + 8, 3, 4);
}

function drawPirate(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(cx - 5, cy - 2, 10, 12);

  // Head
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Bandana
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 5, Math.PI, 0);
  ctx.fill();

  // Eye patch
  if (direction !== Direction.NORTH && direction !== Direction.WEST) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 8);
    ctx.lineTo(cx - 3, cy - 9);
    ctx.stroke();
  }

  // Eye
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#fff';
    const ex = direction === Direction.WEST ? 2 : -2;
    ctx.beginPath();
    ctx.arc(cx + ex, cy - 5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cutlass
  const cOff = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 6;
  ctx.fillStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(cx + cOff, cy - 4);
  ctx.quadraticCurveTo(cx + cOff + 3, cy + 4, cx + cOff - 1, cy + 8);
  ctx.lineTo(cx + cOff + 1, cy + 8);
  ctx.quadraticCurveTo(cx + cOff + 1, cy + 4, cx + cOff, cy - 4);
  ctx.fill();
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cx + cOff - 2, cy + 7, 4, 3);

  // Legs
  ctx.fillStyle = '#2C2C2C';
  ctx.fillRect(cx - 4, cy + 8, 3, 4);
  ctx.fillRect(cx + 1, cy + 8, 3, 4);
}

function drawMushroom(ctx: Ctx, cx: number, cy: number, _direction: Direction) {
  // Stem
  ctx.fillStyle = '#F5F5DC';
  ctx.fillRect(cx - 3, cy - 2, 6, 10);

  // Cap
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 10, 7, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 10, 2, 0, 0, Math.PI);
  ctx.fill();

  // Spots
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 7, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 6, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes on stem
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(cx - 2, cy + 2, 1, 0, Math.PI * 2);
  ctx.arc(cx + 2, cy + 2, 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawGolem(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Large rocky body
  ctx.fillStyle = '#5A5A5A';
  ctx.beginPath();
  ctx.rect(cx - 10, cy - 4, 20, 18);
  ctx.fill();

  // Rock texture
  ctx.fillStyle = '#6A6A6A';
  ctx.fillRect(cx - 8, cy - 2, 6, 4);
  ctx.fillRect(cx + 2, cy + 2, 7, 5);
  ctx.fillRect(cx - 5, cy + 6, 4, 4);

  // Head (blocky)
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.rect(cx - 6, cy - 12, 12, 10);
  ctx.fill();

  // Glowing eyes
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 4;
  drawEyes(ctx, cx, cy - 8, 4, '#00ff88', 2, direction);
  ctx.shadowBlur = 0;

  // Arms (rocky)
  ctx.fillStyle = '#4A4A4A';
  const armDir = direction === Direction.EAST ? 2 : direction === Direction.WEST ? -2 : 0;
  ctx.fillRect(cx - 13, cy - 2, 4, 10);
  ctx.fillRect(cx + 9, cy - 2, 4, 10);

  // Cracks (glowing green)
  ctx.strokeStyle = '#00ff44';
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 10);
  ctx.lineTo(cx - 1, cy - 4);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawVampire(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Cape
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 12);
  ctx.quadraticCurveTo(cx - 12, cy, cx - 6, cy - 6);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.quadraticCurveTo(cx + 12, cy, cx + 10, cy + 12);
  ctx.fill();

  // Body
  ctx.fillStyle = '#2a0000';
  ctx.fillRect(cx - 5, cy - 2, 10, 12);

  // Head (pale)
  ctx.fillStyle = '#F0E0D0';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 5, Math.PI + 0.3, -0.3);
  ctx.fill();

  // Eyes (red)
  drawEyes(ctx, cx, cy - 6, 3, '#ff0000', 1.5, direction);

  // Fangs
  if (direction === Direction.SOUTH) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2);
    ctx.lineTo(cx - 1, cy + 1);
    ctx.lineTo(cx, cy - 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + 1, cy + 1);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.fill();
  }

  // Cape collar
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 4);
  ctx.lineTo(cx - 4, cy - 8);
  ctx.lineTo(cx + 4, cy - 8);
  ctx.lineTo(cx + 7, cy - 4);
  ctx.fill();
}

function drawNecromancer(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Robe
  ctx.fillStyle = '#0D0D2B';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy + 12);
  ctx.lineTo(cx - 5, cy - 2);
  ctx.lineTo(cx + 5, cy - 2);
  ctx.lineTo(cx + 7, cy + 12);
  ctx.fill();

  // Head (hooded)
  ctx.fillStyle = '#1a1a3a';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
  ctx.fill();

  // Face shadow
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, 4, 0, Math.PI);
  ctx.fill();

  // Glowing eyes
  ctx.fillStyle = '#00ff66';
  ctx.shadowColor = '#00ff66';
  ctx.shadowBlur = 4;
  drawEyes(ctx, cx, cy - 6, 3, '#00ff66', 1.5, direction);
  ctx.shadowBlur = 0;

  // Skull staff
  const staffOff = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 6;
  ctx.strokeStyle = '#4A3A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + staffOff, cy + 10);
  ctx.lineTo(cx + staffOff, cy - 14);
  ctx.stroke();
  // Skull on staff
  ctx.fillStyle = '#E8DCC8';
  ctx.beginPath();
  ctx.arc(cx + staffOff, cy - 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx + staffOff - 1, cy - 15, 0.8, 0, Math.PI * 2);
  ctx.arc(cx + staffOff + 1, cy - 15, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawDarkMage(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Robe
  ctx.fillStyle = '#2C0845';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy + 12);
  ctx.lineTo(cx - 5, cy - 2);
  ctx.lineTo(cx + 5, cy - 2);
  ctx.lineTo(cx + 7, cy + 12);
  ctx.fill();

  // Head
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Hat (pointy wizard hat)
  ctx.fillStyle = '#1A0530';
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 8);
  ctx.lineTo(cx, cy - 20);
  ctx.lineTo(cx + 7, cy - 8);
  ctx.fill();
  ctx.fillRect(cx - 8, cy - 9, 16, 3);

  // Eyes
  drawEyes(ctx, cx, cy - 6, 3, '#cc44ff', 1.5, direction);

  // Staff
  const sOff = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 6;
  ctx.strokeStyle = '#5A3A6A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + sOff, cy + 10);
  ctx.lineTo(cx + sOff, cy - 14);
  ctx.stroke();
  // Orb on staff
  ctx.fillStyle = '#9944ff';
  ctx.shadowColor = '#9944ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx + sOff, cy - 15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHydra(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body (large snake-like)
  ctx.fillStyle = '#1A6B1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Multiple heads (3)
  const offsets = [-6, 0, 6];
  for (const ox of offsets) {
    const hx = cx + ox;
    const hy = cy - 8;
    // Neck
    ctx.strokeStyle = '#1A6B1A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hx, cy - 2);
    ctx.quadraticCurveTo(hx + ox * 0.3, hy + 4, hx + ox * 0.5, hy);
    ctx.stroke();
    // Head
    ctx.fillStyle = '#1A6B1A';
    ctx.beginPath();
    ctx.arc(hx + ox * 0.5, hy, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    if (direction !== Direction.NORTH) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(hx + ox * 0.5 - 1.5, hy - 1, 1, 0, Math.PI * 2);
      ctx.arc(hx + ox * 0.5 + 1.5, hy - 1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tail
  ctx.strokeStyle = '#1A6B1A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const tailDir = direction === Direction.EAST ? -1 : 1;
  ctx.moveTo(cx + tailDir * 10, cy + 6);
  ctx.quadraticCurveTo(cx + tailDir * 16, cy + 10, cx + tailDir * 18, cy + 4);
  ctx.stroke();
}

function drawPhoenix(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  const time = Date.now() / 200;

  // Flame wings
  ctx.save();
  ctx.globalAlpha = 0.7;
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = side === -1 ? '#FF6600' : '#FF4500';
    ctx.beginPath();
    ctx.moveTo(cx + side * 5, cy - 4);
    ctx.quadraticCurveTo(cx + side * 18, cy - 18 + Math.sin(time) * 3, cx + side * 14, cy + 2);
    ctx.lineTo(cx + side * 5, cy + 2);
    ctx.fill();
  }
  ctx.restore();

  // Body
  ctx.fillStyle = '#FF8C00';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FF6600';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Crest
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 10);
  ctx.lineTo(cx, cy - 16 + Math.sin(time) * 2);
  ctx.lineTo(cx + 2, cy - 10);
  ctx.fill();

  // Beak
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#8B4513';
    const bDir = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + bDir * 4, cy - 6);
    ctx.lineTo(cx + bDir * 8, cy - 5);
    ctx.lineTo(cx + bDir * 4, cy - 4);
    ctx.fill();
  }

  // Eyes
  drawEyes(ctx, cx, cy - 6, 3, '#ff0000', 1.5, direction);

  // Tail flames
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#FFD700';
  const tDir = direction === Direction.EAST ? -1 : direction === Direction.WEST ? 1 : 0;
  ctx.beginPath();
  ctx.moveTo(cx + tDir * 7, cy + 4);
  ctx.quadraticCurveTo(cx + tDir * 14, cy + 8 + Math.sin(time) * 3, cx + tDir * 12, cy);
  ctx.quadraticCurveTo(cx + tDir * 16, cy + 2, cx + tDir * 18, cy - 4 + Math.sin(time + 1) * 2);
  ctx.lineTo(cx + tDir * 14, cy + 2);
  ctx.quadraticCurveTo(cx + tDir * 12, cy + 6, cx + tDir * 7, cy + 4);
  ctx.fill();
  ctx.restore();
}

// Lich King, Kraken, Demon Lord, Ancient Dragon use modified versions of existing drawings

function drawLichKing(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Base: necromancer style but larger and more menacing
  drawNecromancer(ctx, cx, cy, direction);
  // Crown overlay
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 12);
  ctx.lineTo(cx - 6, cy - 18);
  ctx.lineTo(cx - 3, cy - 14);
  ctx.lineTo(cx, cy - 19);
  ctx.lineTo(cx + 3, cy - 14);
  ctx.lineTo(cx + 6, cy - 18);
  ctx.lineTo(cx + 5, cy - 12);
  ctx.fill();
  // Aura
  ctx.save();
  ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 400) * 0.1;
  ctx.strokeStyle = '#00ff66';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 18 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawKraken(ctx: Ctx, cx: number, cy: number, _direction: Direction) {
  const time = Date.now() / 300;
  // Tentacles
  ctx.strokeStyle = '#1B4F72';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const len = 12 + Math.sin(time + i) * 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 6, cy + 4);
    ctx.quadraticCurveTo(
      cx + Math.cos(angle + 0.3) * len,
      cy + Math.sin(angle) * len + 4,
      cx + Math.cos(angle - 0.2) * (len + 3),
      cy + Math.sin(angle) * (len - 2) + 8
    );
    ctx.stroke();
  }

  // Body / mantle
  ctx.fillStyle = '#1B4F72';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#21618C';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 3, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (large, yellow)
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 4, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - 4, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 4, 1, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - 4, 1, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawDemonLord(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  drawDemon(ctx, cx, cy, direction);
  // Extra size / crown
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 16);
  ctx.lineTo(cx - 7, cy - 22);
  ctx.lineTo(cx - 3, cy - 18);
  ctx.lineTo(cx, cy - 23);
  ctx.lineTo(cx + 3, cy - 18);
  ctx.lineTo(cx + 7, cy - 22);
  ctx.lineTo(cx + 5, cy - 16);
  ctx.fill();
  // Aura
  ctx.save();
  ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 300) * 0.1;
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 20 + Math.sin(Date.now() / 250) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawAncientDragon(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  drawDragon(ctx, cx, cy, direction);
  // Extra crown / aura
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#ff4400';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// =============================================
// New Animal Drawing Functions
// =============================================

function drawDeer(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C0763A';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 7 : direction === Direction.WEST ? -7 : 0;
  const hy = direction === Direction.NORTH ? -7 : direction === Direction.SOUTH ? 5 : -3;
  ctx.fillStyle = '#B8702D';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Antlers (branching)
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  const ax = cx + hx;
  const ay = cy + hy;
  ctx.beginPath();
  ctx.moveTo(ax - 2, ay - 3);
  ctx.lineTo(ax - 4, ay - 8);
  ctx.moveTo(ax - 3, ay - 6);
  ctx.lineTo(ax - 6, ay - 8);
  ctx.moveTo(ax + 2, ay - 3);
  ctx.lineTo(ax + 4, ay - 8);
  ctx.moveTo(ax + 3, ay - 6);
  ctx.lineTo(ax + 6, ay - 8);
  ctx.stroke();

  // Gentle eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#3E2723', 1.2, direction);

  // Legs (thin)
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(cx - 4, cy + 5, 2, 5);
  ctx.fillRect(cx + 2, cy + 5, 2, 5);

  // White belly spot
  ctx.fillStyle = '#F5DEB3';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBear(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Large body
  ctx.fillStyle = '#5C3317';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7B4A2A';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 0;
  const hy = direction === Direction.NORTH ? -8 : direction === Direction.SOUTH ? 6 : -4;
  ctx.fillStyle = '#6B3A1A';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Round ears
  ctx.fillStyle = '#5C3317';
  ctx.beginPath();
  ctx.arc(cx + hx - 4, cy + hy - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 4, cy + hy - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Inner ears
  ctx.fillStyle = '#8B5E3C';
  ctx.beginPath();
  ctx.arc(cx + hx - 4, cy + hy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 4, cy + hy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#A0724A';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy + hy + 2, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#2C1A0E';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy + 1, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Small eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 4, '#1A1A1A', 1.5, direction);

  // Thick legs
  ctx.fillStyle = '#4A2810';
  ctx.fillRect(cx - 6, cy + 6, 4, 5);
  ctx.fillRect(cx + 2, cy + 6, 4, 5);
}

function drawCrocodile(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Long body
  ctx.fillStyle = '#2E5A1E';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scale texture (darker bumps along back)
  ctx.fillStyle = '#1E4A0E';
  for (let i = -6; i <= 6; i += 3) {
    ctx.beginPath();
    ctx.arc(cx + i, cy - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lighter belly
  ctx.fillStyle = '#6B8E4E';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Long snout
  const sx = direction === Direction.EAST ? 10 : direction === Direction.WEST ? -10 : 0;
  const sy = direction === Direction.NORTH ? -10 : direction === Direction.SOUTH ? 8 : -5;
  ctx.fillStyle = '#3A6A2E';
  ctx.beginPath();
  ctx.ellipse(cx + sx, cy + sy - 1, 6, 3, direction === Direction.NORTH || direction === Direction.SOUTH ? 0 : direction === Direction.EAST ? 0.3 : -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Teeth
  ctx.fillStyle = '#FFFFFF';
  const teethCount = 4;
  for (let i = 0; i < teethCount; i++) {
    const tx = cx + sx + (direction === Direction.EAST ? 2 + i * 2 : direction === Direction.WEST ? -2 - i * 2 : -3 + i * 2);
    const ty = cy + sy + (direction === Direction.NORTH ? -3 : direction === Direction.SOUTH ? 3 : 0) + (i % 2 === 0 ? -1 : 1);
    ctx.fillRect(tx - 0.5, ty - 0.5, 1, 1);
  }

  // Eyes on top of head
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx + sx - 2, cy + sy - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + sx + 2, cy + sy - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + sx - 2, cy + sy - 2, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + sx + 2, cy + sy - 2, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Short legs
  ctx.fillStyle = '#2E5A1E';
  ctx.fillRect(cx - 6, cy + 6, 3, 3);
  ctx.fillRect(cx + 3, cy + 6, 3, 3);
  ctx.fillRect(cx - 2, cy + 6, 3, 3);
}

function drawFrog(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body (sitting)
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big back legs (folded)
  ctx.fillStyle = '#1E7A1E';
  // Left leg
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy + 4, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right leg
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy + 4, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Wide mouth
  ctx.strokeStyle = '#0D5F0D';
  ctx.lineWidth = 1.5;
  const my = direction === Direction.NORTH ? cy - 3 : direction === Direction.SOUTH ? cy + 3 : cy - 2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, my);
  ctx.quadraticCurveTo(cx, my + 3, cx + 5, my);
  ctx.stroke();

  // Protruding eyes on top of head
  ctx.fillStyle = '#1E7A1E';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 4, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Light belly
  ctx.fillStyle = '#90EE90';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Front legs (small)
  ctx.fillStyle = '#1E7A1E';
  ctx.fillRect(cx - 5, cy + 3, 2, 3);
  ctx.fillRect(cx + 3, cy + 3, 2, 3);
}

function drawHawk(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body
  ctx.fillStyle = '#4A3520';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6B4E30';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spread wings
  ctx.fillStyle = '#3A2510';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 2);
  ctx.lineTo(cx - 14, cy - 8);
  ctx.lineTo(cx - 12, cy - 2);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 2);
  ctx.lineTo(cx + 14, cy - 8);
  ctx.lineTo(cx + 12, cy - 2);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.fill();

  // Wing feather details
  ctx.fillStyle = '#5A3E20';
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 3);
  ctx.lineTo(cx - 12, cy - 7);
  ctx.lineTo(cx - 10, cy - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 3);
  ctx.lineTo(cx + 12, cy - 7);
  ctx.lineTo(cx + 10, cy - 3);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
  const hy = direction === Direction.NORTH ? -5 : direction === Direction.SOUTH ? 3 : -3;
  ctx.fillStyle = '#5A3E20';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Hooked beak
  ctx.fillStyle = '#FFD700';
  const bx = cx + hx + (direction === Direction.EAST ? 3 : direction === Direction.WEST ? -3 : 0);
  const by = cy + hy + (direction === Direction.NORTH ? -2 : direction === Direction.SOUTH ? 2 : 1);
  ctx.beginPath();
  ctx.moveTo(bx - 1, by);
  ctx.lineTo(bx, by + 3);
  ctx.lineTo(bx + 1, by);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#FF4500', 1, direction);

  // Talons
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 3);
  ctx.lineTo(cx - 3, cy + 7);
  ctx.moveTo(cx, cy + 3);
  ctx.lineTo(cx, cy + 7);
  ctx.moveTo(cx + 2, cy + 3);
  ctx.lineTo(cx + 3, cy + 7);
  ctx.stroke();
}

function drawCrab(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Body (oval shell)
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D4442A';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell pattern
  ctx.strokeStyle = '#8B1A1A';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx, cy + 4);
  ctx.stroke();

  // Two large claws
  ctx.fillStyle = '#CC3333';
  // Left claw
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 3, 4, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx - 12, cy - 4, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 9, cy - 5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Right claw
  ctx.fillStyle = '#CC3333';
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy - 3, 4, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx + 12, cy - 4, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 9, cy - 5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Multiple legs
  ctx.strokeStyle = '#B22222';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    ctx.beginPath();
    ctx.moveTo(cx + i * 3, cy + 4);
    ctx.lineTo(cx + i * 5, cy + 8);
    ctx.stroke();
  }

  // Eyestalks
  ctx.strokeStyle = '#CC3333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 4);
  ctx.lineTo(cx - 3, cy - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 4);
  ctx.lineTo(cx + 3, cy - 8);
  ctx.stroke();

  // Eyes on stalks
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, cy - 8, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMinotaur(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Large muscular humanoid body
  ctx.fillStyle = '#6B3A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (bull)
  const hx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
  const hy = direction === Direction.NORTH ? -12 : direction === Direction.SOUTH ? 8 : -8;
  ctx.fillStyle = '#5C3317';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + hx - 4, cy + hy - 2);
  ctx.quadraticCurveTo(cx + hx - 7, cy + hy - 10, cx + hx - 3, cy + hy - 11);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + hx + 4, cy + hy - 2);
  ctx.quadraticCurveTo(cx + hx + 7, cy + hy - 10, cx + hx + 3, cy + hy - 11);
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#7B4A28';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy + hy + 2, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nostrils
  ctx.fillStyle = '#2C1A0E';
  ctx.beginPath();
  ctx.arc(cx + hx - 1, cy + hy + 2, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 1, cy + hy + 2, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 4, '#FF0000', 1.5, direction);

  // Arms / hands
  ctx.fillStyle = '#6B3A1A';
  const armOff = direction === Direction.EAST ? 2 : direction === Direction.WEST ? -2 : 0;
  ctx.fillRect(cx - 8 + armOff, cy - 2, 3, 7);
  ctx.fillRect(cx + 5 + armOff, cy - 2, 3, 7);

  // Axe weapon
  ctx.fillStyle = '#8B8B8B';
  const axeX = direction === Direction.EAST ? cx + 9 : direction === Direction.WEST ? cx - 11 : cx + 8;
  const axeY = cy - 3;
  ctx.fillRect(axeX, axeY, 2, 10);
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.moveTo(axeX + (direction === Direction.WEST ? 2 : 0), axeY);
  ctx.lineTo(axeX + (direction === Direction.WEST ? 6 : -4), axeY + 2);
  ctx.lineTo(axeX + (direction === Direction.WEST ? 2 : 0), axeY + 4);
  ctx.fill();

  // Furry legs
  ctx.fillStyle = '#4A2810';
  ctx.fillRect(cx - 4, cy + 8, 3, 5);
  ctx.fillRect(cx + 1, cy + 8, 3, 5);
  // Hooves
  ctx.fillStyle = '#2C1A0E';
  ctx.fillRect(cx - 4, cy + 12, 3, 2);
  ctx.fillRect(cx + 1, cy + 12, 3, 2);
}

function drawCobra(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Like snake but larger with hood
  // Hood (flared neck)
  ctx.fillStyle = '#1A4A0E';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hood detail pattern
  ctx.fillStyle = '#2E6A1E';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hood markings (V-shapes)
  ctx.strokeStyle = '#0D3F08';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 6);
  ctx.lineTo(cx, cy - 2);
  ctx.lineTo(cx + 5, cy - 6);
  ctx.stroke();

  // Body coils
  ctx.fillStyle = '#1A4A0E';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2E6A1E';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy + 4, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  const tx = direction === Direction.EAST ? 6 : direction === Direction.WEST ? -6 : 0;
  ctx.fillStyle = '#1A4A0E';
  ctx.beginPath();
  ctx.moveTo(cx + tx - 2, cy + 8);
  ctx.quadraticCurveTo(cx + tx + 3, cy + 10, cx + tx + 1, cy + 12);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1A4A0E';
  ctx.stroke();

  // Head
  const hx = direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0;
  const hy = direction === Direction.NORTH ? -9 : direction === Direction.SOUTH ? 3 : -7;
  ctx.fillStyle = '#1A4A0E';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Menacing eyes
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx + hx - 2, cy + hy - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 2, cy + hy - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx + hx - 2, cy + hy - 1, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 2, cy + hy - 1, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Forked tongue
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 1;
  const tongueX = cx + hx + (direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0);
  const tongueY = cy + hy + 2;
  ctx.beginPath();
  ctx.moveTo(cx + hx, tongueY);
  ctx.lineTo(tongueX, tongueY + 3);
  ctx.moveTo(tongueX, tongueY + 3);
  ctx.lineTo(tongueX - 1.5, tongueY + 5);
  ctx.moveTo(tongueX, tongueY + 3);
  ctx.lineTo(tongueX + 1.5, tongueY + 5);
  ctx.stroke();

  // Scale pattern
  ctx.fillStyle = '#0D3F08';
  for (let i = -4; i <= 4; i += 2) {
    ctx.beginPath();
    ctx.arc(cx + i, cy + 5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWildDog(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#5A3A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7B5B3A';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#A0784A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 6 : direction === Direction.WEST ? -6 : 0;
  const hy = direction === Direction.NORTH ? -6 : direction === Direction.SOUTH ? 4 : -2;
  ctx.fillStyle = '#7B5B3A';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 5, 0, Math.PI * 2);
  ctx.fill();

  // Pointed ears
  ctx.fillStyle = '#5A3A1A';
  ctx.beginPath();
  ctx.moveTo(cx + hx - 3, cy + hy - 3);
  ctx.lineTo(cx + hx - 2, cy + hy - 8);
  ctx.lineTo(cx + hx, cy + hy - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + hx + 2, cy + hy - 3);
  ctx.lineTo(cx + hx + 3, cy + hy - 8);
  ctx.lineTo(cx + hx + 5, cy + hy - 3);
  ctx.fill();

  // Snout
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#A0784A';
    const sx = direction === Direction.EAST ? 3 : direction === Direction.WEST ? -3 : 0;
    ctx.beginPath();
    ctx.ellipse(cx + hx + sx, cy + hy + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx + hx + sx * 1.2, cy + hy + 1, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#ff3333', 2, direction);

  // Tail
  const tailX = direction === Direction.EAST ? -8 : direction === Direction.WEST ? 8 : 0;
  ctx.strokeStyle = '#7B5B3A';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + tailX, cy + 1);
  ctx.quadraticCurveTo(cx + tailX + (direction === Direction.SOUTH ? -5 : 5), cy - 4, cx + tailX + (direction === Direction.SOUTH ? -7 : 7), cy - 2);
  ctx.stroke();

  // Legs (4 visible from south)
  ctx.fillStyle = '#5A3A1A';
  ctx.fillRect(cx - 6, cy + 5, 2, 5);
  ctx.fillRect(cx - 2, cy + 5, 2, 5);
  ctx.fillRect(cx + 2, cy + 5, 2, 5);
  ctx.fillRect(cx + 5, cy + 5, 2, 5);
}

function drawCat(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 11, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (graceful curved)
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#D2691E';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stripes
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.8;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 2.5, cy - 2);
    ctx.lineTo(cx + i * 2.5 + 0.5, cy + 1);
    ctx.stroke();
  }

  // Belly
  ctx.fillStyle = '#DEB887';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const hx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
  const hy = direction === Direction.NORTH ? -5 : direction === Direction.SOUTH ? 3 : -2;
  ctx.fillStyle = '#D2691E';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Pointed ears
  ctx.fillStyle = '#D2691E';
  ctx.beginPath();
  ctx.moveTo(cx + hx - 3, cy + hy - 2);
  ctx.lineTo(cx + hx - 2, cy + hy - 7);
  ctx.lineTo(cx + hx, cy + hy - 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + hx + 1, cy + hy - 2);
  ctx.lineTo(cx + hx + 3, cy + hy - 7);
  ctx.lineTo(cx + hx + 4, cy + hy - 2);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#44ff44', 1.5, direction);

  // Whiskers
  if (direction !== Direction.NORTH) {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    const wx = cx + hx;
    const wy = cy + hy + 1;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + (direction === Direction.WEST ? -7 : direction === Direction.EAST ? 7 : -5), wy - 1);
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + (direction === Direction.WEST ? -7 : direction === Direction.EAST ? 7 : 5), wy);
    if (direction === Direction.SOUTH) {
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx - 5, wy - 1);
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx - 5, wy);
    }
    ctx.stroke();
  }

  // Curled tail
  const tailX = direction === Direction.EAST ? -7 : direction === Direction.WEST ? 7 : 0;
  ctx.strokeStyle = '#D2691E';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + tailX, cy + 1);
  ctx.quadraticCurveTo(cx + tailX * 1.8, cy - 6, cx + tailX * 1.2, cy - 8);
  ctx.stroke();

  // Paws
  ctx.fillStyle = '#C0763A';
  ctx.fillRect(cx - 4, cy + 4, 2, 3);
  ctx.fillRect(cx + 1, cy + 4, 2, 3);
}

function drawToad(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wide flat body
  ctx.fillStyle = '#1A5A35';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2E8B57';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#90EE90';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warts / bumps
  ctx.fillStyle = '#1A5A35';
  const warts = [[-5, -2], [3, -3], [-2, 1], [5, 0], [0, -4], [-4, 3]];
  for (const [wx, wy] of warts) {
    ctx.beginPath();
    ctx.arc(cx + wx, cy + wy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wide mouth
  if (direction !== Direction.NORTH) {
    ctx.strokeStyle = '#1A5A35';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const mouthDir = direction === Direction.EAST ? 3 : direction === Direction.WEST ? -3 : 0;
    ctx.arc(cx + mouthDir, cy + 2, 4, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // Head (merged with body, just eyes on top)
  const hx = direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0;
  const hy = direction === Direction.NORTH ? -3 : direction === Direction.SOUTH ? 3 : 0;

  // Big bulging eyes on top of head
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 3;
  const ex1 = direction === Direction.EAST ? cx + hx + 1 : direction === Direction.WEST ? cx + hx - 1 : cx - 3;
  const ex2 = direction === Direction.EAST ? cx + hx + 1 : direction === Direction.WEST ? cx + hx - 1 : cx + 3;
  ctx.beginPath();
  ctx.arc(ex1, cy + hy - 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex2, cy + hy - 7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Pupils
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(ex1, cy + hy - 7, 0.8, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ex2, cy + hy - 7, 0.8, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Short legs
  ctx.fillStyle = '#1A5A35';
  ctx.fillRect(cx - 8, cy + 6, 3, 3);
  ctx.fillRect(cx + 5, cy + 6, 3, 3);
  ctx.fillRect(cx - 4, cy + 7, 3, 2);
  ctx.fillRect(cx + 1, cy + 7, 3, 2);
}

function drawMantis(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated sway
  const sway = Math.sin(Date.now() / 600) * 1.5;

  // Long thin body
  ctx.fillStyle = '#006400';
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy + 2, 3, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.ellipse(cx + sway - 0.5, cy + 1, 2.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen segments
  ctx.strokeStyle = '#006400';
  ctx.lineWidth = 0.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + sway - 2.5, cy + 2 + i * 2);
    ctx.lineTo(cx + sway + 2.5, cy + 2 + i * 2);
    ctx.stroke();
  }

  // Triangular head
  const hx = direction === Direction.EAST ? 2 : direction === Direction.WEST ? -2 : 0;
  const hy = direction === Direction.NORTH ? -8 : direction === Direction.SOUTH ? 6 : -8;
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.moveTo(cx + hx + sway, cy + hy + sway);
  ctx.lineTo(cx + hx - 4 + sway, cy + hy + 5 + sway);
  ctx.lineTo(cx + hx + 4 + sway, cy + hy + 5 + sway);
  ctx.closePath();
  ctx.fill();

  // Compound eyes (red)
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(cx + hx - 2 + sway, cy + hy + 3 + sway, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + hx + 2 + sway, cy + hy + 3 + sway, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Raptorial front legs (large curved claws)
  ctx.strokeStyle = '#32CD32';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const clawDir = direction === Direction.EAST ? 1 : direction === Direction.WEST ? -1 : (direction === Direction.SOUTH ? 1 : 0);
  // Left arm
  ctx.beginPath();
  ctx.moveTo(cx - 3 + sway, cy - 3);
  ctx.lineTo(cx - 8, cy - 8);
  ctx.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy - 2);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx + 3 + sway, cy - 3);
  ctx.lineTo(cx + 8, cy - 8);
  ctx.quadraticCurveTo(cx + 12, cy - 6, cx + 10, cy - 2);
  ctx.stroke();
  // Claw tips
  ctx.fillStyle = '#32CD32';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 6);
  ctx.lineTo(cx - 11, cy - 3);
  ctx.lineTo(cx - 9, cy - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 12, cy - 6);
  ctx.lineTo(cx + 11, cy - 3);
  ctx.lineTo(cx + 9, cy - 3);
  ctx.fill();

  // Back legs
  ctx.strokeStyle = '#228B22';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2 + sway, cy + 8);
  ctx.lineTo(cx - 6, cy + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2 + sway, cy + 8);
  ctx.lineTo(cx + 6, cy + 12);
  ctx.stroke();
}

function drawWarWolf(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 15, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Large muscular body (bigger than regular wolf)
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2F2F2F';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 2, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scar across body
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 2);
  ctx.lineTo(cx + 3, cy + 3);
  ctx.stroke();

  // Head (larger, more menacing)
  const hx = direction === Direction.EAST ? 10 : direction === Direction.WEST ? -10 : 0;
  const hy = direction === Direction.NORTH ? -9 : direction === Direction.SOUTH ? 5 : -4;
  ctx.fillStyle = '#2F2F2F';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy + hy, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout (wider)
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#3A3A3A';
    const sx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
    const sy = direction === Direction.SOUTH ? 3 : 0;
    ctx.beginPath();
    ctx.ellipse(cx + hx + sx, cy + hy + sy + 1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx + hx + sx * 1.2, cy + hy + sy + 1, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pointed ears (larger)
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.moveTo(cx + hx - 5, cy + hy - 4);
  ctx.lineTo(cx + hx - 3, cy + hy - 11);
  ctx.lineTo(cx + hx - 1, cy + hy - 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + hx + 2, cy + hy - 4);
  ctx.lineTo(cx + hx + 5, cy + hy - 11);
  ctx.lineTo(cx + hx + 7, cy + hy - 4);
  ctx.fill();

  // Glowing red eyes
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 4;
  drawEyes(ctx, cx + hx, cy + hy - 1, 5, '#ff0000', 2.5, direction);
  ctx.shadowBlur = 0;

  // Visible fangs
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#fff';
    const fx = direction === Direction.EAST ? 3 : direction === Direction.WEST ? -3 : 0;
    ctx.beginPath();
    ctx.moveTo(cx + hx + fx - 1, cy + hy + 3);
    ctx.lineTo(cx + hx + fx, cy + hy + 6);
    ctx.lineTo(cx + hx + fx + 1, cy + hy + 3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + hx + fx + 2, cy + hy + 3);
    ctx.lineTo(cx + hx + fx + 3, cy + hy + 5);
    ctx.lineTo(cx + hx + fx + 4, cy + hy + 3);
    ctx.fill();
  }

  // Tail (bushy)
  const tailX = direction === Direction.EAST ? -12 : direction === Direction.WEST ? 12 : 0;
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + tailX, cy + 2);
  ctx.quadraticCurveTo(cx + tailX + (direction === Direction.SOUTH ? -6 : 6), cy - 6, cx + tailX + (direction === Direction.SOUTH ? -10 : 10), cy - 4);
  ctx.stroke();

  // Legs (thicker)
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(cx - 8, cy + 6, 4, 6);
  ctx.fillRect(cx - 3, cy + 6, 4, 6);
  ctx.fillRect(cx + 2, cy + 6, 4, 6);
  ctx.fillRect(cx + 7, cy + 6, 4, 6);
}

function drawWildBoar(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wide stocky body
  ctx.fillStyle = '#3B2716';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5C4033';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bristly back line
  ctx.strokeStyle = '#3B2716';
  ctx.lineWidth = 1.5;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 2, cy - 5);
    ctx.lineTo(cx + i * 2 + 0.5, cy - 8);
    ctx.stroke();
  }

  // Head
  const hx = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 0;
  ctx.fillStyle = '#5C4033';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy - 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#7B5B4A';
    const sx = direction === Direction.EAST ? 4 : direction === Direction.WEST ? -4 : 0;
    ctx.beginPath();
    ctx.ellipse(cx + hx + sx, cy, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nostrils
    ctx.fillStyle = '#2A1A0A';
    ctx.beginPath();
    ctx.arc(cx + hx + sx - 1, cy, 0.8, 0, Math.PI * 2);
    ctx.arc(cx + hx + sx + 1, cy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Prominent tusks curving up from snout
  if (direction !== Direction.NORTH) {
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.moveTo(cx + hx - 3, cy + 1);
    ctx.quadraticCurveTo(cx + hx - 5, cy + 6, cx + hx - 4, cy + 2);
    ctx.lineTo(cx + hx - 2, cy + 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + hx + 3, cy + 1);
    ctx.quadraticCurveTo(cx + hx + 5, cy + 6, cx + hx + 4, cy + 2);
    ctx.lineTo(cx + hx + 2, cy + 2);
    ctx.fill();
  }

  // Eyes (small, angry)
  drawEyes(ctx, cx + hx, cy - 3, 3, '#cc3333', 1.5, direction);

  // Short thick legs
  ctx.fillStyle = '#3B2716';
  ctx.fillRect(cx - 7, cy + 6, 3, 4);
  ctx.fillRect(cx - 2, cy + 6, 3, 4);
  ctx.fillRect(cx + 3, cy + 6, 3, 4);
  ctx.fillRect(cx + 7, cy + 6, 3, 4);
}

function drawStoneGolem(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Large rectangular body
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.rect(cx - 11, cy - 4, 22, 20);
  ctx.fill();
  ctx.fillStyle = '#696969';
  ctx.beginPath();
  ctx.rect(cx - 10, cy - 3, 20, 18);
  ctx.fill();

  // Rock texture patches
  ctx.fillStyle = '#5A5A5A';
  ctx.fillRect(cx - 8, cy - 1, 6, 4);
  ctx.fillRect(cx + 2, cy + 3, 7, 5);
  ctx.fillRect(cx - 5, cy + 7, 4, 4);

  // Glowing core crystal in chest
  ctx.fillStyle = '#00CED1';
  ctx.shadowColor = '#00CED1';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx - 2, cy + 6);
  ctx.lineTo(cx, cy + 10);
  ctx.lineTo(cx + 2, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Cracks with glowing lines
  const glowAlpha = 0.4 + Math.sin(Date.now() / 500) * 0.3;
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  ctx.strokeStyle = '#00CED1';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 10);
  ctx.lineTo(cx - 2, cy - 4);
  ctx.lineTo(cx - 5, cy + 2);
  ctx.lineTo(cx - 3, cy + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy - 8);
  ctx.lineTo(cx + 4, cy - 2);
  ctx.lineTo(cx + 7, cy + 4);
  ctx.stroke();
  ctx.restore();

  // Blocky head
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.rect(cx - 7, cy - 14, 14, 12);
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.rect(cx - 6, cy - 13, 12, 10);
  ctx.fill();

  // Blue glowing eyes
  ctx.fillStyle = '#00CED1';
  ctx.shadowColor = '#00CED1';
  ctx.shadowBlur = 4;
  drawEyes(ctx, cx, cy - 10, 5, '#00CED1', 2.5, direction);
  ctx.shadowBlur = 0;

  // Blocky arms
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(cx - 15, cy - 2, 5, 12);
  ctx.fillRect(cx + 10, cy - 2, 5, 12);
  // Fists
  ctx.fillStyle = '#555';
  ctx.fillRect(cx - 16, cy + 9, 7, 5);
  ctx.fillRect(cx + 9, cy + 9, 7, 5);

  // Legs (short, blocky)
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(cx - 8, cy + 14, 6, 4);
  ctx.fillRect(cx + 2, cy + 14, 6, 4);

  // Crack details on body
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy - 2);
  ctx.lineTo(cx + 5, cy + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + 1);
  ctx.lineTo(cx - 3, cy + 9);
  ctx.stroke();
}

function drawGhost(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow (faint)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 400) * 0.15;

  // Ghostly body (upper torso)
  ctx.fillStyle = '#B0C4DE';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 10);
  ctx.quadraticCurveTo(cx - 10, cy - 2, cx - 6, cy - 8);
  ctx.lineTo(cx + 6, cy - 8);
  ctx.quadraticCurveTo(cx + 10, cy - 2, cx + 8, cy + 10);
  ctx.fill();

  // Wavy bottom edge using sine wave
  ctx.fillStyle = '#B0C4DE';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 8);
  for (let x = -8; x <= 8; x++) {
    const wave = Math.sin((x + Date.now() / 100) * 0.8) * 2;
    ctx.lineTo(cx + x, cy + 10 + wave);
  }
  ctx.lineTo(cx + 8, cy + 8);
  ctx.fill();

  // Inner lighter area
  ctx.fillStyle = '#E0E8F0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hollow dark eyes
  ctx.fillStyle = '#0000ff';
  ctx.shadowColor = '#0000ff';
  ctx.shadowBlur = 3;
  if (direction !== Direction.NORTH) {
    if (direction === Direction.EAST) {
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy - 5, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (direction === Direction.WEST) {
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy - 5, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 5, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 5, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Dark pupil dots
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000033';
    if (direction === Direction.EAST) {
      ctx.beginPath();
      ctx.arc(cx + 2, cy - 5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (direction === Direction.WEST) {
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 5, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, cy - 5, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.shadowBlur = 0;
  }

  // Flowing tail at bottom
  ctx.strokeStyle = '#B0C4DE';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 10);
  const tailSway = Math.sin(Date.now() / 300) * 3;
  ctx.quadraticCurveTo(cx + tailSway, cy + 16, cx + tailSway * 1.5, cy + 20);
  ctx.stroke();

  ctx.restore();
}

function drawThornback(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dome-shaped shell (half circle)
  ctx.fillStyle = '#2F4F2F';
  ctx.beginPath();
  ctx.arc(cx, cy - 1, 9, Math.PI, 0);
  ctx.lineTo(cx + 9, cy + 2);
  ctx.lineTo(cx - 9, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#556B2F';
  ctx.beginPath();
  ctx.arc(cx, cy, 8, Math.PI, 0);
  ctx.lineTo(cx + 8, cy + 1);
  ctx.lineTo(cx - 8, cy + 1);
  ctx.closePath();
  ctx.fill();

  // Shell pattern lines
  ctx.strokeStyle = '#2F4F2F';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, 4, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + 1, 7, Math.PI + 0.3, -0.3);
  ctx.stroke();

  // Triangular thorns/spikes around shell edge
  ctx.fillStyle = '#2F4F2F';
  const spikeCount = 10;
  for (let i = 0; i < spikeCount; i++) {
    const angle = Math.PI + (i / (spikeCount - 1)) * Math.PI;
    const sx = cx + Math.cos(angle) * 9;
    const sy = cy + 1 + Math.sin(angle) * 9;
    const tipX = cx + Math.cos(angle) * 13;
    const tipY = cy + 1 + Math.sin(angle) * 13;
    const perpX = -Math.sin(angle) * 1.5;
    const perpY = Math.cos(angle) * 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - perpX, sy - perpY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sx + perpX, sy + perpY);
    ctx.closePath();
    ctx.fill();
  }

  // Head peeking out
  const hx = direction === Direction.EAST ? 8 : direction === Direction.WEST ? -8 : 0;
  const hy = direction === Direction.NORTH ? -2 : direction === Direction.SOUTH ? 3 : 2;
  ctx.fillStyle = '#6B8E23';
  ctx.beginPath();
  ctx.ellipse(cx + hx, cy + hy, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#333', 1.5, direction);

  // Legs peeking out
  ctx.fillStyle = '#8FBC8F';
  const legOff = direction === Direction.NORTH || direction === Direction.SOUTH ? 5 : 4;
  ctx.fillRect(cx - legOff, cy + 1, 2, 3);
  ctx.fillRect(cx + legOff - 2, cy + 1, 2, 3);
  // Front legs
  const flegX = direction === Direction.EAST ? 6 : direction === Direction.WEST ? -8 : 0;
  ctx.fillRect(cx + flegX - 1, cy + 1, 2, 3);
}

function drawEagle(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 8, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#3A2718';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A3728';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - 1, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wide spread wings (wingSpan 16)
  ctx.fillStyle = '#3A2718';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 2);
  ctx.lineTo(cx - 16, cy - 10);
  ctx.lineTo(cx - 14, cy - 3);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 2);
  ctx.lineTo(cx + 16, cy - 10);
  ctx.lineTo(cx + 14, cy - 3);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.fill();

  // Wing feather detail lines
  ctx.strokeStyle = '#2A1708';
  ctx.lineWidth = 0.5;
  // Left wing feathers
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 4 - i * 2, cy - 2 - i);
    ctx.lineTo(cx - 12 - i, cy - 7 - i);
    ctx.stroke();
  }
  // Right wing feathers
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 4 + i * 2, cy - 2 - i);
    ctx.lineTo(cx + 12 + i, cy - 7 - i);
    ctx.stroke();
  }

  // Head
  const hx = direction === Direction.EAST ? 5 : direction === Direction.WEST ? -5 : 0;
  const hy = direction === Direction.NORTH ? -5 : direction === Direction.SOUTH ? 3 : -3;
  ctx.fillStyle = '#F5F5DC';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Hooked beak
  ctx.fillStyle = '#DAA520';
  const bx = cx + hx + (direction === Direction.EAST ? 3 : direction === Direction.WEST ? -3 : 0);
  const by = cy + hy + (direction === Direction.NORTH ? -2 : direction === Direction.SOUTH ? 2 : 1);
  ctx.beginPath();
  ctx.moveTo(bx - 1.5, by - 0.5);
  ctx.lineTo(bx, by + 3.5);
  ctx.lineTo(bx + 1.5, by - 0.5);
  ctx.closePath();
  ctx.fill();
  // Beak hook
  ctx.beginPath();
  ctx.moveTo(bx, by + 3.5);
  ctx.lineTo(bx + (direction === Direction.WEST ? -1 : 1), by + 2);
  ctx.stroke();

  // Eyes
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#FFD700', 2, direction);

  // Talons
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  // Left foot
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 3);
  ctx.lineTo(cx - 3, cy + 7);
  ctx.moveTo(cx, cy + 3);
  ctx.lineTo(cx - 1, cy + 7);
  ctx.moveTo(cx - 3, cy + 7);
  ctx.lineTo(cx - 4, cy + 9);
  ctx.moveTo(cx - 1, cy + 7);
  ctx.lineTo(cx - 2, cy + 9);
  ctx.moveTo(cx, cy + 7);
  ctx.lineTo(cx + 1, cy + 9);
  ctx.stroke();
  // Right foot
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 3);
  ctx.lineTo(cx + 1, cy + 7);
  ctx.moveTo(cx, cy + 3);
  ctx.lineTo(cx + 1, cy + 7);
  ctx.moveTo(cx + 1, cy + 7);
  ctx.lineTo(cx, cy + 9);
  ctx.moveTo(cx + 1, cy + 7);
  ctx.lineTo(cx + 2, cy + 9);
  ctx.stroke();
}

// =============================================
// Main dispatcher
// =============================================

const monsterDrawers: Record<string, (ctx: Ctx, cx: number, cy: number, dir: Direction) => void> = {
  rat: drawRat,
  bat: drawBat,
  snake: drawSnake,
  spider: drawSpider,
  goblin: drawGoblin,
  wolf: drawWolf,
  scorpion: drawScorpion,
  orc: drawOrc,
  troll: drawTroll,
  skeleton: drawSkeleton,
  wraith: drawWraith,
  dark_mage: drawDarkMage,
  fire_elemental: drawFireElemental,
  demon: drawDemon,
  dragon: drawDragon,
  rabbit: drawRabbit,
  bee: drawBee,
  bandit: drawBandit,
  boar: drawBoar,
  pirate: drawPirate,
  mushroom: drawMushroom,
  golem: drawGolem,
  vampire: drawVampire,
  necromancer: drawNecromancer,
  hydra: drawHydra,
  phoenix: drawPhoenix,
  lich_king: drawLichKing,
  kraken: drawKraken,
  demon_lord: drawDemonLord,
  ancient_dragon: drawAncientDragon,
  deer: drawDeer,
  bear: drawBear,
  crocodile: drawCrocodile,
  frog: drawFrog,
  hawk: drawHawk,
  crab: drawCrab,
  minotaur: drawMinotaur,
  cobra: drawCobra,
  wild_dog: drawWildDog,
  cat: drawCat,
  toad: drawToad,
  mantis: drawMantis,
  war_wolf: drawWarWolf,
  wild_boar: drawWildBoar,
  stone_golem: drawStoneGolem,
  ghost: drawGhost,
  thornback: drawThornback,
  eagle: drawEagle,
};

export function drawMonsterCreature(
  ctx: Ctx,
  monsterId: string,
  cx: number,
  cy: number,
  direction: Direction
) {
  const drawer = monsterDrawers[monsterId];
  if (drawer) {
    drawer(ctx, cx, cy, direction);
  } else {
    // Generic creature fallback for unknown monsters
    drawGenericCreature(ctx, cx, cy, direction);
  }
}

function drawGenericCreature(ctx: Ctx, cx: number, cy: number, direction: Direction) {
  // A generic beast shape
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const hx = direction === Direction.EAST ? 6 : direction === Direction.WEST ? -6 : 0;
  const hy = direction === Direction.NORTH ? -6 : direction === Direction.SOUTH ? 4 : -2;
  ctx.fillStyle = '#777';
  ctx.beginPath();
  ctx.arc(cx + hx, cy + hy, 5, 0, Math.PI * 2);
  ctx.fill();
  drawEyes(ctx, cx + hx, cy + hy - 1, 3, '#ff0000', 1.5, direction);
  // Legs
  ctx.fillStyle = '#555';
  ctx.fillRect(cx - 6, cy + 5, 3, 4);
  ctx.fillRect(cx + 3, cy + 5, 3, 4);
}