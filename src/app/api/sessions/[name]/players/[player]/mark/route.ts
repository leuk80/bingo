import { NextRequest, NextResponse } from "next/server";
import { getPlayer, savePlayer } from "@/lib/storage";
import { checkWin } from "@/lib/bingo";

type Ctx = { params: Promise<{ name: string; player: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { name, player } = await params;
  const p = await getPlayer(name, decodeURIComponent(player));
  if (!p) return NextResponse.json({ error: "Spieler nicht gefunden." }, { status: 404 });

  const { row, col } = await req.json() as { row: number; col: number };
  if (typeof row !== "number" || typeof col !== "number" || row < 0 || row > 4 || col < 0 || col > 4) {
    return NextResponse.json({ error: "Ungültige Zellkoordinaten." }, { status: 400 });
  }

  // FREE cell cannot be toggled
  if (p.board[row][col] === "FREE") {
    return NextResponse.json({ player: p, win: checkWin(p.markedCells) });
  }

  p.markedCells[row][col] = !p.markedCells[row][col];
  p.lastActiveAt = Date.now();
  const win = checkWin(p.markedCells);
  p.hasWon = win.won;

  await savePlayer(p);
  return NextResponse.json({ player: p, win });
}
