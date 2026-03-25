import { PLAYERS, DIRECTIONS } from '../constants/constants.ts';
import type { Player, Direction } from '../constants/constants.ts';
import type { SerializedPiece } from '../types/types.ts';

export class Piece {
    #player: Player;
    #isKing: boolean;
    
    constructor(playerType: Player) {
        this.#player = playerType;
        this.#isKing = false;      
    }

    get player(): Player { return this.#player; }
    get isKing(): boolean { return this.#isKing; }

    get isLight(): boolean {
        return this.#player === PLAYERS.LIGHT;
    }

    get moveDirections(): Direction[] {
        if (this.#isKing) {
            return [DIRECTIONS.UP, DIRECTIONS.DOWN];
        } else {
            if (this.isLight) {
                return [DIRECTIONS.UP];
            } else {
                return [DIRECTIONS.DOWN];
            }
        }
    }

    isOpponent(otherPiece: Piece | null): boolean {
        if (otherPiece === null) return false;
        return this.#player !== otherPiece.player;
    }

    makeKing(): void {
        this.#isKing = true;
    }
    
    clone(): Piece {
        const newPiece = new Piece(this.#player);
        if (this.#isKing) newPiece.makeKing();
        return newPiece;
    }

    toJSON(): SerializedPiece {
        return {
            player: this.#player,
            isKing: this.#isKing
        };
    }
}
