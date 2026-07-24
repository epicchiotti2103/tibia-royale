# Tibia Royale - Documentação do Desenvolvedor

Bem-vindo ao repositório do **Tibia Royale**! Este documento descreve a arquitetura principal, mecânicas de jogo e detalhes técnicos para garantir que qualquer desenvolvedor (ou IA) consiga entender e continuar o projeto sem perder o contexto.

## 🏗️ Visão Geral da Arquitetura

O jogo é construído usando as seguintes tecnologias:
- **Framework Frontend:** Next.js (React)
- **Estilização:** TailwindCSS
- **Gerenciamento de Estado:** Zustand (`src/store/game-store.ts`)
- **Renderização / Gráficos:** HTML5 Canvas (`src/components/game/GameCanvas.tsx`) combinado com componentes React para as interfaces (HUD, Inventário).
- **Backend/Armazenamento:** Next.js API Routes (`src/app/api/...`) com Prisma/SQLite para o salvamento e carregamento persistente do personagem (stats, inventário, ouro).

Toda a lógica central do jogo (Game Loop) roda no Client-Side através de um `setInterval` atrelado ao `requestAnimationFrame` que atualiza a física, movimentação e combate dentro do `game-store.ts`.

---

## 🎮 Fases da Partida (Game Loop)

A partida funciona como um Battle Royale com elementos de RPG, dividida em 3 fases:

1. **Fase de Caçada (Hunting - PvE) (3 minutos):**
   - Jogadores e Bots andam livremente pelo mapa.
   - **Objetivo:** Matar monstros, coletar *loot* no chão (itens), ganhar XP e subir de level.
   - PvP é ativado fora da Cidade (Safe Zone).

2. **Fase de Preparação (Preparation) (40 segundos):**
   - Todos os bots sobreviventes e o jogador são teleportados para o centro da Cidade.
   - Os Bots sofrem "Upgrade" instantâneo para se equipararem ao level atual do jogador, garantindo o desafio na fase final.
   - O jogador deve usar esse tempo para comprar equipamentos e poções no NPC Mercador usando o Ouro coletado.

3. **Fase de Arena (Battle Royale - PvP) (3 minutos):**
   - Bots e o Jogador são espalhados nas bordas do mapa.
   - Uma **Tempestade (Círculo de Shadow Wraiths)** começa a fechar em direção ao centro. Ficar de fora causa dano real e contínuo.
   - O último sobrevivente ganha a partida.

---

## 🤖 Inteligência Artificial (Bots) - Detalhes

A IA dos bots evoluiu para se comportar como jogadores reais de Tibia. A lógica vive no arquivo `src/lib/game/bots.ts` e na função `updateBots` de `src/store/game-store.ts`.

1. **Oportunismo (Third-Partying):**
   - Na Arena, ao invés de atacar apenas o alvo mais próximo fisicamente, os bots calculam a "Distância Percebida" baseada no HP do alvo. Se um inimigo estiver com 10% de HP, o bot ignorará um alvo full-life ao lado dele para finalizar o alvo fraco e roubar o loot.

2. **Uso de Poções Limitadas (Sobrevivência):**
   - Bots não têm vida infinita. Cada bot spawna com 2 a 5 **Poções de Vida**. Se o HP cair para menos de 40%, eles usam uma poção instantaneamente (com 2s de cooldown), subindo 30% da vida, até o estoque acabar.

3. **Combos Mágicos:**
   - Bots atacam fisicamente, mas também rolam um dado (`spellCastChance`) a cada ataque. Vocações mágicas (Sorcerers) rolam de 50-90% de chance de soltar uma magia *junto* com o hit físico, gastando mana real para dar *burst damage*.

4. **Colisão Real:**
   - Foi implementado o sistema `isOccupied`. Bots, Monstros e Jogador são sólidos. Não é possível andar por cima de outros personagens vivos. A IA desvia automaticamente se bater de frente com outro bot.

---

## ⚔️ Combate e Balanceamento

- **Dano PvP de Magias:** Magias lançadas contra jogadores/bots têm o dano **reduzido em 65%** (`0.35x` multiplier) para evitar *one-shots* de habilidades em área de high-levels.
- **Dano Físico Bot:** Ataques básicos dos Bots causam **250%** de dano (`2.5x` multiplier) para compensar a falta de precisão cirúrgica de um jogador humano.
- **Regeneração:** A cada ~1.5 segundos, todos os seres vivos recuperam 1% Max HP e 3% Max Mana.

### Vocações (`src/lib/game/types.ts`)
- **Knight:** Tank focado em vida (18/lvl) e porrada (Melee range).
- **Paladin:** Focado em distância (Range 4). Ataca de longe e pode usar pequenas magias.
- **Sorcerer:** Focado em Dano Mágico (Range 5). Pouca vida, muita mana (35/lvl), alto uso de magias.
- **Druid:** Focado em Suporte e Magias (Ice/Earth), uso intenso de combos mágicos.

---

## 📱 Controles Mobile e Multi-Touch

- **Joystick e Botões (`MobileControls.tsx`):**
  - O sistema usa a API `onPointerDown` no lugar de `onClick` ou `onTouchStart`. Isso garante suporte a **Multi-touch**.
  - O jogador pode segurar o direcional com o dedão esquerdo e "metralhar" as Hotkeys (Ataque, Poção, Magias) ou itens no **Inventário** com o dedo direito sem que o toque seja cancelado.
- **Layout Responsivo (`GameHUD.tsx`):**
  - O HUD é dimensionado (`scale-90`) em telas pequenas para evitar sobreposição (overlap) com os painéis de Inventário e Joystick.
  - A caixa de "Quick Stats" fica oculta em celulares na tela principal; o jogador deve abrir o menu do Inventário para ver seu Atk/Def atual.

---

## 🛠️ Como Adicionar Conteúdo Novo

1. **Novos Itens (`src/lib/game/items.ts`):**
   - Adicione o objeto definindo os status (`attack`, `defense`), o ícone em texto e o slot (`weapon`, `chest`).
2. **Novas Magias (`src/lib/game/skills.ts`):**
   - Defina o dano, custo de mana e vocação. Modifique a renderização gráfica (cor e tipo) em `GameCanvas.tsx`.
3. **Novos Monstros (`src/lib/game/monsters.ts`):**
   - Defina HP, Drop Rate de items, sprites e experiência dada.

---
*Atualizado por Antigravity AI.*
