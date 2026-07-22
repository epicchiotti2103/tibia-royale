import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const name = request.nextUrl.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
    }

    const player = await db.player.findUnique({ where: { name } });
    if (!player) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: player.name,
      vocation: player.vocation,
      position: { x: player.positionX, y: player.positionY },
      direction: player.direction,
      stats: {
        level: player.level,
        experience: player.experience,
        health: player.health,
        maxHealth: player.maxHealth,
        mana: player.mana,
        maxMana: player.maxMana,
        attack: player.attack,
        defense: player.defense,
        magicAttack: player.magicAttack,
        magicDefense: player.magicDefense,
      },
      equipment: JSON.parse(player.equipment),
      inventory: JSON.parse(player.inventory),
      gold: player.gold,
      skillUpgrades: JSON.parse(player.skillUpgrades),
      equippedSkills: JSON.parse(player.equippedSkills),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
