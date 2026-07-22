'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';

interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'kill' | 'level';
  target?: string;
  required: number;
  progress: number;
  reward: { gold: number; exp: number; item?: string };
  completed: boolean;
  icon: string;
}

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', name: 'Rat Exterminator', description: 'Kill 10 rats in the northern forest.', type: 'kill', target: 'rat', required: 10, progress: 0, reward: { gold: 50, exp: 100 }, completed: false, icon: '🐀' },
  { id: 'q2', name: 'Snake Hunter', description: 'Kill 15 snakes to prove your bravery.', type: 'kill', target: 'snake', required: 15, progress: 0, reward: { gold: 100, exp: 250, item: 'short_sword' }, completed: false, icon: '🐍' },
  { id: 'q3', name: 'Spider Slayer', description: 'Clear 10 giant spiders from the forest.', type: 'kill', target: 'spider', required: 10, progress: 0, reward: { gold: 200, exp: 500 }, completed: false, icon: '🕷️' },
  { id: 'q4', name: 'Wolf Pack', description: 'Hunt down 8 wolves in the wilderness.', type: 'kill', target: 'wolf', required: 8, progress: 0, reward: { gold: 300, exp: 600, item: 'chain_mail' }, completed: false, icon: '🐺' },
  { id: 'q5', name: 'Orc Menace', description: 'Defeat 5 orcs threatening the lands.', type: 'kill', target: 'orc', required: 5, progress: 0, reward: { gold: 500, exp: 1000, item: 'iron_shield' }, completed: false, icon: '👹' },
  { id: 'q6', name: 'Undead Purge', description: 'Destroy 10 skeletons in the caves.', type: 'kill', target: 'skeleton', required: 10, progress: 0, reward: { gold: 600, exp: 1200, item: 'iron_helmet' }, completed: false, icon: '💀' },
  { id: 'q7', name: 'Apprentice Adventurer', description: 'Reach level 5.', type: 'level', required: 5, progress: 0, reward: { gold: 200, exp: 0, item: 'mana_potion_medium' }, completed: false, icon: '⭐' },
  { id: 'q8', name: 'Veteran Fighter', description: 'Reach level 15.', type: 'level', required: 15, progress: 0, reward: { gold: 1000, exp: 0, item: 'plate_armor' }, completed: false, icon: '🏅' },
  { id: 'q9', name: 'Demon Hunter', description: 'Slay 3 demons from the depths.', type: 'kill', target: 'demon', required: 3, progress: 0, reward: { gold: 2000, exp: 3000, item: 'dragon_sword' }, completed: false, icon: '😈' },
  { id: 'q10', name: 'Dragon Slayer', description: 'Defeat the legendary dragon.', type: 'kill', target: 'dragon', required: 1, progress: 0, reward: { gold: 5000, exp: 10000, item: 'crown_helmet' }, completed: false, icon: '🐉' },
];

export default function QuestLog() {
  const player = useGameStore((s) => s.player);
  const [isOpen, setIsOpen] = useState(false);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const addToInventory = useGameStore((s) => s.addToInventory);
  const lastLevelRef = useRef(1);

  // Track level changes using store subscription (not setState in effect)
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      const level = state.player?.stats.level;
      if (!level) return;
      if (level === lastLevelRef.current) return;
      lastLevelRef.current = level;
      setQuests(prev => prev.map(q => {
        if (q.type === 'level' && !q.completed) {
          const newProgress = Math.min(q.required, level);
          const isNowCompleted = newProgress >= q.required;
          if (isNowCompleted && completeQuestCbRef.current) {
            setTimeout(() => completeQuestCbRef.current!(q), 500);
          }
          return { ...q, progress: newProgress, completed: isNowCompleted };
        }
        return q;
      }));
    });
    return unsub;
  }, []);

  const completeQuestCbRef = useRef<((quest: Quest) => void) | null>(null);
  completeQuestCbRef.current = (quest: Quest) => { // eslint-disable-line react-hooks/immutability
    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: true } : q));
    addChatMessage({ type: 'system', sender: 'Quest Complete!', content: `🎉 ${quest.name} completed! +${quest.reward.gold}g +${quest.reward.exp}XP`, color: '#f1c40f' });
    useGameStore.setState(state => {
      if (!state.player) return state;
      return { player: { ...state.player, gold: state.player.gold + quest.reward.gold, stats: { ...state.player.stats, experience: state.player.stats.experience + quest.reward.exp } } };
    });
    if (quest.reward.item) addToInventory(quest.reward.item, 1);
  };

  // Register quest tracking
  useEffect(() => {
    (window as any).__questTrackKill = (monsterId: string) => {
      setQuests(prev => prev.map(q => {
        if (q.type === 'kill' && q.target === monsterId && !q.completed) {
          const newProgress = q.progress + 1;
          const isNowCompleted = newProgress >= q.required;
          if (isNowCompleted && completeQuestCbRef.current) {
            const cb = completeQuestCbRef.current;
            setTimeout(() => cb(q), 500);
          }
          return { ...q, progress: newProgress, completed: isNowCompleted };
        }
        return q;
      }));
    };
  }, []);

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <div className="absolute top-1/2 right-0 -translate-y-1/2 z-10">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-black/80 border border-amber-700/50 rounded-l-lg px-2 py-3 text-amber-400 text-xs font-bold hover:bg-black/90 flex items-center gap-1">
        {isOpen ? '▶' : '📜'}
        {!isOpen && <span className="flex flex-col items-center text-[9px]"><span>Quests</span><span className="text-yellow-400">{completedCount}/{quests.length}</span></span>}
      </button>
      {isOpen && (
        <div className="bg-black/90 border border-amber-700/50 border-r-0 rounded-l-lg p-3 w-72 max-h-80 overflow-y-auto custom-scrollbar">
          <h3 className="text-amber-400 font-bold text-sm mb-2 flex items-center justify-between">📜 Quest Log <span className="text-xs text-gray-400">{completedCount}/{quests.length}</span></h3>
          <div className="h-1.5 bg-gray-800 rounded-full mb-3 overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / quests.length) * 100}%` }} /></div>
          <div className="space-y-2">
            {quests.map(quest => (
              <div key={quest.id} className={`p-2 rounded-lg border ${quest.completed ? 'border-green-800/50 bg-green-900/20' : 'border-gray-700/50 bg-gray-800/30'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">{quest.completed ? '✅' : quest.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${quest.completed ? 'text-green-400 line-through' : 'text-gray-200'}`}>{quest.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{quest.description}</div>
                    {!quest.completed && <div className="mt-1"><div className="h-1 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${(quest.progress / quest.required) * 100}%` }} /></div><div className="text-[9px] text-gray-500 mt-0.5">{quest.progress}/{quest.required}</div></div>}
                    <div className="flex gap-2 mt-1 text-[9px]"><span className="text-yellow-400">🪙 {quest.reward.gold}</span>{quest.reward.exp > 0 && <span className="text-purple-400">⭐ {quest.reward.exp}</span>}{quest.reward.item && <span className="text-green-400">🎁 Item</span>}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}