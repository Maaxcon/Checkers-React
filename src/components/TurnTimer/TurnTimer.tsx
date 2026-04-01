import { PLAYERS } from '../../constants/index.ts';
import type { Player } from '../../constants/index.ts';
import type { TimerTimes } from '../../types/game.ts';
import './TurnTimer.css';

type TurnTimerProps = {
    times: TimerTimes;
    activePlayer: Player | null;
    winner: Player | null;
};

const isActive = (winner: Player | null, activePlayer: Player | null, player: Player) =>
    !winner && activePlayer === player;

function TurnTimer({ times, activePlayer, winner }: TurnTimerProps) {
    return (
        <section className="timer-container" aria-live="polite">
            <div
                className={[
                    'timer-box',
                    'timer-box--light',
                    isActive(winner, activePlayer, PLAYERS.LIGHT) ? 'is-active' : ''
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <span className="timer-label">Light</span>
                <span className="timer-time">{times[PLAYERS.LIGHT]}</span>
            </div>
            <div
                className={[
                    'timer-box',
                    'timer-box--dark',
                    isActive(winner, activePlayer, PLAYERS.DARK) ? 'is-active' : ''
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <span className="timer-label">Dark</span>
                <span className="timer-time">{times[PLAYERS.DARK]}</span>
            </div>
        </section>
    );
}

export default TurnTimer;
