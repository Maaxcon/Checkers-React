import type { Player } from '../constants/index.ts';

export type Position = {
    row: number;
    col: number;
};

export type HistoryHighlight = {
    from: Position;
    to: Position;
};

export type Piece = {
    player: Player;
    isKing: boolean;
};

export type Board = (Piece | null)[][];

export type MoveAction = {
    row: number;
    col: number;
    type: 'move';
};

export type CaptureMove = {
    row: number;
    col: number;
    type: 'capture';
    capturedRow: number;
    capturedCol: number;
};

export type Move = MoveAction | CaptureMove;

export type PlayerMoveStatus = {
    hasCaptures: boolean;
    hasMoves: boolean;
};

export type MoveLogEntry = {
    notation: string;
    from: Position;
    to: Position;
};

export type LastMove = {
    from: Position;
    to: Position;
};

export type TimerState = {
    light: number;
    dark: number;
    activePlayer: Player | null;
};

export type TimerTimes = Record<Player, string>;

export type GameCoreState = {
    board: Board;
    turn: Player;
    multiJump: Position | null;
    timeoutWinner: Player | null;
};

export type HistoryEntry = {
    game: GameCoreState;
    moveLog: MoveLogEntry[];
    timer: TimerState;
};

export type HistoryState = {
    moveLog: MoveLogEntry[];
    history: HistoryEntry[];
};

export type GameState = GameCoreState & {
    selected: Position | null;
    lastMove: LastMove | null;
};

export type SavedData = {
    game: GameCoreState;
    moveLog: MoveLogEntry[];
    history: HistoryEntry[];
    timer: TimerState;
};

export type CapturedCounts = {
    byLight: number;
    byDark: number;
};
