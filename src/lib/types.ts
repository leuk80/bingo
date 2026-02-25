export interface GameSession {
  id: string;
  name: string; // URL-friendly slug (unique identifier)
  title: string;
  description?: string;
  words: string[];
  adminToken: string;
  createdAt: number;
  isActive: boolean;
  template?: string;
  freeCenter: boolean; // Whether to use a FREE center cell
}

export interface PlayerBoard {
  sessionName: string;
  playerName: string;
  board: string[][]; // 5x5 grid of words
  markedCells: boolean[][]; // Which cells are marked
  createdAt: number;
  lastActiveAt: number;
  hasWon: boolean;
}

export interface BingoTemplate {
  id: string;
  name: string;
  description: string;
  words: string[];
}

export type WinResult = {
  won: boolean;
  lines: Array<{ type: 'row' | 'col' | 'diag'; index: number }>;
};
