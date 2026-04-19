import type { GameState, HistoryState, SavedData, TimerState } from '../types/game.ts';
import { cloneBoard } from './board.ts';
import { createInitialGameState } from './gameState.ts';
import { createInitialTimerState } from './timer.ts';

const cloneMoveLog = (moveLog: SavedData['moveLog']): SavedData['moveLog'] =>
    moveLog.map(entry => ({
        notation: entry.notation,
        from: { ...entry.from },
        to: { ...entry.to }
    }));

export const hydrateFromSaved = (
    saved: SavedData | null
): { game: GameState; historyState: HistoryState; timer: TimerState } => {
    if (!saved) {
        return {
            game: createInitialGameState(),
            historyState: { moveLog: [] },
            timer: createInitialTimerState()
        };
    }

    return {
        game: {
            ...saved.game,
            board: cloneBoard(saved.game.board),
            selected: null,
            lastMove: null
        },
        historyState: {
            moveLog: cloneMoveLog(saved.moveLog)
        },
        timer: { ...saved.timer }
    };
};
