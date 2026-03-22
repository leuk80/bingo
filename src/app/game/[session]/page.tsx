'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GameSession, PlayerBoard } from '@/lib/types';

interface PageProps {
  params: Promise<{ session: string }>;
}

export default function SessionLobbyPage({ params }: PageProps) {
  const { session: sessionName } = use(params);
  const router = useRouter();

  const [sessionData, setSessionData] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Partial<PlayerBoard>[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if this user is the admin
    const token = localStorage.getItem(`adminToken:${sessionName}`);
    setIsAdmin(!!token);

    // Load saved player name
    const saved = localStorage.getItem(`playerName:${sessionName}`);
    if (saved) setPlayerName(saved);

    async function load() {
      try {
        const [sessionRes, playersRes] = await Promise.all([
          fetch(`/api/sessions/${sessionName}`),
          fetch(`/api/sessions/${sessionName}/players`),
        ]);

        if (!sessionRes.ok) {
          setNotFound(true);
          return;
        }

        const sessionJson = await sessionRes.json() as { session: GameSession };
        setSessionData(sessionJson.session);

        if (playersRes.ok) {
          const playersJson = await playersRes.json() as { players: Partial<PlayerBoard>[] };
          setPlayers(playersJson.players);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionName]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoining(true);

    const name = playerName.trim();
    if (!name) {
      setJoinError('Bitte gib deinen Namen ein.');
      setJoining(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionName}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setJoinError(data.error ?? 'Fehler beim Beitreten');
        return;
      }

      localStorage.setItem(`playerName:${sessionName}`, name);
      router.push(`/game/${sessionName}/${encodeURIComponent(name)}`);
    } catch {
      setJoinError('Ein Fehler ist aufgetreten.');
    } finally {
      setJoining(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-medium animate-pulse">Lade Spiel...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Spiel nicht gefunden</h1>
          <p className="text-gray-600 mb-6">
            Das Spiel &quot;{sessionName}&quot; existiert nicht.
          </p>
          <Link
            href="/"
            className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-800">{sessionData?.title}</h1>
              {sessionData?.description && (
                <p className="text-gray-500 mt-1">{sessionData.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                  /game/{sessionName}
                </span>
                {!sessionData?.isActive && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium">
                    Inaktiv
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                {copied ? '✓ Kopiert!' : '🔗 Link kopieren'}
              </button>
              {isAdmin && (
                <Link
                  href={`/admin/${sessionName}`}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
                >
                  ⚙️ Verwalten
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Join form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Mitspielen</h2>

          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Name"
              maxLength={30}
              className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={joining || !sessionData?.isActive}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              {joining ? '...' : 'Spielen →'}
            </button>
          </form>

          {joinError && (
            <p className="text-red-600 text-sm mt-2 bg-red-50 rounded-lg p-2">{joinError}</p>
          )}

          {!sessionData?.isActive && (
            <p className="text-amber-600 text-sm mt-2">
              Dieses Spiel ist momentan nicht aktiv.
            </p>
          )}
        </div>

        {/* Players list */}
        {players.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Mitspieler ({players.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((p) => (
                <div
                  key={p.playerName}
                  className={[
                    'flex items-center gap-2 p-2 rounded-lg border',
                    p.hasWon
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-100 bg-gray-50',
                  ].join(' ')}
                >
                  <span className="text-lg">{p.hasWon ? '🏆' : '👤'}</span>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {p.playerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
