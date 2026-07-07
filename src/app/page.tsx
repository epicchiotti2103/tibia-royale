'use client';

import React, { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/store/game-store';
import GameCanvas from '@/components/game/GameCanvas';
import GameHUD from '@/components/game/GameHUD';
import ChatPanel from '@/components/game/ChatPanel';
import InventoryPanel from '@/components/game/InventoryPanel';
import Minimap from '@/components/game/Minimap';
import NPCDialog from '@/components/game/NPCDialog';
import GameLogin from '@/components/game/GameLogin';
import DeathScreen from '@/components/game/DeathScreen';
import SkillsPanel from '@/components/game/SkillsPanel';
import QuestLog from '@/components/game/QuestLog';

export default function HomePage() {
  const screen = useGameStore((s) => s.screen);
  const player = useGameStore((s) => s.player);
  const updateOtherPlayer = useGameStore((s) => s.updateOtherPlayer);
  const removeOtherPlayer = useGameStore((s) => s.removeOtherPlayer);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const setOtherPlayers = useGameStore((s) => s.setOtherPlayers);
  const socketRef = useRef<Socket | null>(null);

  // Connect to game server
  useEffect(() => {
    if (screen !== 'game' || !player) return;

    const socket = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to game server');
      socket.emit('join-game', {
        name: player.name,
        position: player.position,
        direction: player.direction,
        vocation: player.vocation,
        level: player.stats.level,
        health: player.stats.health,
        maxHealth: player.stats.maxHealth,
      });
    });

    socket.on('players-list', (players: any[]) => {
      setOtherPlayers(players);
    });

    socket.on('player-joined', (p: any) => {
      updateOtherPlayer(p);
      addChatMessage({
        type: 'system',
        sender: 'System',
        content: `${p.name} has entered the world.`,
        color: '#2ecc71',
      });
    });

    socket.on('player-moved', (data: { id: string; position: { x: number; y: number }; direction: number }) => {
      updateOtherPlayer({
        id: data.id,
        name: '',
        position: data.position,
        direction: data.direction,
        vocation: 'Knight' as any,
        level: 1,
        health: 100,
        maxHealth: 100,
      });
    });

    socket.on('player-stats-update', (data: { id: string; health: number; maxHealth: number; level: number }) => {
      updateOtherPlayer({
        id: data.id,
        name: '',
        position: { x: 0, y: 0 },
        direction: 0,
        vocation: 'Knight' as any,
        level: data.level,
        health: data.health,
        maxHealth: data.maxHealth,
      });
    });

    socket.on('player-left', (data: { id: string }) => {
      removeOtherPlayer(data.id);
      addChatMessage({
        type: 'system',
        sender: 'System',
        content: 'A player has left the world.',
        color: '#e74c3c',
      });
    });

    socket.on('chat-message', (msg: any) => {
      addChatMessage({
        type: msg.type,
        sender: msg.sender,
        content: msg.content,
        color: msg.color,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [screen === 'game']);

  // Broadcast position periodically
  useEffect(() => {
    if (screen !== 'game' || !player) return;

    const interval = setInterval(() => {
      const currentPlayer = useGameStore.getState().player;
      if (socketRef.current && currentPlayer) {
        socketRef.current.emit('player-move', {
          position: currentPlayer.position,
          direction: currentPlayer.direction,
        });
        socketRef.current.emit('player-stats', {
          health: currentPlayer.stats.health,
          maxHealth: currentPlayer.stats.maxHealth,
          level: currentPlayer.stats.level,
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [screen === 'game']);

  // Broadcast chat messages
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => state.chatMessages,
      (messages) => {
        const lastMsg = messages[messages.length - 1];
        const currentPlayer = useGameStore.getState().player;
        if (lastMsg && lastMsg.type === 'player' && socketRef.current && currentPlayer) {
          socketRef.current.emit('chat-message', {
            sender: lastMsg.sender,
            content: lastMsg.content,
            color: lastMsg.color,
          });
        }
      }
    );
    return unsub;
  }, []);

  if (screen === 'login') {
    return <GameLogin />;
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative" tabIndex={0}>
      {/* Game Canvas */}
      <GameCanvas />

      {/* HUD Overlay */}
      <GameHUD />

      {/* Minimap - positioned properly */}
      <div className="absolute top-14 right-2 z-10">
        <Minimap />
      </div>

      {/* Quest Log - right side */}
      <QuestLog />

      {/* Chat Panel - bottom left */}
      <ChatPanel />

      {/* Inventory Panel - top right */}
      <InventoryPanel />

      {/* Skills Bar - bottom center */}
      <SkillsPanel />

      {/* NPC Dialog */}
      <NPCDialog />

      {/* Death Screen Overlay */}
      {screen === 'dead' && <DeathScreen />}

      {/* Time of day indicator */}
      <TimeIndicator />

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 z-10 bg-black/60 rounded px-2 py-1 text-[10px] text-gray-500">
        WASD: Move | Space(hold): Attack | F1-F4: Skills | Q: Potion | 1-9: Items
      </div>
    </div>
  );
}

function TimeIndicator() {
  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const gameMinutes = Date.now() / 100; // 1 real second = ~10 game minutes
      const totalGameHours = (gameMinutes / 60) % 24;
      const hours = Math.floor(totalGameHours);
      const minutes = Math.floor((totalGameHours - hours) * 60);

      let period: string;
      let icon: string;
      if (hours >= 6 && hours < 12) { period = 'Morning'; icon = '🌅'; }
      else if (hours >= 12 && hours < 18) { period = 'Afternoon'; icon = '☀️'; }
      else if (hours >= 18 && hours < 21) { period = 'Evening'; icon = '🌇'; }
      else { period = 'Night'; icon = '🌙'; }

      setTime(`${icon} ${period} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 border border-amber-700/30 rounded-lg px-3 py-1 text-amber-200/80 text-xs font-mono">
      {time}
    </div>
  );
}