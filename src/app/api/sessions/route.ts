import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSession, saveSession } from "@/lib/storage";
import type { GameSession } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name?: string;
    title?: string;
    description?: string;
    words?: string[];
    template?: string;
    freeCenter?: boolean;
  };

  const { name, title, description, words, template, freeCenter } = body;

  if (!name || !/^[a-z0-9-]{3,40}$/.test(name)) {
    return NextResponse.json(
      { error: "Ungültiger Spielname. Nur Kleinbuchstaben, Zahlen, Bindestriche (3–40 Zeichen)." },
      { status: 400 }
    );
  }
  if (!title?.trim()) {
    return NextResponse.json({ error: "Titel ist erforderlich." }, { status: 400 });
  }
  if (!Array.isArray(words) || words.length < 24) {
    return NextResponse.json({ error: "Mindestens 24 Wörter erforderlich." }, { status: 400 });
  }
  if (await getSession(name)) {
    return NextResponse.json({ error: "Ein Spiel mit diesem Namen existiert bereits." }, { status: 409 });
  }

  const session: GameSession = {
    id: nanoid(),
    name,
    title: title.trim(),
    description: description?.trim() ?? "",
    words: words.map((w) => w.trim()).filter(Boolean),
    adminToken: nanoid(32),
    createdAt: Date.now(),
    isActive: true,
    template,
    freeCenter: freeCenter !== false,
  };

  await saveSession(session);
  return NextResponse.json({ name: session.name, adminToken: session.adminToken });
}
