import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      vocation,
      position,
      direction,
      stats,
      equipment,
      inventory,
      gold,
      skillUpgrades,
      equippedSkills,
    } = body;

    if (!name || !vocation || !stats || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const player = await db.player.upsert({
      where: { name },
      update: {
        vocation,
        level: stats.level,
        experience: stats.experience,
        health: stats.health,
        maxHealth: stats.maxHealth,
        mana: stats.mana,
        maxMana: stats.maxMana,
        attack: stats.attack,
        defense: stats.defense,
        magicAttack: stats.magicAttack,
        magicDefense: stats.magicDefense,
        positionX: position.x,
        positionY: position.y,
        direction: direction ?? 2,
        gold: gold ?? 0,
        equipment: JSON.stringify(equipment ?? {}),
        inventory: JSON.stringify(inventory ?? []),
        skillUpgrades: JSON.stringify(skillUpgrades ?? {}),
        equippedSkills: JSON.stringify(equippedSkills ?? []),
      },
      create: {
        name,
        vocation,
        level: stats.level,
        experience: stats.experience,
        health: stats.health,
        maxHealth: stats.maxHealth,
        mana: stats.mana,
        maxMana: stats.maxMana,
        attack: stats.attack,
        defense: stats.defense,
        magicAttack: stats.magicAttack,
        magicDefense: stats.magicDefense,
        positionX: position.x,
        positionY: position.y,
        direction: direction ?? 2,
        gold: gold ?? 0,
        equipment: JSON.stringify(equipment ?? {}),
        inventory: JSON.stringify(inventory ?? []),
        skillUpgrades: JSON.stringify(skillUpgrades ?? {}),
        equippedSkills: JSON.stringify(equippedSkills ?? []),
      },
    });

    return NextResponse.json({ success: true, id: player.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}