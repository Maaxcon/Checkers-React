import type {
    GameCoreState,
    HistoryEntry,
    HistoryState,
    MoveLogEntry,
    TimerState
} from '../types/game.ts';
import { cloneBoard } from './board.ts';

export type HistoryAction =
    | {
        type: 'APPLY_MOVE';
        previousGame: GameCoreState;
        previousMoveLog: MoveLogEntry[];
        nextMoveLog: MoveLogEntry[];
        timer: TimerState;
        shouldRecordHistory: boolean;
    }
    | { type: 'UNDO' }
    | { type: 'RESET' };

const cloneMoveLog = (moveLog: MoveLogEntry[]): MoveLogEntry[] =>
    moveLog.map(entry => ({
        notation: entry.notation,
        from: { ...entry.from },
        to: { ...entry.to }
    }));

const cloneGameSnapshot = (game: GameCoreState): GameCoreState => ({
    ...game,
    board: cloneBoard(game.board),
    multiJump: game.multiJump ? { ...game.multiJump } : null
});

const cloneHistoryEntry = (entry: HistoryEntry): HistoryEntry => ({
    game: cloneGameSnapshot(entry.game),
    moveLog: cloneMoveLog(entry.moveLog),
    timer: { ...entry.timer }
});

const createHistoryEntry = (
    previousGame: GameCoreState,
    previousMoveLog: MoveLogEntry[],
    timer: TimerState
): HistoryEntry => ({
    game: cloneGameSnapshot(previousGame),
    moveLog: cloneMoveLog(previousMoveLog),
    timer: { ...timer }
});

export const createInitialHistoryState = (): HistoryState => ({
    moveLog: [],
    history: []
});

export const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
    switch (action.type) {
        case 'APPLY_MOVE':
            return {
                moveLog: cloneMoveLog(action.nextMoveLog),
                history: action.shouldRecordHistory
                    ? [...state.history, createHistoryEntry(action.previousGame, action.previousMoveLog, action.timer)]
                    : state.history
            };
        case 'UNDO': {
            if (state.history.length === 0) return state;
            const last = cloneHistoryEntry(state.history[state.history.length - 1]);
            return {
                moveLog: last.moveLog,
                history: state.history.slice(0, -1)
            };
        }
        case 'RESET':
            return createInitialHistoryState();
        default:
            return state;
    }
};
