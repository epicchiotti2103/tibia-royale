# Tibia Royale - Developer Documentation

Welcome to the **Tibia Royale** codebase! This document outlines the core architecture, gameplay mechanics, and technical details to ensure anyone (or any AI) can easily understand and maintain this project without losing context.

## 🏗️ Architecture Overview

The game is built using:
- **Frontend Framework:** Next.js (React)
- **Styling:** TailwindCSS
- **State Management:** Zustand (`src/store/game-store.ts`)
- **Graphics/Rendering:** HTML5 Canvas (`src/components/game/GameCanvas.tsx`) combined with React components for UI overlays.
- **Backend/Storage:** SQLite via Next.js API Routes (`src/app/api/...`) for persistent character saving.

All core logic runs on the client side at 60 FPS via a `requestAnimationFrame` loop that triggers the `updateMatchTimer` inside `game-store.ts`.

---

## 🎮 Game Phases

The match revolves around a Battle Royale flow consisting of 3 distinct phases:

1. **Hunting Phase (3 minutes):**
   - Players and bots roam the map freely.
   - Objective: Kill monsters, collect loot, gain XP, and level up.
   - PvP is enabled outside the safe zone (Town).
2. **Preparation Phase (40 seconds):**
   - All surviving bots and the player are teleported to the Town center.
   - Bots instantly level up to match the Player's level (+/- 2 levels) so they are always a challenge.
   - Players can use their Gold to buy equipment and potions from the Merchant NPC.
3. **Arena Phase (3 minutes):**
   - Bots and Player are scattered randomly across the outer edges of the map.
   - A shrinking Safe Zone (storm) begins closing in on the Town (center of map).
   - Anyone outside the Safe Zone takes constant true damage.
   - Last man standing wins!

---

## ⚔️ Combat & Balancing (Crucial Details)

To ensure combat feels fair and dynamic, we have specific PvP (Player vs Player/Bot) multipliers:

- **PvP Spell Damage:** Spells cast by the Player against Bots (or vice versa) have their damage **reduced by 65%** (a 0.35x multiplier). This prevents high-level players from one-shotting bots with area spells.
- **Bot Melee/Basic Attack Damage:** Bots deal **250% damage** (2.5x multiplier) with their basic physical attacks. This compensates for the fact that bots don't always cast spells.
- **Natural Regeneration:** Every ~1.5 seconds, all living entities (Player and Bots) naturally regenerate **1% Max HP and 3% Max Mana**.

### Vocations & Stats (`src/lib/game/types.ts` & `skills.ts`)
- **Knight:** High HP (18/level), Defense. Low magic. Melee range. Spellcast chance: 10% - 30%.
- **Paladin:** Balanced HP/Mana, Range 4 basic attack. Spellcast chance: 30% - 60%.
- **Sorcerer:** High Mana (35/level), high Magic Attack. Low HP. Spellcast chance: 50% - 90%.
- **Druid:** Healing focused, strong Magic Attack (base 25, +14/lvl). Has early attack spells (Ice Strike Nv1, Earth Strike Nv8). Spellcast chance: 50% - 90%.

---

## 🤖 Bot Artificial Intelligence

The Bot AI logic lives inside `src/store/game-store.ts` (`updateBots` function) and `src/lib/game/bots.ts`.

- **Spawning:** Bots are generated with random names, vocations, and playstyles (looter, aggressive, cautious).
- **Spellcasting:** Bots have a dynamic `spellCastChance` (based on vocation). When attacking, they roll this chance to cast a random offensive spell from their class list instead of basic attacking. They must have sufficient mana.
- **Pathfinding & Collision:** Bots move towards targets (Loot, Monsters, Players). If an obstacle (Wall, Water) blocks their direct diagonal/straight path, the AI attempts to "slide" alongside the wall via orthogonal movements.
- **Safe Zone Escape:** During the Arena phase, bots prioritize moving towards coordinate (50, 50) if they are outside the safe zone ring.
- **Healing:** Bots will instantly heal themselves if their HP drops below their `fleeThreshold` (using a 5-second cooldown internal heal).

---

## 🗺️ Map & Sprites

- **Tilemap (`src/lib/game/tilemap.ts`):** 
  - The map is a grid of tiles (0: Grass, 2: Water, 4: Sand, 7: Wall, etc.).
  - The "Town" (Safe Zone) is defined statically as `x: 35, y: 35, w: 30, h: 25`. PvP damage is completely blocked if either the attacker or defender is in this box.
- **Sprites (`public/sprites/`):**
  - All player, bot, and monster graphics use directional sprites (`north.png`, `south.png`, `east.png`, `west.png`).
  - Preloaded dynamically in `GameCanvas.tsx` using an `Image()` caching system to avoid flicker.

---

## 🛠️ How to Add or Modify Content

1. **Add a New Spell:** Edit `src/lib/game/skills.ts`. Add the spell definition, configure `vocation`, `levelReq`, and damage/heal values. Then add the visual effect string to `getSkillEffectType()`.
2. **Add a New Monster:** Edit `src/lib/game/monsters.ts`. Define stats, loot tables, and `sprites` paths.
3. **Add New Items:** Edit `src/lib/game/items.ts`. Configure the slot it occupies (head, chest, legs, weapon) and the stat bonuses (`armor`, `magicPower`, etc.).

---
*Generated and maintained by Antigravity AI.*
