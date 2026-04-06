import React, { useEffect, useRef } from 'react';
import { PLAYERS } from '../../constants/index.ts';
import type { Player } from '../../constants/index.ts';
import type { TimerState } from '../../types/game.ts';
import { useTimer } from '../../hooks/useTimer.ts';
import TurnTimer from './TurnTimer.tsx';

export type TimerPanelApi = {
    getSnapshot: () => TimerState;
    reset: () => void;
    restore: (timer: TimerState) => void;
};

type TimerPanelProps = {
    initialTimer: TimerState;
    currentPlayer: Player;
    winner: Player | null;
    onTimeout: (winner: Player) => void;
    onReady?: (api: TimerPanelApi) => void;
};

function TimerPanel({
    initialTimer,
    currentPlayer,
    winner,
    onTimeout,
    onReady
}: TimerPanelProps) {
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

    const timeoutFiredRef = useRef(false);

    useEffect(() => {
        onReady?.({ getSnapshot, reset, restore });
    }, [getSnapshot, onReady, reset, restore]);

    useEffect(() => {
        switchPlayer(currentPlayer);
    }, [currentPlayer, switchPlayer]);

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

    const activePlayer = winner ? null : timerState.activePlayer;

    return (
        <TurnTimer
            times={times}
            activePlayer={activePlayer}
            winner={winner}
        />
    );
}

export default React.memo(TimerPanel);
