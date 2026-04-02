import { PLAYERS } from '../constants/index.ts';
import type {
    Board,
    GameCoreState,
    GameState,
    HistoryEntry,
    HistoryState,
    SavedData,
    TimerState
} from '../types/game.ts';
import { createInitialGameState, extractCoreState } from './gameState.ts';
import { calculateWinner } from './rules.ts';
import { createInitialTimerState } from './timer.ts';

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isBoard = (value: unknown): value is Board =>
    Array.isArray(value) && value.every(row => Array.isArray(row));

const isValidSavedData = (saved: SavedData | null): saved is SavedData => {
    if (!saved || !isObject(saved)) return false;
    if (!('game' in saved) || !isObject(saved.game)) return false;
    return isBoard(saved.game.board);
};

export const sanitizeSavedData = (saved: SavedData | null): SavedData | null =>
    isValidSavedData(saved) ? saved : null;

type LegacyGameCoreState = {
    board: Board;
    turn: GameCoreState['turn'];
    multiJump?: GameCoreState['multiJump'];
    timeoutWinner?: GameCoreState['timeoutWinner'];
    winner?: GameCoreState['turn'] | null;
};

const isPlayer = (value: unknown): value is GameCoreState['turn'] =>
    value === PLAYERS.LIGHT || value === PLAYERS.DARK;

const normalizeTimeoutWinner = (game: LegacyGameCoreState): GameCoreState['timeoutWinner'] => {
    if (game.timeoutWinner === null) return null;
    if (isPlayer(game.timeoutWinner)) return game.timeoutWinner;

    const legacyWinner = game.winner;
    if (!isPlayer(legacyWinner)) return null;

    const derivedWinner = calculateWinner({
        board: game.board,
        turn: game.turn,
        multiJump: game.multiJump ?? null,
        timeoutWinner: null
    });

    return derivedWinner === legacyWinner ? null : legacyWinner;
};

const normalizeGameCoreState = (game: LegacyGameCoreState): GameCoreState => ({
    board: game.board,
    turn: game.turn,
    multiJump: game.multiJump ?? null,
    timeoutWinner: normalizeTimeoutWinner(game)
});

const normalizeHistoryEntry = (entry: HistoryEntry): HistoryEntry => ({
    game: normalizeGameCoreState(entry.game as HistoryEntry['game'] & LegacyGameCoreState),
    moveLog: entry.moveLog ?? [],
    timer: entry.timer ?? createInitialTimerState()
});

export const buildSavedData = (
    game: GameState,
    historyState: HistoryState,
    timer: TimerState
): SavedData => ({
    game: extractCoreState(game),
    moveLog: historyState.moveLog,
    history: historyState.history,
    timer
});

export const hydrateFromSaved = (
    saved: SavedData | null
): { game: GameState; historyState: HistoryState; timer: TimerState } => {
    if (!isValidSavedData(saved)) {
        return {
            game: createInitialGameState(),
            historyState: {
                moveLog: [],
                history: []
            },
            timer: createInitialTimerState()
        };
    }

    const game = normalizeGameCoreState(saved.game as SavedData['game'] & LegacyGameCoreState);

    return {
        game: {
            ...game,
            selected: null
        },
        historyState: {
            moveLog: saved.moveLog ?? [],
            history: (saved.history ?? []).map(normalizeHistoryEntry)
        },
        timer: saved.timer ?? createInitialTimerState()
    };
};
