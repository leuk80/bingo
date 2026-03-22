import { NextRequest, NextResponse } from "next/server";
import { getSession, getPlayer, savePlayer } from "@/lib/storage";
import { newPlayerBoard } from "@/lib/bingo";

type Ctx = { params: Promise<{ name: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  const session = await getSession(name);
  if (!session) return NextResponse.json({ error: "Spiel nicht gefunden." }, { status: 404 });
  if (!session.isActive) return NextResponse.json({ error: "Dieses Spiel ist nicht mehr aktiv." }, { status: 403 });

  const { playerName } = await req.json() as { playerName?: string };
  const pName = playerName?.trim();
  if (!pName || pName.length < 1 || pName.length > 30) {
    return NextResponse.json({ error: "Name muss 1–30 Zeichen lang sein." }, { status: 400 });
  }

  // Return existing board unchanged
  const existing = await getPlayer(name, pName);
  if (existing) {
    existing.lastActiveAt = Date.now();
    await savePlayer(existing);
    return NextResponse.json({ player: existing, isNew: false });
  }

  const needed = session.freeCenter ? 24 : 25;
  if (session.words.length < needed) {
    return NextResponse.json({ error: `Zu wenig Wörter (${session.words.length}/${needed}).` }, { status: 400 });
  }

  const player = newPlayerBoard(name, pName, session.words, session.freeCenter);
  await savePlayer(player);
  return NextResponse.json({ player, isNew: true });
}
