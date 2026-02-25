import { NextRequest, NextResponse } from 'next/server';
import { getSession, getPlayer, savePlayer } from '@/lib/storage';
import { createPlayerBoard } from '@/lib/bingo';

// POST /api/sessions/[name]/join – join a session (get or create player board)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const session = await getSession(name);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!session.isActive) {
    return NextResponse.json({ error: 'This game session is no longer active' }, { status: 403 });
  }

  const body = await req.json();
  const playerName = body.playerName?.trim();

  if (!playerName || playerName.length < 1 || playerName.length > 30) {
    return NextResponse.json(
      { error: 'Player name must be between 1 and 30 characters' },
      { status: 400 }
    );
  }

  // Return existing board if player already joined
  const existing = await getPlayer(name, playerName);
  if (existing) {
    existing.lastActiveAt = Date.now();
    await savePlayer(existing);
    return NextResponse.json({ player: existing, isNew: false });
  }

  // Check if we have enough words
  const needed = session.freeCenter ? 24 : 25;
  if (session.words.length < needed) {
    return NextResponse.json(
      { error: `Not enough words for a board (need ${needed}, have ${session.words.length})` },
      { status: 400 }
    );
  }

  // Create a new shuffled board
  const playerData = createPlayerBoard(name, playerName, session.words, session.freeCenter);
  const player: typeof playerData = { ...playerData };

  await savePlayer(player);

  return NextResponse.json({ player, isNew: true });
}
