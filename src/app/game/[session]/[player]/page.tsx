'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import BingoBoard from '@/components/BingoBoard';
import WinModal from '@/components/WinModal';
import type { PlayerBoard, WinResult } from '@/lib/types';

interface PageProps {
  params: Promise<{ session: string; player: string }>;
}

export default function PlayerBoardPage({ params }: PageProps) {
  const { session: sessionName, player: encodedPlayer } = use(params);
  const playerName = decodeURIComponent(encodedPlayer);

  const [playerData, setPlayerData] = useState<PlayerBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/sessions/${sessionName}/players/${encodeURIComponent(playerName)}`
        );
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json() as { player: PlayerBoard };
        setPlayerData(data.player);

        // Show win modal if already won
        if (data.player.hasWon) {
          setShowWinModal(true);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionName, playerName]);

  const handleWin = (win: WinResult) => {
    if (win.won) setShowWinModal(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl font-medium animate-pulse">Lade Spielfeld...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Spielfeld nicht gefunden</h1>
          <p className="text-gray-600 mb-6">
            Bitte trete dem Spiel über den Lobby-Link bei.
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-3 sm:py-8 sm:px-4">
      {showWinModal && (
        <WinModal playerName={playerName} onClose={() => setShowWinModal(false)} />
      )}

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/game/${sessionName}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
          >
            ← Lobby
          </Link>
          <div className="text-right">
            <div className="font-bold text-gray-800">{playerName}</div>
            <div className="text-xs text-gray-500">{sessionName}</div>
          </div>
        </div>

        {/* Bingo card */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="text-center mb-4">
            <h1 className="text-xl sm:text-2xl font-black text-blue-700">BINGO</h1>
            <p className="text-sm text-gray-500">Klicke auf Felder um sie zu markieren</p>
          </div>

          {playerData && (
            <BingoBoard
              player={playerData}
              sessionName={sessionName}
              onWin={handleWin}
            />
          )}
        </div>

        {/* Win banner */}
        {playerData?.hasWon && (
          <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 text-center">
            <p className="text-xl font-black text-yellow-700">🏆 BINGO! Du hast gewonnen!</p>
            <button
              onClick={() => setShowWinModal(true)}
              className="mt-2 text-yellow-600 text-sm underline"
            >
              Nochmal feiern
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Dein Spielfeld wird automatisch gespeichert
        </div>
      </div>
    </main>
  );
}
