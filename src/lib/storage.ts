/**
 * Storage abstraction layer.
 * Uses Upstash Redis in production (via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
 * Falls back to in-memory storage for local development.
 */

import type { GameSession, PlayerBoard } from './types';

// ─── In-Memory Fallback ───────────────────────────────────────────────────────

const memStore = new Map<string, string>();

interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

function createMemAdapter(): StorageAdapter {
  return {
    async get(key) {
      return memStore.get(key) ?? null;
    },
    async set(key, value) {
      memStore.set(key, value);
    },
    async del(key) {
      memStore.delete(key);
    },
    async keys(pattern) {
      const prefix = pattern.replace('*', '');
      return Array.from(memStore.keys()).filter((k) => k.startsWith(prefix));
    },
  };
}

function createRedisAdapter(url: string, token: string): StorageAdapter {
  const baseUrl = url.replace(/\/$/, '');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  async function request(path: string, body?: unknown) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: body !== undefined ? 'POST' : 'GET',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Redis error: ${res.status}`);
    return res.json();
  }

  return {
    async get(key) {
      const data = await request('/get/' + encodeURIComponent(key));
      return data.result ?? null;
    },
    async set(key, value, ttlSeconds?: number) {
      const cmd = ttlSeconds
        ? ['SET', key, value, 'EX', String(ttlSeconds)]
        : ['SET', key, value];
      await request('', cmd);
    },
    async del(key) {
      await request('', ['DEL', key]);
    },
    async keys(pattern) {
      const data = await request('', ['KEYS', pattern]);
      return data.result ?? [];
    },
  };
}

function getAdapter(): StorageAdapter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return createRedisAdapter(url, token);
  }
  console.warn('[storage] No Redis config found – using in-memory store (data will be lost on restart)');
  return createMemAdapter();
}

const adapter = getAdapter();

// ─── Key helpers ─────────────────────────────────────────────────────────────

const SESSION_KEY = (name: string) => `session:${name}`;
const PLAYER_KEY = (session: string, player: string) => `player:${session}:${player}`;
const SESSION_PLAYERS_KEY = (session: string) => `players:${session}:*`;

// ─── Session operations ───────────────────────────────────────────────────────

export async function getSession(name: string): Promise<GameSession | null> {
  const raw = await adapter.get(SESSION_KEY(name));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function saveSession(session: GameSession): Promise<void> {
  await adapter.set(SESSION_KEY(session.name), JSON.stringify(session));
}

export async function deleteSession(name: string): Promise<void> {
  await adapter.del(SESSION_KEY(name));
}

// ─── Player operations ────────────────────────────────────────────────────────

export async function getPlayer(sessionName: string, playerName: string): Promise<PlayerBoard | null> {
  const raw = await adapter.get(PLAYER_KEY(sessionName, playerName));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function savePlayer(player: PlayerBoard): Promise<void> {
  await adapter.set(PLAYER_KEY(player.sessionName, player.playerName), JSON.stringify(player));
}

export async function getSessionPlayers(sessionName: string): Promise<PlayerBoard[]> {
  const keys = await adapter.keys(SESSION_PLAYERS_KEY(sessionName));
  if (!keys.length) return [];

  const players: PlayerBoard[] = [];
  for (const key of keys) {
    const raw = await adapter.get(key);
    if (raw) players.push(JSON.parse(raw));
  }
  return players.sort((a, b) => a.createdAt - b.createdAt);
}
