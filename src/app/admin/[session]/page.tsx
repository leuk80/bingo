'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { GameSession, PlayerBoard } from '@/lib/types';

interface PageProps {
  params: Promise<{ session: string }>;
}

export default function AdminPage({ params }: PageProps) {
  const { session: sessionName } = use(params);

  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Partial<PlayerBoard>[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [adminToken, setAdminToken] = useState('');

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWords, setEditWords] = useState('');
  const [editFreeCenter, setEditFreeCenter] = useState(true);
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(`adminToken:${sessionName}`) || '';
    setAdminToken(token);

    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [sessionRes, playersRes] = await Promise.all([
          fetch(`/api/sessions/${sessionName}`, {
            headers: { 'x-admin-token': token },
          }),
          fetch(`/api/sessions/${sessionName}/players`),
        ]);

        if (!sessionRes.ok) {
          setUnauthorized(true);
          return;
        }

        const sessionJson = await sessionRes.json();
        const s = sessionJson.session as GameSession;
        setSession(s);
        setEditTitle(s.title);
        setEditDescription(s.description || '');
        setEditWords(s.words.join('\n'));
        setEditFreeCenter(s.freeCenter);
        setEditActive(s.isActive);

        if (playersRes.ok) {
          const playersJson = await playersRes.json();
          setPlayers(playersJson.players);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');

    const words = editWords.split('\n').map((w) => w.trim()).filter(Boolean);

    try {
      const res = await fetch(`/api/sessions/${sessionName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          words,
          freeCenter: editFreeCenter,
          isActive: editActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMsg('Fehler: ' + data.error);
      } else {
        setSession(data.session);
        setSaveMsg('Gespeichert!');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const copyAdminLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const copyGameLink = () => {
    const url = `${window.location.origin}/game/${sessionName}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Lade...</div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Kein Zugriff</h1>
          <p className="text-gray-600 mb-6">
            Du hast keinen Admin-Zugang für dieses Spiel.
          </p>
          <Link
            href={`/game/${sessionName}`}
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Zur Spiellobby
          </Link>
        </div>
      </main>
    );
  }

  const wordCount = editWords.split('\n').map((w) => w.trim()).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/game/${sessionName}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mb-1"
            >
              ← Zur Lobby
            </Link>
            <h1 className="text-2xl font-black text-gray-800">⚙️ Spielverwaltung</h1>
          </div>
        </div>

        {/* Share links */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Links teilen</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 font-mono text-sm text-gray-600 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/game/${sessionName}` : `/game/${sessionName}`}
              </div>
              <button
                onClick={copyGameLink}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                🔗 Spiellink
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Mitspieler ({players.length})
          </h2>
          {players.length === 0 ? (
            <p className="text-gray-500 text-sm">Noch keine Mitspieler</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <div
                  key={p.playerName}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>{p.hasWon ? '🏆' : '👤'}</span>
                    <span className="font-medium text-gray-800">{p.playerName}</span>
                    {p.hasWon && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        BINGO!
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(p as { markedCount?: number }).markedCount ?? 0}/25 markiert
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Spiel bearbeiten</h2>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bingo-Wörter{' '}
                <span className="text-gray-400 font-normal">
                  ({wordCount} Wörter, min. 24)
                </span>
              </label>
              <textarea
                value={editWords}
                onChange={(e) => setEditWords(e.target.value)}
                rows={15}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Ein Wort/Phrase pro Zeile</p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFreeCenter}
                  onChange={(e) => setEditFreeCenter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Freies Mittelfeld (FREE)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Spiel aktiv</span>
              </label>
            </div>

            {saveMsg && (
              <p
                className={[
                  'text-sm rounded-lg p-3',
                  saveMsg.startsWith('Fehler')
                    ? 'text-red-600 bg-red-50'
                    : 'text-green-600 bg-green-50',
                ].join(' ')}
              >
                {saveMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || wordCount < 24}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {saving ? 'Speichere...' : 'Änderungen speichern'}
            </button>

            {wordCount < 24 && wordCount > 0 && (
              <p className="text-center text-amber-600 text-sm">
                Noch {24 - wordCount} weitere Wörter benötigt
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
