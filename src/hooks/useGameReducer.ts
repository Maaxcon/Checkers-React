import { useCallback, useReducer } from 'react';
import type {
    GameCoreState,
    LastMove,
    MoveLogEntry,
    Position,
    SavedData
} from '../types/game.ts';
import type { Player } from '../constants/index.ts';
import { gameReducer } from '../logic/gameReducer.ts';
import { historyReducer } from '../logic/historyReducer.ts';
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

    const clearLastMove = useCallback(() => {
        dispatch({ type: 'CLEAR_LAST_MOVE' });
    }, []);

    const setTimeoutWinner = useCallback((winner: Player) => {
        dispatch({ type: 'SET_TIMEOUT_WINNER', winner });
    }, []);

    const setFromServer = useCallback((nextGame: GameCoreState, moveLog: MoveLogEntry[], lastMove: LastMove | null) => {
        dispatch({
            type: 'APPLY_MOVE',
            game: nextGame,
            selected: nextGame.multiJump ? { ...nextGame.multiJump } : null,
            lastMove
        });
        dispatchHistory({ type: 'SET_FROM_SERVER', moveLog });
    }, []);

    return {
        game,
        historyState,
        select,
        clearLastMove,
        setTimeoutWinner,
        setFromServer
    };
};
