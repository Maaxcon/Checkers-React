import type { ApiGameStateWithId, ApiMoveLogEntry } from '../types/api.ts';
import type { MoveLogEntry, SavedData } from '../types/game.ts';

const msToSeconds = (value: number): number =>
    Math.max(0, Math.floor(value / 1000));

const toMoveLogEntry = (entry: ApiMoveLogEntry): MoveLogEntry => ({
    notation: entry.notation,
    from: { ...entry.from },
    to: { ...entry.to }
});

export const toSavedData = (
    game: ApiGameStateWithId,
    moveLog: ApiMoveLogEntry[]
): SavedData => ({
    game: {
        board: game.board,
        turn: game.turn,
        multiJump: null,
        serverWinner: game.winner
    },
    moveLog: moveLog.map(toMoveLogEntry),
    timer: {
        light: msToSeconds(game.lightTimeRemaining),
        dark: msToSeconds(game.darkTimeRemaining),
        activePlayer: game.winner ? null : game.turn
    }
});
