export interface GameSession {
  id: string;
  name: string;       // URL slug, unique identifier
  title: string;
  description: string;
  words: string[];
  adminToken: string;
  createdAt: number;
  isActive: boolean;
  template?: string;
  freeCenter: boolean;
}

export interface PlayerBoard {
  sessionName: string;
  playerName: string;
  board: string[][];      // 5x5 grid
  markedCells: boolean[][];
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

export interface WinResult {
  won: boolean;
  lines: Array<{ type: "row" | "col" | "diag"; index: number }>;
}
