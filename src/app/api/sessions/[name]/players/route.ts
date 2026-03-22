import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionPlayers } from "@/lib/storage";

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  if (!await getSession(name)) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const players = await getSessionPlayers(name);
  return NextResponse.json({
    players: players.map((p) => ({
      playerName: p.playerName,
      hasWon: p.hasWon,
      markedCount: p.markedCells.flat().filter(Boolean).length,
      createdAt: p.createdAt,
      lastActiveAt: p.lastActiveAt,
    })),
  });
}
