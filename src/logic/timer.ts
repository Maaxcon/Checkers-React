import { GAME_SETTINGS, PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { TimerState, TimerTimes } from '../types/game.ts';

export type TimerAction =
    | { type: 'TICK' }
    | { type: 'SWITCH'; player: Player }
    | { type: 'SET_ACTIVE'; player: Player | null }
    | { type: 'RESET' }
    | { type: 'RESTORE'; state: TimerState };

export const createInitialTimerState = (): TimerState => ({
    light: GAME_SETTINGS.INITIAL_TIME_SECONDS,
    dark: GAME_SETTINGS.INITIAL_TIME_SECONDS,
    activePlayer: PLAYERS.LIGHT
});

export const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
    switch (action.type) {
        case 'TICK': {
            if (state.activePlayer === null) return state;
            if (state.activePlayer === PLAYERS.LIGHT) {
                return { ...state, light: Math.max(0, state.light - 1) };
            }
            return { ...state, dark: Math.max(0, state.dark - 1) };
        }
        case 'SWITCH':
            return { ...state, activePlayer: action.player };
        case 'SET_ACTIVE':
            return { ...state, activePlayer: action.player };
        case 'RESET':
            return createInitialTimerState();
        case 'RESTORE':
            return { ...action.state };
        default:
            return state;
    }
};

export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
};

export const getTimerTimes = (state: TimerState): TimerTimes => ({
    [PLAYERS.LIGHT]: formatTime(state.light),
    [PLAYERS.DARK]: formatTime(state.dark)
});
