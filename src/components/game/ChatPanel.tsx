'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { ChatMessage } from '@/lib/game/types';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatPanel() {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const player = useGameStore((s) => s.player);
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const isOpen = openOverride ?? !isMobile;
  const setIsOpen = (open: boolean) => setOpenOverride(open);
  const [chatTab, setChatTab] = useState<'all' | 'combat' | 'system'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim() || !player) return;
    addChatMessage({
      type: 'player',
      sender: player.name,
      content: input.trim(),
      color: '#e67e22',
    });
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
    // Prevent game movement when typing
    e.stopPropagation();
  };

  const filteredMessages = chatMessages.filter((msg) => {
    if (chatTab === 'all') return true;
    if (chatTab === 'combat') return msg.type === 'combat';
    if (chatTab === 'system') return msg.type === 'system';
    return true;
  });

  const getMessageColor = (msg: ChatMessage) => {
    if (msg.color) return msg.color;
    switch (msg.type) {
      case 'player': return '#e67e22';
      case 'system': return '#f1c40f';
      case 'combat': return '#e74c3c';
      case 'npc': return '#9b59b6';
      default: return '#ffffff';
    }
  };

  return (
    <div
      className={`absolute z-20 transition-all duration-200 ${isOpen ? 'w-80' : 'w-48'} ${
        isMobile ? 'top-36 left-0' : 'bottom-0 left-0'
      }`}
    >
      {/* Chat tabs */}
      <div className="flex items-center bg-black/90 border border-amber-700/50 border-b-0 rounded-t-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1 text-amber-400 text-xs font-bold hover:text-amber-300"
        >
          {isOpen ? '▼' : '▲'} Chat
        </button>
        {isOpen && (
          <>
            <button
              onClick={() => setChatTab('all')}
              className={`px-2 py-1 text-xs ${chatTab === 'all' ? 'text-amber-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setChatTab('combat')}
              className={`px-2 py-1 text-xs ${chatTab === 'combat' ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Combat
            </button>
            <button
              onClick={() => setChatTab('system')}
              className={`px-2 py-1 text-xs ${chatTab === 'system' ? 'text-yellow-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              System
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-40 bg-black/85 border border-amber-700/50 overflow-y-auto p-2 space-y-0.5 custom-scrollbar"
            onClick={() => inputRef.current?.focus()}
          >
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="text-xs leading-tight">
                <span style={{ color: getMessageColor(msg) }} className="font-bold">
                  {msg.sender}:
                </span>{' '}
                <span className="text-gray-200">{msg.content}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-black/90 border border-amber-700/50 border-t-0 rounded-b-lg p-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-600"
            />
          </div>
        </>
      )}
    </div>
  );
}