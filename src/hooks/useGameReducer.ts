import { useCallback, useReducer } from 'react';
import type { Move, Position, SavedData, TimerState } from '../types/game.ts';
import type { Player } from '../constants/index.ts';
import { applyMove } from '../logic/applyMove.ts';
import { gameReducer } from '../logic/gameReducer.ts';
import { historyReducer } from '../logic/historyReducer.ts';
import { extractCoreState } from '../logic/gameState.ts';
import { hydrateFromSaved } from '../logic/storage.ts';

export const useGameReducer = (saved: SavedData | null) => {
    const [game, dispatch] = useReducer(gameReducer, saved, (data) => hydrateFromSaved(data).game);
    const [historyState, dispatchHistory] = useReducer(
        historyReducer,
        saved,
        (data) => hydrateFromSaved(data).historyState
    );

    const select = useCallback((position: Position | null) => {
        dispatch({ type: 'SELECT', position });
    }, []);

    const applyGameMove = useCallback((from: Position, move: Move, timer: TimerState) => {
        if (game.timeoutWinner) return;

        const previousGame = extractCoreState(game);
        const shouldRecordHistory = game.multiJump === null;
        const result = applyMove(previousGame, historyState.moveLog, from, move);
        const selected = result.state.multiJump
            ? { row: move.row, col: move.col }
            : null;

        dispatch({
            type: 'APPLY_MOVE',
            game: result.state,
            selected
        });
        dispatchHistory({
            type: 'APPLY_MOVE',
            previousGame,
            previousMoveLog: historyState.moveLog,
            nextMoveLog: result.moveLog,
            timer,
            shouldRecordHistory
        });
    }, [game, historyState.moveLog]);

    const undo = useCallback((): TimerState | null => {
        if (historyState.history.length === 0) return null;
        const last = historyState.history[historyState.history.length - 1];
        dispatch({
            type: 'UNDO',
            game: last.game
        });
        dispatchHistory({ type: 'UNDO' });
        return last.timer ?? null;
    }, [historyState.history]);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
        dispatchHistory({ type: 'RESET' });
    }, []);

    const setTimeoutWinner = useCallback((winner: Player) => {
        dispatch({ type: 'SET_TIMEOUT_WINNER', winner });
    }, []);

    return {
        game,
        historyState,
        select,
        applyGameMove,
        undo,
        reset,
        setTimeoutWinner
    };
};
