import type { Player, GameResult } from '../constants/constants.ts';
import type { GameState } from '../models/GameState.ts';
import type { Piece } from '../models/Piece.ts';

export interface Position {
    row: number;
    col: number;
}

export interface HistoryHighlight {
    from: Position;
    to: Position;
}

export interface MoveAction {
    row: number;
    col: number;
    type: 'move';
}

export interface CaptureMove {
    row: number;
    col: number;
    type: 'capture';
    capturedRow: number;
    capturedCol: number;
}

export type Move = MoveAction | CaptureMove;

export interface MoveResult {
    becameKing: boolean;
}

export interface PlayerMoveStatus {
    hasCaptures: boolean;
    hasMoves: boolean;
}

export interface MoveLogEntry {
    notation: string;
    from: Position;
    to: Position;
}

export interface TimerState {
    light: number;
    dark: number;
    activePlayer: Player | null;
}

export type TimerTimes = Record<Player, string>;

export interface SerializedPiece {
    player: Player;
    isKing: boolean;
}

export type SavedGrid = (SerializedPiece | null)[][];
export type BoardGrid = (Piece | null)[][];

export interface SavedGameState {
    grid: SavedGrid;
    turn: Player;
    multiJumpPiece: Position | null;
    winner: Player | null;
}

export interface HistoryEntry {
    state: GameState;
    timer: TimerState;
}

export interface PersistedHistoryEntry {
    state: SavedGameState;
    timer?: TimerState;
}

export interface SavedData extends SavedGameState {
    history?: PersistedHistoryEntry[];
    moveLog?: MoveLogEntry[];
    timer?: TimerState;
}

export type GameOverReason = GameResult | null;

export type StorageProvider = {
    save: (data: SavedData) => void;
    load: () => SavedData | null;
    clear: () => void;
};
