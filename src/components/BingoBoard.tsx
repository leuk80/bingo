"use client";

import { useState, useTransition } from "react";
import BingoCell from "./BingoCell";
import { isCellWinning } from "@/lib/bingo";
import type { PlayerBoard, WinResult } from "@/lib/types";

interface Props {
  initial: PlayerBoard;
  sessionName: string;
  onWin?: (win: WinResult) => void;
}

export default function BingoBoard({ initial, sessionName, onWin }: Props) {
  const [player, setPlayer] = useState(initial);
  const [win, setWin] = useState<WinResult>({ won: false, lines: [] });
  const [isPending, startTransition] = useTransition();

  const handleClick = (row: number, col: number) => {
    startTransition(async () => {
      const res = await fetch(
        `/api/sessions/${sessionName}/players/${encodeURIComponent(player.playerName)}/mark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ row, col }),
        }
      );
      if (!res.ok) return;
      const data = await res.json() as { player: PlayerBoard; win: WinResult };
      setPlayer(data.player);
      setWin(data.win);
      if (data.win.won && !win.won) onWin?.(data.win);
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="grid grid-cols-5 gap-1 mb-1">
        {["B", "I", "N", "G", "O"].map((l) => (
          <div key={l} className="flex items-center justify-center text-2xl sm:text-3xl font-black text-blue-600 h-8">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {player.board.map((row, r) =>
          row.map((word, c) => (
            <BingoCell
              key={`${r}-${c}`}
              word={word}
              marked={player.markedCells[r][c]}
              winning={isCellWinning(r, c, win.lines)}
              onClick={() => handleClick(r, c)}
            />
          ))
        )}
      </div>
      <p className="mt-3 text-center text-sm text-gray-400">
        {player.markedCells.flat().filter(Boolean).length} / 25 Felder markiert
        {isPending && " …"}
      </p>
    </div>
  );
}
