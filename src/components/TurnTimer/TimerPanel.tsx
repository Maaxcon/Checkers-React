import { forwardRef, useEffect, useImperativeHandle } from 'react';
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
    onTimeout,
}, ref) => {
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
        isRunning: winner === null,
        onTimeout
    });

    useEffect(() => {
        switchPlayer(turn);
    }, [switchPlayer, turn]);

    useEffect(() => {
        if (winner && timerState.activePlayer !== null) {
            setActivePlayer(null);
        }
    }, [setActivePlayer, timerState.activePlayer, winner]);

    useImperativeHandle(ref, () => ({
        getSnapshot,
        restore,
        reset
    }), [getSnapshot, restore, reset]);

    return (
        <TurnTimer
            times={times}
            activePlayer={winner ? null : timerState.activePlayer}
            winner={winner}
        />
    );
});

TimerPanel.displayName = 'TimerPanel';

export default TimerPanel;
