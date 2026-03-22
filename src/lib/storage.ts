/**
 * Storage layer.
 * Production: Cloudflare KV via getCloudflareContext() from @opennextjs/cloudflare.
 * Local dev (next dev): in-memory fallback – data lost on restart.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { GameSession, PlayerBoard } from "./types";

// ─── KV access ───────────────────────────────────────────────────────────────

function getKV(): KVNamespace | null {
  try {
    const { env } = getCloudflareContext();
    return (env as { BINGO_KV?: KVNamespace }).BINGO_KV ?? null;
  } catch {
    return null;
  }
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

const mem = new Map<string, string>();

async function get(key: string): Promise<string | null> {
  const kv = getKV();
  if (kv) return kv.get(key);
  return mem.get(key) ?? null;
}

async function put(key: string, value: string): Promise<void> {
  const kv = getKV();
  if (kv) await kv.put(key, value);
  else mem.set(key, value);
}

async function del(key: string): Promise<void> {
  const kv = getKV();
  if (kv) await kv.delete(key);
  else mem.delete(key);
}

async function listKeys(prefix: string): Promise<string[]> {
  const kv = getKV();
  if (kv) {
    const res = await kv.list({ prefix });
    return res.keys.map((k) => k.name);
  }
  return [...mem.keys()].filter((k) => k.startsWith(prefix));
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

const SK = (name: string) => `session:${name}`;
const PK = (session: string, player: string) => `player:${session}:${player}`;
const PP = (session: string) => `player:${session}:`;

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSession(name: string): Promise<GameSession | null> {
  const raw = await get(SK(name));
  return raw ? (JSON.parse(raw) as GameSession) : null;
}

export async function saveSession(session: GameSession): Promise<void> {
  await put(SK(session.name), JSON.stringify(session));
}

// ─── Players ──────────────────────────────────────────────────────────────────

export async function getPlayer(session: string, player: string): Promise<PlayerBoard | null> {
  const raw = await get(PK(session, player));
  return raw ? (JSON.parse(raw) as PlayerBoard) : null;
}

export async function savePlayer(player: PlayerBoard): Promise<void> {
  await put(PK(player.sessionName, player.playerName), JSON.stringify(player));
}

export async function getSessionPlayers(session: string): Promise<PlayerBoard[]> {
  const keys = await listKeys(PP(session));
  const players = await Promise.all(
    keys.map(async (k) => {
      const raw = await get(k);
      return raw ? (JSON.parse(raw) as PlayerBoard) : null;
    })
  );
  return (players.filter(Boolean) as PlayerBoard[]).sort((a, b) => a.createdAt - b.createdAt);
}
