import { NextRequest, NextResponse } from 'next/server';
import { getPlayer, savePlayer } from '@/lib/storage';

// GET /api/sessions/[name]/players/[player] – get a player's board
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; player: string }> }
) {
  const { name, player } = await params;
  const playerData = await getPlayer(name, decodeURIComponent(player));

  if (!playerData) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Update last active
  playerData.lastActiveAt = Date.now();
  await savePlayer(playerData);

  return NextResponse.json({ player: playerData });
}
