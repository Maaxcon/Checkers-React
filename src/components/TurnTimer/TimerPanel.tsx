import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { PLAYERS } from '../../constants/index.ts';
import type { Player } from '../../constants/index.ts';
import type { TimerState } from '../../types/game.ts';
import { useTimer } from '../../hooks/useTimer.ts';
import TurnTimer from './TurnTimer.tsx';

export type TimerPanelHandle = {
    getSnapshot: () => TimerState;
    restore: (timer: TimerState) => void;
    reset: () => void;
};

type TimerPanelProps = {
    initialTimer?: TimerState | null;
    turn: Player;
    winner: Player | null;
    onTimeout: (winner: Player) => void;
};

const TimerPanel = forwardRef<TimerPanelHandle, TimerPanelProps>(({
    initialTimer,
    turn,
    winner,
    onTimeout
}, ref) => {
    const timeoutFiredRef = useRef(false);
    const {
        state: timerState,
        times,
        switchPlayer,
        setActivePlayer,
        reset,
        restore,
        getSnapshot
    } = useTimer({
        initial: initialTimer,
        isRunning: winner === null
    });

    useEffect(() => {
        switchPlayer(turn);
    }, [switchPlayer, turn]);

    useEffect(() => {
        if (winner && timerState.activePlayer !== null) {
            setActivePlayer(null);
        }
    }, [setActivePlayer, timerState.activePlayer, winner]);

    useEffect(() => {
        if (winner === null) {
            timeoutFiredRef.current = false;
        }
    }, [winner]);

    useEffect(() => {
        if (winner || timeoutFiredRef.current) return;
        if (timerState.light <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.DARK);
            return;
        }
        if (timerState.dark <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.LIGHT);
        }
    }, [onTimeout, timerState.dark, timerState.light, winner]);

    useImperativeHandle(ref, () => ({
        getSnapshot,
        restore,
        reset
    }), [getSnapshot, reset, restore]);

    return (
        <TurnTimer
            times={times}
            activePlayer={winner ? null : timerState.activePlayer}
            winner={winner}
        />
    );
});

TimerPanel.displayName = 'TimerPanel';

export default React.memo(TimerPanel);
