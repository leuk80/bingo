"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";

type View = "home" | "create" | "join";

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");

  // ── Create state ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("meeting");
  const [customWords, setCustomWords] = useState("");
  const [freeCenter, setFreeCenter] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Join state ────────────────────────────────────────────────────────────
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const slug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

  const selectedTpl = TEMPLATES.find((t) => t.id === template);
  const wordList =
    template === "custom"
      ? customWords.split("\n").map((w) => w.trim()).filter(Boolean)
      : selectedTpl?.words ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName, title, description, words: wordList, template, freeCenter }),
      });
      const data = await res.json() as { name?: string; adminToken?: string; error?: string };
      if (!res.ok) { setCreateError(data.error ?? "Fehler"); return; }
      localStorage.setItem(`adminToken:${sessionName}`, data.adminToken ?? "");
      router.push(`/game/${sessionName}`);
    } catch {
      setCreateError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setJoining(true);
    try {
      const res = await fetch(`/api/sessions/${joinName}`);
      if (!res.ok) { setJoinError("Kein Spiel mit diesem Namen gefunden."); return; }
      router.push(`/game/${joinName}`);
    } finally {
      setJoining(false);
    }
  };

  if (view === "home") return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-5xl font-black text-blue-700">BINGO!</h1>
          <p className="text-gray-500 mt-2">Das Online-Bingo für deine Gruppe</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-3">
          <button onClick={() => setView("create")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-colors">
            Neues Spiel erstellen
          </button>
          <button onClick={() => setView("join")}
            className="w-full border-2 border-blue-200 hover:bg-blue-50 text-blue-600 font-bold py-4 rounded-xl text-lg transition-colors">
            Spiel beitreten
          </button>
        </div>
        <p className="text-center text-sm text-gray-400 mt-5">Kein Account · Sofort · Gratis</p>
      </div>
    </main>
  );

  if (view === "join") return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button onClick={() => setView("home")} className="mb-5 text-blue-600 hover:text-blue-800 font-medium">← Zurück</button>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-black text-gray-800 mb-5">Spiel beitreten</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spielname</label>
              <input type="text" value={joinName}
                onChange={(e) => setJoinName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="z.B. team-meeting-bingo"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                required />
            </div>
            {joinError && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{joinError}</p>}
            <button type="submit" disabled={joining}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
              {joining ? "Suche…" : "Spiel suchen →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView("home")} className="mb-5 text-blue-600 hover:text-blue-800 font-medium">← Zurück</button>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-black text-gray-800 mb-6">Neues Bingo-Spiel erstellen</h2>
          <form onSubmit={handleCreate} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titel <span className="text-red-500">*</span></label>
              <input type="text" value={title}
                onChange={(e) => { setTitle(e.target.value); if (!sessionName) setSessionName(slug(e.target.value)); }}
                placeholder="z.B. Team Meeting Bingo Q2"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none"
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spielname (URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm whitespace-nowrap">/game/</span>
                <input type="text" value={sessionName}
                  onChange={(e) => setSessionName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))}
                  placeholder="team-bingo"
                  className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none font-mono text-sm"
                  required minLength={3} maxLength={40} pattern="[a-z0-9-]{3,40}" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Kleinbuchstaben, Zahlen, Bindestriche (3–40 Zeichen)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Für unser wöchentliches Teammeeting"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vorlage</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                    className={["p-3 rounded-lg border-2 text-left transition-colors",
                      template === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"].join(" ")}>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {template === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wörter <span className="text-gray-400">(min. 24, ein Wort pro Zeile)</span>
                </label>
                <textarea value={customWords} onChange={(e) => setCustomWords(e.target.value)}
                  rows={10} placeholder={"Wort 1\nWort 2\nWort 3\n…"}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none font-mono text-sm" />
                <p className="text-xs text-gray-400 mt-1">{wordList.length} Wörter</p>
              </div>
            )}

            {template !== "custom" && wordList.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Vorlage ({wordList.length} Wörter)</p>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                  {wordList.map((w, i) => (
                    <span key={i} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={freeCenter} onChange={(e) => setFreeCenter(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Freies Mittelfeld (FREE)</span>
            </label>

            {createError && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{createError}</p>}

            <button type="submit" disabled={creating || wordList.length < 24}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-lg transition-colors">
              {creating ? "Erstelle Spiel…" : "Spiel erstellen 🎯"}
            </button>
            {wordList.length > 0 && wordList.length < 24 && (
              <p className="text-center text-amber-600 text-sm">Noch {24 - wordList.length} Wörter benötigt</p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
