import { NextRequest, NextResponse } from "next/server";
import { getSession, saveSession } from "@/lib/storage";

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  const session = await getSession(name);
  if (!session) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const { adminToken: _, ...pub } = session;
  return NextResponse.json({ session: pub });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  const session = await getSession(name);
  if (!session) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  if (req.headers.get("x-admin-token") !== session.adminToken) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const body = await req.json() as {
    title?: string;
    description?: string;
    words?: string[];
    freeCenter?: boolean;
    isActive?: boolean;
  };

  if (body.title !== undefined) session.title = body.title.trim();
  if (body.description !== undefined) session.description = body.description.trim();
  if (body.freeCenter !== undefined) session.freeCenter = body.freeCenter;
  if (body.isActive !== undefined) session.isActive = body.isActive;
  if (body.words !== undefined) {
    if (body.words.length < 24)
      return NextResponse.json({ error: "Mindestens 24 Wörter erforderlich." }, { status: 400 });
    session.words = body.words.map((w) => w.trim()).filter(Boolean);
  }

  await saveSession(session);
  const { adminToken: _, ...pub } = session;
  return NextResponse.json({ session: pub });
}
