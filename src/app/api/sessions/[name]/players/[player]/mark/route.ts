import { NextRequest, NextResponse } from 'next/server';
import { getPlayer, savePlayer } from '@/lib/storage';
import { checkWin } from '@/lib/bingo';

// POST /api/sessions/[name]/players/[player]/mark – toggle a cell
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string; player: string }> }
) {
  const { name, player } = await params;
  const playerData = await getPlayer(name, decodeURIComponent(player));

  if (!playerData) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const body = await req.json();
  const { row, col } = body;

  if (
    typeof row !== 'number' ||
    typeof col !== 'number' ||
    row < 0 || row > 4 ||
    col < 0 || col > 4
  ) {
    return NextResponse.json({ error: 'Invalid cell coordinates' }, { status: 400 });
  }

  // Don't allow unmarking the FREE center cell
  if (playerData.board[row][col] === 'FREE') {
    return NextResponse.json({ player: playerData, win: checkWin(playerData.markedCells) });
  }

  // Toggle the cell
  playerData.markedCells[row][col] = !playerData.markedCells[row][col];
  playerData.lastActiveAt = Date.now();

  // Check for win
  const win = checkWin(playerData.markedCells);
  playerData.hasWon = win.won;

  await savePlayer(playerData);

  return NextResponse.json({ player: playerData, win });
}
