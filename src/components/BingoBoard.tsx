'use client';

import { useState, useTransition } from 'react';
import BingoCell from './BingoCell';
import { isCellWinning } from '@/lib/bingo';
import type { PlayerBoard, WinResult } from '@/lib/types';

interface BingoBoardProps {
  player: PlayerBoard;
  sessionName: string;
  onWin?: (win: WinResult) => void;
}

export default function BingoBoard({ player: initialPlayer, sessionName, onWin }: BingoBoardProps) {
  const [player, setPlayer] = useState(initialPlayer);
  const [win, setWin] = useState<WinResult>({ won: false, lines: [] });
  const [isPending, startTransition] = useTransition();
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  const handleCellClick = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    setLastClicked(cellKey);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/sessions/${sessionName}/players/${encodeURIComponent(player.playerName)}/mark`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ row, col }),
          }
        );
        const data = await res.json();
        if (res.ok) {
          setPlayer(data.player);
          setWin(data.win);
          if (data.win.won && !win.won) {
            onWin?.(data.win);
          }
        }
      } finally {
        setLastClicked(null);
      }
    });
  };

  const COLUMNS = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Column headers */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {COLUMNS.map((letter) => (
          <div
            key={letter}
            className="flex items-center justify-center text-xl sm:text-3xl font-black text-blue-600 h-8 sm:h-10"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Board grid */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {player.board.map((row, rowIdx) =>
          row.map((word, colIdx) => {
            const isWinningCell = isCellWinning(rowIdx, colIdx, win.lines);
            const isMarked = player.markedCells[rowIdx][colIdx];
            const cellKey = `${rowIdx}-${colIdx}`;

            return (
              <BingoCell
                key={cellKey}
                word={word}
                marked={isMarked}
                winning={isWinningCell}
                onClick={() => handleCellClick(rowIdx, colIdx)}
                disabled={isPending && lastClicked === cellKey}
              />
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 text-center text-sm text-gray-500">
        {player.markedCells.flat().filter(Boolean).length} von 25 Feldern markiert
      </div>
    </div>
  );
}
