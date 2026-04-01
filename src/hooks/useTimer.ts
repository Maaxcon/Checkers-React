import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { TimerState } from '../types/game.ts';
import { createInitialTimerState, getTimerTimes, timerReducer } from '../logic/timer.ts';

export type TimerHookOptions = {
    initial?: TimerState | null;
    isRunning: boolean;
    onTimeout: (winner: Player) => void;
};

export const useTimer = ({ initial, isRunning, onTimeout }: TimerHookOptions) => {
    const [state, dispatch] = useReducer(
        timerReducer,
        initial ?? createInitialTimerState()
    );

    const timeoutFiredRef = useRef(false);
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!isRunning) {
            timeoutFiredRef.current = false;
            return;
        }
        const id = window.setInterval(() => {
            dispatch({ type: 'TICK' });
        }, 1000);
        return () => window.clearInterval(id);
    }, [dispatch, isRunning]);

    useEffect(() => {
        if (!isRunning || timeoutFiredRef.current) return;
        if (state.light <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.DARK);
            return;
        }
        if (state.dark <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.LIGHT);
        }
    }, [isRunning, onTimeout, state.dark, state.light]);

    const times = useMemo(() => getTimerTimes(state), [state]);

    const switchPlayer = useCallback((player: Player) => {
        dispatch({ type: 'SWITCH', player });
    }, []);

    const setActivePlayer = useCallback((player: Player | null) => {
        dispatch({ type: 'SET_ACTIVE', player });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const restore = useCallback((timer: TimerState) => {
        dispatch({ type: 'RESTORE', state: timer });
    }, []);

    const getSnapshot = useCallback(() => stateRef.current, []);

    return {
        state,
        times,
        switchPlayer,
        setActivePlayer,
        reset,
        restore,
        getSnapshot
    };
};
