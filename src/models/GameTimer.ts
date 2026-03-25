import { PLAYERS, GAME_SETTINGS } from '../constants/constants.ts';
import type { Player } from '../constants/constants.ts';
import type { TimerState, TimerTimes } from '../types/types.ts';

export class GameTimer {
    #timeLight: number;
    #timeDark: number;
    #intervalId: number | null = null;
    #activePlayer: Player | null = null;
    
    #onTick: (times: TimerTimes) => void = () => {};
    #onTimeOut: (winner: Player) => void = () => {};

    constructor() {
        this.#timeLight = GAME_SETTINGS.INITIAL_TIME_SECONDS;
        this.#timeDark = GAME_SETTINGS.INITIAL_TIME_SECONDS;
    }

    bindTick(callback: (times: TimerTimes) => void): void {
        this.#onTick = callback;
    }

    bindTimeOut(callback: (winner: Player) => void): void {
        this.#onTimeOut = callback;
    }

    get currentTimes(): TimerTimes {
        return {
            [PLAYERS.LIGHT]: this.#formatTime(this.#timeLight),
            [PLAYERS.DARK]: this.#formatTime(this.#timeDark)
        };
    }

    loadState(timerData?: TimerState | null): void {
        if (timerData && typeof timerData.light === 'number') {
            this.#timeLight = timerData.light;
            this.#timeDark = timerData.dark;
        }
        if (timerData && typeof timerData.activePlayer === 'number') {
            this.#activePlayer = timerData.activePlayer;
        }
    }

    exportState(): TimerState {
        return {
            light: this.#timeLight,
            dark: this.#timeDark,
            activePlayer: this.#activePlayer
        };
    }

    reset(): void {
        this.stop();
        this.#timeLight = GAME_SETTINGS.INITIAL_TIME_SECONDS;
        this.#timeDark = GAME_SETTINGS.INITIAL_TIME_SECONDS;
        this.#activePlayer = PLAYERS.LIGHT;
        this.#update();
    }

    start(player: Player): void {
        this.#activePlayer = player;
        if (this.#intervalId) return;
        this.#intervalId = setInterval(() => this.#tick(), 1000);
    }

    stop(): void {
        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }
    }

    switchTurn(newPlayer: Player): void {
        this.#activePlayer = newPlayer;
    }

    #tick(): void {
        if (this.#activePlayer === null) return;
        if (this.#activePlayer === PLAYERS.LIGHT) {
            this.#timeLight--;
            if (this.#timeLight <= 0) this.#triggerTimeOut(PLAYERS.DARK); 
        } else {
            this.#timeDark--;
            if (this.#timeDark <= 0) this.#triggerTimeOut(PLAYERS.LIGHT);
        }
        
        this.#update();
    }

    #triggerTimeOut(winner: Player): void {
        this.stop();
        this.#onTimeOut(winner);
    }

    #update(): void {
        this.#onTick(this.currentTimes);
    }

    #formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    }
}
