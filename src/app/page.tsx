'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/store/game-store';
import GameCanvas from '@/components/game/GameCanvas';
import GameHUD from '@/components/game/GameHUD';
import ChatPanel from '@/components/game/ChatPanel';
import InventoryPanel from '@/components/game/InventoryPanel';
import Minimap from '@/components/game/Minimap';
import NPCDialog from '@/components/game/NPCDialog';
import GameLogin from '@/components/game/GameLogin';

export default function HomePage() {
  const screen = useGameStore((s) => s.screen);
  const player = useGameStore((s) => s.player);
  const updateOtherPlayer = useGameStore((s) => s.updateOtherPlayer);
  const removeOtherPlayer = useGameStore((s) => s.removeOtherPlayer);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const setOtherPlayers = useGameStore((s) => s.setOtherPlayers);
  const socketRef = useRef<Socket | null>(null);
  const lastPosBroadcast = useRef(0);

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
      // Send player info
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
  }, [screen, player?.id]);

  // Broadcast position periodically
  useEffect(() => {
    if (screen !== 'game' || !player) return;

    const interval = setInterval(() => {
      if (socketRef.current && player) {
        socketRef.current.emit('player-move', {
          position: player.position,
          direction: player.direction,
        });
        socketRef.current.emit('player-stats', {
          health: player.stats.health,
          maxHealth: player.stats.maxHealth,
          level: player.stats.level,
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [screen, player?.position?.x, player?.position?.y]);

  // Broadcast chat messages
  const originalAddChatMessage = useGameStore.getState().addChatMessage;
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => state.chatMessages,
      (messages) => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.type === 'player' && socketRef.current && player) {
          socketRef.current.emit('chat-message', {
            sender: lastMsg.sender,
            content: lastMsg.content,
            color: lastMsg.color,
          });
        }
      }
    );
    return unsub;
  }, [player?.id]);

  if (screen === 'login') {
    return <GameLogin />;
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative" tabIndex={0}>
      {/* Game Canvas */}
      <GameCanvas />

      {/* HUD Overlay */}
      <GameHUD />

      {/* Minimap */}
      <div className="absolute top-12 right-0 z-10 mr-2">
        <Minimap />
      </div>

      {/* Chat Panel */}
      <ChatPanel />

      {/* Inventory Panel */}
      <InventoryPanel />

      {/* NPC Dialog */}
      <NPCDialog />

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 z-10 bg-black/60 rounded px-2 py-1 text-[10px] text-gray-500">
        WASD: Move | Space: Attack | E: Interact | 1-9: Use Items
      </div>
    </div>
  );
}