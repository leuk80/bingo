/**
 * Storage layer using Cloudflare KV (via @cloudflare/next-on-pages).
 * Falls back to in-memory storage for local `next dev` without wrangler.
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { GameSession, PlayerBoard } from './types';

// ─── Cloudflare env type ──────────────────────────────────────────────────────

// ─── In-memory fallback (local dev without wrangler) ─────────────────────────

const memStore = new Map<string, string>();

// ─── KV helpers ───────────────────────────────────────────────────────────────

function getKV(): KVNamespace | null {
  try {
    const ctx = getRequestContext();
    const env = ctx.env as { BINGO_KV?: KVNamespace };
    return env.BINGO_KV ?? null;
  } catch {
    return null; // Running in local next dev (no Cloudflare context)
  }
}

async function kvGet(key: string): Promise<string | null> {
  const kv = getKV();
  if (kv) return kv.get(key);
  return memStore.get(key) ?? null;
}

async function kvPut(key: string, value: string): Promise<void> {
  const kv = getKV();
  if (kv) {
    await kv.put(key, value);
  } else {
    memStore.set(key, value);
  }
}

async function kvDelete(key: string): Promise<void> {
  const kv = getKV();
  if (kv) {
    await kv.delete(key);
  } else {
    memStore.delete(key);
  }
}

async function kvListKeys(prefix: string): Promise<string[]> {
  const kv = getKV();
  if (kv) {
    const result = await kv.list({ prefix });
    return result.keys.map((k) => k.name);
  }
  return Array.from(memStore.keys()).filter((k) => k.startsWith(prefix));
}

// ─── Key scheme ───────────────────────────────────────────────────────────────

const SESSION_KEY = (name: string) => `session:${name}`;
const PLAYER_KEY = (session: string, player: string) => `player:${session}:${player}`;
const PLAYER_PREFIX = (session: string) => `player:${session}:`;

// ─── Session operations ───────────────────────────────────────────────────────

export async function getSession(name: string): Promise<GameSession | null> {
  const raw = await kvGet(SESSION_KEY(name));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function saveSession(session: GameSession): Promise<void> {
  await kvPut(SESSION_KEY(session.name), JSON.stringify(session));
}

export async function deleteSession(name: string): Promise<void> {
  await kvDelete(SESSION_KEY(name));
}

// ─── Player operations ────────────────────────────────────────────────────────

export async function getPlayer(sessionName: string, playerName: string): Promise<PlayerBoard | null> {
  const raw = await kvGet(PLAYER_KEY(sessionName, playerName));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function savePlayer(player: PlayerBoard): Promise<void> {
  await kvPut(PLAYER_KEY(player.sessionName, player.playerName), JSON.stringify(player));
}

export async function getSessionPlayers(sessionName: string): Promise<PlayerBoard[]> {
  const keys = await kvListKeys(PLAYER_PREFIX(sessionName));
  if (!keys.length) return [];

  const players: PlayerBoard[] = [];
  for (const key of keys) {
    const raw = await kvGet(key);
    if (raw) players.push(JSON.parse(raw));
  }
  return players.sort((a, b) => a.createdAt - b.createdAt);
}
