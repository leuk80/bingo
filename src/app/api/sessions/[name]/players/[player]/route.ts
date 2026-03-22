import { NextRequest, NextResponse } from "next/server";
import { getPlayer, savePlayer } from "@/lib/storage";

type Ctx = { params: Promise<{ name: string; player: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name, player } = await params;
  const p = await getPlayer(name, decodeURIComponent(player));
  if (!p) return NextResponse.json({ error: "Spieler nicht gefunden." }, { status: 404 });

  p.lastActiveAt = Date.now();
  await savePlayer(p);
  return NextResponse.json({ player: p });
}
