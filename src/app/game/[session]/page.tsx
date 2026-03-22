"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GameSession, PlayerBoard } from "@/lib/types";

export default function LobbyPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params);
  const router = useRouter();

  const [sessionData, setSessionData] = useState<Omit<GameSession, "adminToken"> | null>(null);
  const [players, setPlayers] = useState<{ playerName: string; hasWon: boolean; markedCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem(`adminToken:${session}`));
    const saved = localStorage.getItem(`playerName:${session}`);
    if (saved) setPlayerName(saved);

    Promise.all([
      fetch(`/api/sessions/${session}`),
      fetch(`/api/sessions/${session}/players`),
    ]).then(async ([sr, pr]) => {
      if (!sr.ok) { setNotFound(true); setLoading(false); return; }
      const s = await sr.json() as { session: Omit<GameSession, "adminToken"> };
      setSessionData(s.session);
      if (pr.ok) {
        const p = await pr.json() as { players: typeof players };
        setPlayers(p.players);
      }
      setLoading(false);
    });
  }, [session]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setJoining(true);
    const name = playerName.trim();
    if (!name) { setJoinError("Bitte gib deinen Namen ein."); setJoining(false); return; }
    try {
      const res = await fetch(`/api/sessions/${session}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setJoinError(data.error ?? "Fehler"); return; }
      localStorage.setItem(`playerName:${session}`, name);
      router.push(`/game/${session}/${encodeURIComponent(name)}`);
    } finally {
      setJoining(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <p className="text-blue-600 font-medium animate-pulse">Lade Spiel…</p>
    </main>
  );

  if (notFound) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Spiel nicht gefunden</h1>
        <p className="text-gray-500 mb-5">„{session}" existiert nicht.</p>
        <Link href="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
          Zurück zur Startseite
        </Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-gray-800">{sessionData?.title}</h1>
              {sessionData?.description && <p className="text-gray-500 text-sm mt-1">{sessionData.description}</p>}
              <span className="inline-block text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded mt-2">/game/{session}</span>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={copyLink}
                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors whitespace-nowrap">
                {copied ? "✓ Kopiert!" : "🔗 Link kopieren"}
              </button>
              {isAdmin && (
                <Link href={`/admin/${session}`}
                  className="text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors whitespace-nowrap text-center">
                  ⚙️ Verwalten
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Join form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-800 mb-3">Mitspielen</h2>
          <form onSubmit={handleJoin} className="flex gap-3">
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Name" maxLength={30}
              className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
              required />
            <button type="submit" disabled={joining || !sessionData?.isActive}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-xl transition-colors whitespace-nowrap">
              {joining ? "…" : "Spielen →"}
            </button>
          </form>
          {joinError && <p className="text-red-600 text-sm mt-2 bg-red-50 rounded-lg p-2">{joinError}</p>}
          {sessionData && !sessionData.isActive && (
            <p className="text-amber-600 text-sm mt-2">Dieses Spiel ist momentan nicht aktiv.</p>
          )}
        </div>

        {/* Players */}
        {players.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-gray-800 mb-3">Mitspieler ({players.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((p) => (
                <div key={p.playerName}
                  className={["flex items-center gap-2 p-2 rounded-lg border",
                    p.hasWon ? "border-yellow-300 bg-yellow-50" : "border-gray-100 bg-gray-50"].join(" ")}>
                  <span>{p.hasWon ? "🏆" : "👤"}</span>
                  <span className="text-sm font-medium text-gray-700 truncate">{p.playerName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
