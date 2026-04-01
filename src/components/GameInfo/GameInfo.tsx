import React from 'react';
import { PLAYERS } from '../../constants/index.ts';
import type { Player } from '../../constants/index.ts';
import type { CapturedCounts } from '../../types/game.ts';
import './GameInfo.css';

type GameInfoProps = {
    currentTurn: Player;
    winner: Player | null;
    captured: CapturedCounts;
};

const getPlayerLabel = (player: Player) => (player === PLAYERS.LIGHT ? 'Light' : 'Dark');

function GameInfo({ currentTurn, winner, captured }: GameInfoProps) {
    return (
        <section className="game-info" aria-live="polite">
            <h2 className="game-info__title">Game Info</h2>
            <div className="game-info__row">
                <span className="game-info__label">Turn</span>
                <span className="game-info__value">
                    {winner ? 'Game over' : getPlayerLabel(currentTurn)}
                </span>
            </div>
            {winner ? (
                <div className="game-info__row">
                    <span className="game-info__label">Winner</span>
                    <span className="game-info__value">{getPlayerLabel(winner)}</span>
                </div>
            ) : null}
            <div className="game-info__row">
                <span className="game-info__label">Captured by Light</span>
                <span className="game-info__value">{captured.byLight}</span>
            </div>
            <div className="game-info__row">
                <span className="game-info__label">Captured by Dark</span>
                <span className="game-info__value">{captured.byDark}</span>
            </div>
        </section>
    );
}

export default React.memo(GameInfo);
