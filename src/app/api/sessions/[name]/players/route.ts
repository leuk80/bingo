import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionPlayers } from '@/lib/storage';

// GET /api/sessions/[name]/players – get all players in a session
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const session = await getSession(name);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const players = await getSessionPlayers(name);

  return NextResponse.json({
    players: players.map((p) => ({
      playerName: p.playerName,
      hasWon: p.hasWon,
      createdAt: p.createdAt,
      lastActiveAt: p.lastActiveAt,
      markedCount: p.markedCells.flat().filter(Boolean).length,
    })),
  });
}
