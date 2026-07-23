'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Direction } from '@/lib/game/types';
import { useGameStore } from '@/store/game-store';
import { getSkill } from '@/lib/game/skills';
import { getDirection } from './GameCanvas';

// Refs are passed as props from GameCanvas so touch input shares the same
// gameLoop sources as keyboard (touchDirection / touchAttack).
interface MobileControlsProps {
  touchDirection: React.MutableRefObject<Direction | null>;
  touchAttack: React.MutableRefObject<boolean>;
}

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 44;
const JOYSTICK_RADIUS = (JOYSTICK_SIZE - KNOB_SIZE) / 2;
const DEADZONE = 10;

const glassBase: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: '2px solid rgba(255, 255, 255, 0.7)',
};

const secondaryGlass: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.25)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: '2px solid rgba(255, 255, 255, 0.5)',
};

function Chevron({ direction }: { direction: 'up' | 'down' | 'left' | 'right' }) {
  const rotations = { up: 0, right: 90, down: 180, left: 270 };
  return (
    <span
      style={{
        position: 'absolute',
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: 'bold',
        pointerEvents: 'none',
        userSelect: 'none',
        ...(direction === 'up' && { top: 6, left: '50%', transform: 'translateX(-50%)' }),
        ...(direction === 'down' && { bottom: 6, left: '50%', transform: 'translateX(-50%)' }),
        ...(direction === 'left' && { left: 8, top: '50%', transform: 'translateY(-50%)' }),
        ...(direction === 'right' && { right: 8, top: '50%', transform: 'translateY(-50%)' }),
      }}
    >
      <span style={{ display: 'inline-block', transform: `rotate(${rotations[direction]}deg)` }}>▲</span>
    </span>
  );
}

function VirtualJoystick({
  touchDirection,
}: {
  touchDirection: React.MutableRefObject<Direction | null>;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const resetJoystick = useCallback(() => {
    touchDirection.current = null;
    setKnobOffset({ x: 0, y: 0 });
    activePointerId.current = null;
  }, [touchDirection]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    activePointerId.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId || !baseRef.current) return;
    e.preventDefault();

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > JOYSTICK_RADIUS) {
      const scale = JOYSTICK_RADIUS / dist;
      dx *= scale;
      dy *= scale;
    }

    setKnobOffset({ x: dx, y: dy });

    if (dist > DEADZONE) {
      touchDirection.current = getDirection(dx, dy);
    } else {
      touchDirection.current = null;
    }
  }, [touchDirection]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    resetJoystick();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already be released
    }
  }, [resetJoystick]);

  return (
    <div
      ref={baseRef}
      style={{
        position: 'absolute',
        left: 'calc(20px + env(safe-area-inset-left))',
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        width: JOYSTICK_SIZE,
        height: JOYSTICK_SIZE,
        borderRadius: '50%',
        ...glassBase,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Chevron direction="up" />
      <Chevron direction="down" />
      <Chevron direction="left" />
      <Chevron direction="right" />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          marginLeft: -KNOB_SIZE / 2 + knobOffset.x,
          marginTop: -KNOB_SIZE / 2 + knobOffset.y,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          border: '2px solid rgba(255, 255, 255, 0.85)',
          pointerEvents: 'none',
          transition: activePointerId.current === null ? 'margin 0.15s ease-out' : 'none',
        }}
      />
    </div>
  );
}

function AttackButton({
  touchAttack,
}: {
  touchAttack: React.MutableRefObject<boolean>;
}) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    touchAttack.current = true;
    const store = useGameStore.getState();
    const now = Date.now();
    if (now - store.lastAutoAttackTime > 500) {
      store.attackMonster();
      useGameStore.setState({ lastAutoAttackTime: now });
    }
  }, [touchAttack]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    touchAttack.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already be released
    }
  }, [touchAttack]);

  return (
    <button
      type="button"
      aria-label="Attack"
      style={{
        position: 'absolute',
        right: 'calc(20px + env(safe-area-inset-right))',
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #ff6b5b, #e74c3c 55%, #c0392b 85%)',
        border: '2px solid rgba(255, 255, 255, 0.7)',
        boxShadow: '0 0 20px rgba(231, 76, 60, 0.5), inset 0 -4px 12px rgba(0,0,0,0.3)',
        color: '#fff',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.05em',
        touchAction: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      ATTACK
    </button>
  );
}

const SKILL_POSITIONS = [
  { right: 175, bottom: 215, size: 58 },
  { right: 135, bottom: 160, size: 62 },
  { right: 95, bottom: 105, size: 66 },
] as const;

function SkillButton({ slotIndex }: { slotIndex: 0 | 1 | 2 }) {
  const equippedSkillIds = useGameStore((s) => s.equippedSkillIds);
  const showSkillPanel = useGameStore((s) => s.showSkillPanel);
  const playerLevel = useGameStore((s) => s.player?.stats.level ?? 1);
  const castSkill = useGameStore((s) => s.castSkill);

  const skillId = equippedSkillIds[slotIndex];
  const skill = skillId ? getSkill(skillId) : undefined;
  const pos = SKILL_POSITIONS[slotIndex];
  const locked = skill ? playerLevel < skill.levelReq : false;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (locked || showSkillPanel) return;
    castSkill(slotIndex);
  }, [locked, showSkillPanel, castSkill, slotIndex]);

  if (!skill) {
    return (
      <div
        style={{
          position: 'absolute',
          right: `calc(${pos.right}px + env(safe-area-inset-right))`,
          bottom: `calc(${pos.bottom}px + env(safe-area-inset-bottom))`,
          width: pos.size,
          height: pos.size,
          borderRadius: '50%',
          ...glassBase,
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={skill.name}
      style={{
        position: 'absolute',
        right: `calc(${pos.right}px + env(safe-area-inset-right))`,
        bottom: `calc(${pos.bottom}px + env(safe-area-inset-bottom))`,
        width: pos.size,
        height: pos.size,
        borderRadius: '50%',
        background: locked
          ? 'rgba(80, 80, 80, 0.6)'
          : `radial-gradient(circle at 35% 30%, ${skill.color}, ${skill.color}ea, ${skill.color}cc)`,
        border: locked ? '2px solid rgba(255, 255, 255, 0.4)' : '3px solid rgba(255, 255, 255, 1)',
        boxShadow: locked ? 'none' : `0 0 20px ${skill.color}, inset 0 0 10px rgba(0,0,0,0.5)`,
        opacity: locked ? 0.6 : 1,
        filter: locked ? 'grayscale(1)' : 'none',
        touchAction: 'none',
        cursor: locked ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: pos.size * 0.48,
        padding: 0,
      }}
      onPointerDown={handlePointerDown}
    >
      {skill.icon}
      {locked && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            fontSize: 12,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          🔒
        </span>
      )}
    </button>
  );
}

function SecondaryButton({
  icon,
  label,
  onClick,
  style,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        ...secondaryGlass,
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

export function MobileControls({ touchDirection, touchAttack }: MobileControlsProps) {
  const interactNPC = useGameStore((s) => s.interactNPC);
  const quickUsePotion = useGameStore((s) => s.quickUsePotion);
  const toggleInventoryPanel = useGameStore((s) => s.toggleInventoryPanel);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Secondary actions — top area, away from combat cluster */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(20px + env(safe-area-inset-top))',
          left: 'calc(230px + env(safe-area-inset-left))',
          display: 'flex',
          gap: 12,
          pointerEvents: 'auto',
        }}
      >
        <SecondaryButton icon="💬" label="Interagir" onClick={interactNPC} />
        <SecondaryButton icon="📦" label="Menu" onClick={toggleInventoryPanel} />
      </div>

      {/* Combat cluster — pointer-events re-enabled per control */}
      <div style={{ pointerEvents: 'auto' }}>
        <VirtualJoystick touchDirection={touchDirection} />
        <AttackButton touchAttack={touchAttack} />
        <button
          type="button"
          aria-label="Use Potion"
          onClick={quickUsePotion}
          style={{
            position: 'absolute',
            right: 'calc(40px + env(safe-area-inset-right))',
            bottom: 'calc(120px + env(safe-area-inset-bottom))',
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #e74c3c, #c0392b)',
            border: '2px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 10px rgba(231, 76, 60, 0.6)',
            color: 'white',
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            touchAction: 'none',
          }}
        >
          🧪
        </button>
        <SkillButton slotIndex={0} />
        <SkillButton slotIndex={1} />
        <SkillButton slotIndex={2} />
      </div>
    </div>
  );
}