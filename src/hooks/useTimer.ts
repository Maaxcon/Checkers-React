import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';
import type { Player } from '../constants/index.ts';
import type { TimerState } from '../types/game.ts';
import { createInitialTimerState, getTimerTimes, timerReducer } from '../logic/timer.ts';

export type TimerHookOptions = {
    initial?: TimerState | null;
    isRunning: boolean;
};

export const useTimer = ({ initial, isRunning }: TimerHookOptions) => {
    const [state, dispatch] = useReducer(
        timerReducer,
        initial ?? createInitialTimerState()
    );
    const stateRef = useRef(state);

    useLayoutEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!isRunning) return;
        const id = window.setInterval(() => {
            dispatch({ type: 'TICK' });
        }, 1000);
        return () => window.clearInterval(id);
    }, [dispatch, isRunning]);

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
        stateRef.current = timer;
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
