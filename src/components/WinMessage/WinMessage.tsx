import { PLAYERS } from '../../constants/index.ts';
import type { Player } from '../../constants/index.ts';
import ActionButton from '../ActionButton/ActionButton.tsx';
import './WinMessage.css';

type WinMessageProps = {
    winner: Player | null;
    onRestart: () => void;
};

const getWinnerLabel = (winner: Player) => (winner === PLAYERS.LIGHT ? 'Light' : 'Dark');

function WinMessage({ winner, onRestart }: WinMessageProps) {
    if (!winner) {
        return null;
    }

    return (
        <div className="win-message" role="dialog" aria-live="polite">
            <h2 className="win-title">Winner: {getWinnerLabel(winner)}</h2>
            <ActionButton text="New game" onClick={onRestart} className="btn-restart" />
        </div>
    );
}

export default WinMessage;
