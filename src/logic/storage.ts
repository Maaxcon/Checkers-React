import type { Board, GameState, SavedData, TimerState } from '../types/game.ts';
import { createInitialGameState } from './gameState.ts';
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

export const buildSavedData = (game: GameState, timer: TimerState): SavedData => ({
    game: {
        board: game.board,
        turn: game.turn,
        winner: game.winner,
        multiJump: game.multiJump
    },
    moveLog: game.moveLog,
    history: game.history,
    timer
});

export const hydrateFromSaved = (saved: SavedData | null): { game: GameState; timer: TimerState } => {
    if (!isValidSavedData(saved)) {
        return {
            game: createInitialGameState(),
            timer: createInitialTimerState()
        };
    }

    return {
        game: {
            ...saved.game,
            selected: null,
            moveLog: saved.moveLog ?? [],
            history: saved.history ?? []
        },
        timer: saved.timer ?? createInitialTimerState()
    };
};
