import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const players = await db.player.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        name: true,
        vocation: true,
        level: true,
        health: true,
        maxHealth: true,
      },
    });

    return NextResponse.json(players);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}