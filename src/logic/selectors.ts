import { BOARD, PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { Board, CapturedCounts, GameCoreState, Move, Position } from '../types/game.ts';
import { getMandatoryPieces, getValidMoves } from './rules.ts';

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

export const selectValidMoves = (
    state: GameCoreState,
    selected: Position | null,
    winner: Player | null
): Move[] => {
    if (!selected || winner) return [];
    return getValidMoves(state, selected.row, selected.col);
};

export const selectMandatoryPieces = (
    state: GameCoreState,
    winner: Player | null
): Position[] => {
    if (winner) return [];
    return getMandatoryPieces(state);
};
