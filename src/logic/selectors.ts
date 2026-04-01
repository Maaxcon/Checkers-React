import { BOARD, PLAYERS } from '../constants/index.ts';
import type { Board, CapturedCounts } from '../types/game.ts';

const INITIAL_PIECES_PER_SIDE = BOARD.PIECE_ROWS * (BOARD.COLS / 2);

export const getCapturedCounts = (board: Board): CapturedCounts => {
    let lightCount = 0;
    let darkCount = 0;

    for (const row of board) {
        for (const piece of row) {
            if (!piece) continue;
            if (piece.player === PLAYERS.LIGHT) {
                lightCount++;
            } else {
                darkCount++;
            }
        }
    }

    return {
        byLight: INITIAL_PIECES_PER_SIDE - darkCount,
        byDark: INITIAL_PIECES_PER_SIDE - lightCount
    };
};
