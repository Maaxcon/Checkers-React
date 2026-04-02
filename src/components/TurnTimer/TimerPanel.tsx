import React from 'react';
import type { Player } from '../../constants/index.ts';
import type { TimerTimes } from '../../types/game.ts';
import TurnTimer from './TurnTimer.tsx';

type TimerPanelProps = {
    times: TimerTimes;
    activePlayer: Player | null;
    winner: Player | null;
};

function TimerPanel({
    times,
    activePlayer,
    winner
}: TimerPanelProps) {
    return (
        <TurnTimer
            times={times}
            activePlayer={activePlayer}
            winner={winner}
        />
    );
}

export default React.memo(TimerPanel);
