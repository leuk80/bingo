"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { GameSession, PlayerBoard } from "@/lib/types";

type PlayerSummary = { playerName: string; hasWon: boolean; markedCount: number };

export default function AdminPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params);

  const [data, setData] = useState<Omit<GameSession, "adminToken"> | null>(null);
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editWords, setEditWords] = useState("");
  const [editFree, setEditFree] = useState(true);
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(`adminToken:${session}`) ?? "";
    setToken(t);
    if (!t) { setUnauthorized(true); setLoading(false); return; }

    Promise.all([
      fetch(`/api/sessions/${session}`, { headers: { "x-admin-token": t } }),
      fetch(`/api/sessions/${session}/players`),
    ]).then(async ([sr, pr]) => {
      if (!sr.ok) { setUnauthorized(true); setLoading(false); return; }
      const s = await sr.json() as { session: Omit<GameSession, "adminToken"> };
      setData(s.session);
      setEditTitle(s.session.title);
      setEditDesc(s.session.description);
      setEditWords(s.session.words.join("\n"));
      setEditFree(s.session.freeCenter);
      setEditActive(s.session.isActive);
      if (pr.ok) {
        const p = await pr.json() as { players: PlayerSummary[] };
        setPlayers(p.players);
      }
      setLoading(false);
    });
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const words = editWords.split("\n").map((w) => w.trim()).filter(Boolean);
    const res = await fetch(`/api/sessions/${session}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ title: editTitle, description: editDesc, words, freeCenter: editFree, isActive: editActive }),
    });
    const d = await res.json() as { error?: string };
    setMsg(res.ok ? "Gespeichert!" : `Fehler: ${d.error}`);
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/game/${session}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = editWords.split("\n").map((w) => w.trim()).filter(Boolean).length;

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">Lade…</p>
    </main>
  );

  if (unauthorized) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Kein Zugriff</h1>
        <p className="text-gray-500 mb-5">Du hast keinen Admin-Zugang für dieses Spiel.</p>
        <Link href={`/game/${session}`}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
          Zur Lobby
        </Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <Link href={`/game/${session}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Lobby</Link>
            <h1 className="text-2xl font-black text-gray-800 mt-1">⚙️ Spielverwaltung</h1>
          </div>
        </div>

        {/* Share */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-800 mb-3">Spiellink</h2>
          <div className="flex items-center gap-3">
            <span className="flex-1 bg-gray-50 rounded-lg px-3 py-2 font-mono text-sm text-gray-500 truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/game/${session}` : `/game/${session}`}
            </span>
            <button onClick={copyLink}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap">
              {copied ? "✓ Kopiert" : "🔗 Kopieren"}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-800 mb-3">Mitspieler ({players.length})</h2>
          {players.length === 0 ? (
            <p className="text-gray-400 text-sm">Noch keine Mitspieler</p>
          ) : (
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.playerName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{p.hasWon ? "🏆" : "👤"}</span>
                    <span className="font-medium text-gray-800">{p.playerName}</span>
                    {p.hasWon && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">BINGO!</span>}
                  </div>
                  <span className="text-sm text-gray-400">{p.markedCount}/25</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-gray-800 mb-4">Spiel bearbeiten</h2>
          <form onSubmit={handleSave} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bingo-Wörter <span className="text-gray-400 font-normal">({wordCount} Wörter, min. 24)</span>
              </label>
              <textarea value={editWords} onChange={(e) => setEditWords(e.target.value)} rows={14}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none font-mono text-sm" />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editFree} onChange={(e) => setEditFree(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Freies Mittelfeld</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Spiel aktiv</span>
              </label>
            </div>

            {msg && (
              <p className={["text-sm rounded-lg p-3",
                msg.startsWith("Fehler") ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"].join(" ")}>
                {msg}
              </p>
            )}

            <button type="submit" disabled={saving || wordCount < 24}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {saving ? "Speichere…" : "Änderungen speichern"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
