import { PLAYERS } from '../constants/index.ts';
import type {
    Board,
    GameCoreState,
    GameState,
    HistoryEntry,
    HistoryState,
    MoveLogEntry,
    Position,
    SavedData,
    TimerState
} from '../types/game.ts';
import { createInitialGameState, extractCoreState } from './gameState.ts';
import { calculateWinner } from './rules.ts';
import { createInitialTimerState } from './timer.ts';

type LegacyGameCoreState = {
    board: Board;
    turn: GameCoreState['turn'];
    multiJump?: GameCoreState['multiJump'];
    timeoutWinner?: GameCoreState['timeoutWinner'];
    winner?: GameCoreState['turn'] | null;
};

type LegacyHistoryEntry = {
    game: LegacyGameCoreState;
    moveLog?: MoveLogEntry[];
    timer?: TimerState;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isPlayer = (value: unknown): value is GameCoreState['turn'] =>
    value === PLAYERS.LIGHT || value === PLAYERS.DARK;

const isPosition = (value: unknown): value is Position =>
    isObject(value) &&
    typeof value.row === 'number' &&
    Number.isInteger(value.row) &&
    typeof value.col === 'number' &&
    Number.isInteger(value.col);

const isNullablePosition = (value: unknown): value is Position | null =>
    value === null || isPosition(value);

const isNullablePlayer = (value: unknown): value is GameCoreState['turn'] | null =>
    value === null || isPlayer(value);

const isPiece = (value: unknown): boolean =>
    isObject(value) &&
    isPlayer(value.player) &&
    typeof value.isKing === 'boolean';

const isBoard = (value: unknown): value is Board =>
    Array.isArray(value) &&
    value.every(
        row => Array.isArray(row) && row.every(cell => cell === null || isPiece(cell))
    );

const isMoveLogEntry = (value: unknown): value is MoveLogEntry =>
    isObject(value) &&
    typeof value.notation === 'string' &&
    isPosition(value.from) &&
    isPosition(value.to);

const isMoveLog = (value: unknown): value is MoveLogEntry[] =>
    Array.isArray(value) && value.every(isMoveLogEntry);

const isTimerState = (value: unknown): value is TimerState =>
    isObject(value) &&
    typeof value.light === 'number' &&
    Number.isFinite(value.light) &&
    typeof value.dark === 'number' &&
    Number.isFinite(value.dark) &&
    isNullablePlayer(value.activePlayer);

const isLegacyGameCoreState = (value: unknown): value is LegacyGameCoreState =>
    isObject(value) &&
    isBoard(value.board) &&
    isPlayer(value.turn) &&
    (value.multiJump === undefined || isNullablePosition(value.multiJump)) &&
    (value.timeoutWinner === undefined || isNullablePlayer(value.timeoutWinner)) &&
    (value.winner === undefined || isNullablePlayer(value.winner));

const isHistoryEntry = (value: unknown): value is HistoryEntry =>
    isObject(value) &&
    isLegacyGameCoreState(value.game) &&
    (value.moveLog === undefined || isMoveLog(value.moveLog)) &&
    (value.timer === undefined || isTimerState(value.timer));

const isHistory = (value: unknown): value is HistoryEntry[] =>
    Array.isArray(value) && value.every(isHistoryEntry);

export const isSavedData = (saved: unknown): saved is SavedData => {
    if (!isObject(saved)) return false;
    if (!isLegacyGameCoreState(saved.game)) return false;
    if (saved.moveLog !== undefined && !isMoveLog(saved.moveLog)) return false;
    if (saved.history !== undefined && !isHistory(saved.history)) return false;
    if (saved.timer !== undefined && !isTimerState(saved.timer)) return false;
    return true;
};

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

const normalizeHistoryEntry = (entry: LegacyHistoryEntry): HistoryEntry => ({
    game: normalizeGameCoreState(entry.game),
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
    if (!isSavedData(saved)) {
        return {
            game: createInitialGameState(),
            historyState: {
                moveLog: [],
                history: []
            },
            timer: createInitialTimerState()
        };
    }

    const game = normalizeGameCoreState(saved.game);

    return {
        game: {
            ...game,
            selected: null,
            lastMove: null
        },
        historyState: {
            moveLog: saved.moveLog ?? [],
            history: (saved.history ?? []).map(normalizeHistoryEntry)
        },
        timer: saved.timer ?? createInitialTimerState()
    };
};
