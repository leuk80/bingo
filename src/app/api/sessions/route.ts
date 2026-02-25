import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSession, saveSession } from '@/lib/storage';
import type { GameSession } from '@/lib/types';

// Validate a session name to be URL-friendly
function isValidName(name: string): boolean {
  return /^[a-z0-9-]{3,40}$/.test(name);
}

// POST /api/sessions – create a new game session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, title, words, template, freeCenter, description } = body;

  if (!name || !isValidName(name)) {
    return NextResponse.json(
      { error: 'Invalid session name. Use 3-40 lowercase letters, numbers, or hyphens.' },
      { status: 400 }
    );
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!Array.isArray(words) || words.length < 24) {
    return NextResponse.json(
      { error: 'At least 24 words are required for a bingo game' },
      { status: 400 }
    );
  }

  // Check if session name already exists
  const existing = await getSession(name);
  if (existing) {
    return NextResponse.json(
      { error: 'A game with this name already exists' },
      { status: 409 }
    );
  }

  const session: GameSession = {
    id: nanoid(),
    name,
    title: title.trim(),
    description: description?.trim() || '',
    words: words.map((w: string) => w.trim()).filter(Boolean),
    adminToken: nanoid(32),
    createdAt: Date.now(),
    isActive: true,
    template,
    freeCenter: freeCenter !== false,
  };

  await saveSession(session);

  return NextResponse.json({
    session: {
      id: session.id,
      name: session.name,
      title: session.title,
      description: session.description,
      wordCount: session.words.length,
      freeCenter: session.freeCenter,
      template: session.template,
      createdAt: session.createdAt,
    },
    adminToken: session.adminToken,
  });
}
