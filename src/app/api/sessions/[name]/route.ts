import { NextRequest, NextResponse } from 'next/server';
import { getSession, saveSession } from '@/lib/storage';

// GET /api/sessions/[name] – get session info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const session = await getSession(name);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Don't expose adminToken in public response
  const { adminToken: _, ...publicSession } = session;
  return NextResponse.json({ session: publicSession });
}

// PUT /api/sessions/[name] – update session (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const session = await getSession(name);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const token = req.headers.get('x-admin-token');
  if (token !== session.adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, words, freeCenter, isActive } = body;

  if (title !== undefined) session.title = title.trim();
  if (description !== undefined) session.description = description.trim();
  if (freeCenter !== undefined) session.freeCenter = freeCenter;
  if (isActive !== undefined) session.isActive = isActive;

  if (words !== undefined) {
    if (!Array.isArray(words) || words.length < 24) {
      return NextResponse.json(
        { error: 'At least 24 words are required' },
        { status: 400 }
      );
    }
    session.words = words.map((w: string) => w.trim()).filter(Boolean);
  }

  await saveSession(session);

  const { adminToken: _, ...publicSession } = session;
  return NextResponse.json({ session: publicSession });
}
