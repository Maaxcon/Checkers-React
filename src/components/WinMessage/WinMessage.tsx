import React from 'react';
import type { Player } from '../../constants/index.ts';
import { getPlayerLabel } from '../../logic/labels.ts';
import ActionButton from '../ActionButton/ActionButton.tsx';
import './WinMessage.css';

type WinMessageProps = {
    winner: Player | null;
    onRestart: () => void;
};

function WinMessage({ winner, onRestart }: WinMessageProps) {
    if (!winner) {
        return null;
    }

    return (
        <div className="win-message" role="dialog" aria-live="polite">
            <h2 className="win-title">Winner: {getPlayerLabel(winner)}</h2>
            <ActionButton text="Restart game" onClick={onRestart} className="btn-restart" />
        </div>
    );
}

export default React.memo(WinMessage);
