import type { PlayerBoard, WinResult } from "./types";

const SIZE = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createBoard(words: string[], freeCenter: boolean): string[][] {
  const needed = freeCenter ? SIZE * SIZE - 1 : SIZE * SIZE;
  const picked = shuffle(words).slice(0, needed);
  const board: string[][] = [];
  let i = 0;
  for (let r = 0; r < SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < SIZE; c++) {
      board[r][c] = freeCenter && r === 2 && c === 2 ? "FREE" : picked[i++];
    }
  }
  return board;
}

export function createEmptyMarked(freeCenter: boolean): boolean[][] {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => freeCenter && r === 2 && c === 2)
  );
}

export function checkWin(marked: boolean[][]): WinResult {
  const lines: WinResult["lines"] = [];

  for (let r = 0; r < SIZE; r++)
    if (marked[r].every(Boolean)) lines.push({ type: "row", index: r });

  for (let c = 0; c < SIZE; c++)
    if (marked.every((row) => row[c])) lines.push({ type: "col", index: c });

  if (marked.every((row, i) => row[i])) lines.push({ type: "diag", index: 0 });
  if (marked.every((row, i) => row[SIZE - 1 - i])) lines.push({ type: "diag", index: 1 });

  return { won: lines.length > 0, lines };
}

export function isCellWinning(row: number, col: number, lines: WinResult["lines"]): boolean {
  return lines.some((l) => {
    if (l.type === "row") return l.index === row;
    if (l.type === "col") return l.index === col;
    if (l.type === "diag") {
      if (l.index === 0) return row === col;
      return row + col === SIZE - 1;
    }
    return false;
  });
}

export function newPlayerBoard(
  sessionName: string,
  playerName: string,
  words: string[],
  freeCenter: boolean
): PlayerBoard {
  const now = Date.now();
  return {
    sessionName,
    playerName,
    board: createBoard(words, freeCenter),
    markedCells: createEmptyMarked(freeCenter),
    createdAt: now,
    lastActiveAt: now,
    hasWon: false,
  };
}
