import type { PlayerBoard, WinResult } from './types';

const BOARD_SIZE = 5;

/** Shuffle array using Fisher-Yates algorithm with a seeded approach */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Create a 5x5 bingo board from a list of words */
export function createBoard(words: string[], freeCenter: boolean): string[][] {
  const needed = freeCenter ? BOARD_SIZE * BOARD_SIZE - 1 : BOARD_SIZE * BOARD_SIZE;
  if (words.length < needed) {
    throw new Error(`Need at least ${needed} words for a bingo board`);
  }

  const shuffled = shuffleArray(words).slice(0, needed);
  const board: string[][] = [];

  let wordIndex = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (freeCenter && row === 2 && col === 2) {
        board[row][col] = 'FREE';
      } else {
        board[row][col] = shuffled[wordIndex++];
      }
    }
  }

  return board;
}

/** Create an empty marked cells grid */
export function createEmptyMarked(freeCenter: boolean): boolean[][] {
  const marked: boolean[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    marked[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Free center cell is pre-marked
      marked[row][col] = freeCenter && row === 2 && col === 2;
    }
  }
  return marked;
}

/** Check for bingo win conditions */
export function checkWin(markedCells: boolean[][]): WinResult {
  const lines: WinResult['lines'] = [];

  // Check rows
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (markedCells[row].every((cell) => cell)) {
      lines.push({ type: 'row', index: row });
    }
  }

  // Check columns
  for (let col = 0; col < BOARD_SIZE; col++) {
    if (markedCells.every((row) => row[col])) {
      lines.push({ type: 'col', index: col });
    }
  }

  // Check diagonal top-left to bottom-right
  if (markedCells.every((row, i) => row[i])) {
    lines.push({ type: 'diag', index: 0 });
  }

  // Check diagonal top-right to bottom-left
  if (markedCells.every((row, i) => row[BOARD_SIZE - 1 - i])) {
    lines.push({ type: 'diag', index: 1 });
  }

  return { won: lines.length > 0, lines };
}

/** Check if a specific cell is part of a winning line */
export function isCellWinning(
  row: number,
  col: number,
  lines: WinResult['lines']
): boolean {
  return lines.some((line) => {
    if (line.type === 'row') return line.index === row;
    if (line.type === 'col') return line.index === col;
    if (line.type === 'diag') {
      if (line.index === 0) return row === col;
      if (line.index === 1) return row + col === BOARD_SIZE - 1;
    }
    return false;
  });
}

/** Create a new PlayerBoard object */
export function createPlayerBoard(
  sessionName: string,
  playerName: string,
  words: string[],
  freeCenter: boolean
): Omit<PlayerBoard, 'id'> {
  const board = createBoard(words, freeCenter);
  const markedCells = createEmptyMarked(freeCenter);
  const now = Date.now();

  return {
    sessionName,
    playerName,
    board,
    markedCells,
    createdAt: now,
    lastActiveAt: now,
    hasWon: false,
  };
}
