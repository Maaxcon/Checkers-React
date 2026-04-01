import { BOARD, PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type {
    CaptureMove,
    GameCoreState,
    Move,
    PlayerMoveStatus,
    Position
} from '../types/game.ts';
import { getMovesForPiece } from './moves.ts';

export const isCurrentPlayerPiece = (state: GameCoreState, piece: { player: Player } | null): boolean =>
    piece !== null && piece.player === state.turn;

const isCaptureMove = (move: Move): move is CaptureMove => move.type === 'capture';

export const getCapturesForPiece = (state: GameCoreState, row: number, col: number): CaptureMove[] =>
    getMovesForPiece(state.board, row, col).filter(isCaptureMove);

export const getPlayerMoveStatus = (state: GameCoreState): PlayerMoveStatus => {
    let hasRegularMoves = false;

    for (let row = 0; row < BOARD.ROWS; row++) {
        for (let col = 0; col < BOARD.COLS; col++) {
            const piece = state.board[row][col];
            if (!isCurrentPlayerPiece(state, piece)) continue;

            const moves = getMovesForPiece(state.board, row, col);

            if (moves.some(isCaptureMove)) {
                return { hasCaptures: true, hasMoves: true };
            }

            if (moves.length > 0) {
                hasRegularMoves = true;
            }
        }
    }

    return { hasCaptures: false, hasMoves: hasRegularMoves };
};

export const getValidMoves = (
    state: GameCoreState,
    row: number,
    col: number,
    hasGlobalCaptures: boolean | null = null
): Move[] => {
    if (state.winner) return [];
    const piece = state.board[row]?.[col] ?? null;
    if (!isCurrentPlayerPiece(state, piece)) return [];

    const lockedPiece = state.multiJump;
    if (lockedPiece && (lockedPiece.row !== row || lockedPiece.col !== col)) {
        return [];
    }

    const allMoves = getMovesForPiece(state.board, row, col);
    const mustCapture = hasGlobalCaptures !== null
        ? hasGlobalCaptures
        : getPlayerMoveStatus(state).hasCaptures;

    if (mustCapture) {
        return allMoves.filter(isCaptureMove);
    }

    return allMoves;
};

export const calculateWinner = (state: GameCoreState): Player | null => {
    const status = getPlayerMoveStatus(state);
    if (!status.hasMoves) {
        return state.turn === PLAYERS.LIGHT ? PLAYERS.DARK : PLAYERS.LIGHT;
    }
    return null;
};

export const getMandatoryPieces = (state: GameCoreState): Position[] => {
    if (state.winner) return [];
    const { hasCaptures } = getPlayerMoveStatus(state);
    if (!hasCaptures) return [];

    const pieces: Position[] = [];
    for (let row = 0; row < BOARD.ROWS; row++) {
        for (let col = 0; col < BOARD.COLS; col++) {
            const moves = getValidMoves(state, row, col, hasCaptures);
            if (moves.some(isCaptureMove)) {
                pieces.push({ row, col });
            }
        }
    }
    return pieces;
};
