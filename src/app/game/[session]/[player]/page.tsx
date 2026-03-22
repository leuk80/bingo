"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import BingoBoard from "@/components/BingoBoard";
import WinModal from "@/components/WinModal";
import type { PlayerBoard, WinResult } from "@/lib/types";

export default function PlayerPage({ params }: { params: Promise<{ session: string; player: string }> }) {
  const { session, player: encodedPlayer } = use(params);
  const playerName = decodeURIComponent(encodedPlayer);

  const [board, setBoard] = useState<PlayerBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    fetch(`/api/sessions/${session}/players/${encodeURIComponent(playerName)}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json() as { player: PlayerBoard };
        setBoard(data.player);
        if (data.player.hasWon) setShowWin(true);
      })
      .finally(() => setLoading(false));
  }, [session, playerName]);

  if (loading) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <p className="text-blue-600 font-medium animate-pulse">Lade Spielfeld…</p>
    </main>
  );

  if (notFound) return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Spielfeld nicht gefunden</h1>
        <p className="text-gray-500 mb-5">Bitte trete dem Spiel über die Lobby bei.</p>
        <Link href={`/game/${session}`}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
          Zur Lobby
        </Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-3 sm:py-8 sm:px-4">
      {showWin && board && <WinModal playerName={playerName} onClose={() => setShowWin(false)} />}

      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/game/${session}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm">← Lobby</Link>
          <div className="text-right">
            <div className="font-bold text-gray-800">{playerName}</div>
            <div className="text-xs text-gray-400">{session}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-blue-700">BINGO</h1>
            <p className="text-sm text-gray-400">Klicke Felder um sie zu markieren</p>
          </div>
          {board && (
            <BingoBoard
              initial={board}
              sessionName={session}
              onWin={(win: WinResult) => { if (win.won) setShowWin(true); }}
            />
          )}
        </div>

        {board?.hasWon && (
          <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 text-center">
            <p className="text-xl font-black text-yellow-700">🏆 BINGO! Du hast gewonnen!</p>
            <button onClick={() => setShowWin(true)} className="mt-1 text-yellow-600 text-sm underline">
              Nochmal feiern
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
