import { DIRECTIONS, GAME_SETTINGS, PLAYERS } from '../constants/index.ts';
import type { Board, CaptureMove, Move, Piece } from '../types/game.ts';
import { getPiece, isValidPosition } from './board.ts';

const isOpponent = (piece: Piece, other: Piece | null): boolean =>
    other !== null && piece.player !== other.player;

const getMoveDirections = (piece: Piece): number[] => {
    if (piece.isKing) {
        return [DIRECTIONS.UP, DIRECTIONS.DOWN];
    }
    return piece.player === PLAYERS.LIGHT ? [DIRECTIONS.UP] : [DIRECTIONS.DOWN];
};

export const getMovesForPiece = (board: Board, row: number, col: number): Move[] => {
    const piece = getPiece(board, row, col);
    if (!piece) return [];
    return piece.isKing
        ? getKingMoves(board, row, col, piece)
        : getNormalPieceMoves(board, row, col, piece);
};

const getNormalPieceMoves = (board: Board, row: number, col: number, piece: Piece): Move[] => {
    const moves: Move[] = [];
    const directionsY = getMoveDirections(piece);
    const directionsX = [-1, 1];

    for (const directionY of directionsY) {
        for (const directionX of directionsX) {
            const newRow = row + directionY;
            const newCol = col + directionX;

            if (isValidPosition(newRow, newCol)) {
                const targetPiece = getPiece(board, newRow, newCol);
                if (targetPiece === null) {
                    moves.push({ row: newRow, col: newCol, type: 'move' });
                }
            }
        }
    }

    const captureDirections = [
        { rowOffset: -1, colOffset: -1 },
        { rowOffset: -1, colOffset: 1 },
        { rowOffset: 1, colOffset: -1 },
        { rowOffset: 1, colOffset: 1 }
    ];

    for (const direction of captureDirections) {
        const jumpRow = row + direction.rowOffset * GAME_SETTINGS.JUMP_DISTANCE;
        const jumpCol = col + direction.colOffset * GAME_SETTINGS.JUMP_DISTANCE;
        const middleRow = row + direction.rowOffset;
        const middleCol = col + direction.colOffset;

        if (!isValidPosition(jumpRow, jumpCol)) continue;

        const middlePiece = getPiece(board, middleRow, middleCol);
        const targetPiece = getPiece(board, jumpRow, jumpCol);

        if (targetPiece === null && isOpponent(piece, middlePiece)) {
            const capture: CaptureMove = {
                row: jumpRow,
                col: jumpCol,
                type: 'capture',
                capturedRow: middleRow,
                capturedCol: middleCol
            };
            moves.push(capture);
        }
    }

    return moves;
};

const getKingMoves = (board: Board, row: number, col: number, piece: Piece): Move[] => {
    const moves: Move[] = [];
    const directions = [
        { rowOffset: -1, colOffset: -1 },
        { rowOffset: -1, colOffset: 1 },
        { rowOffset: 1, colOffset: -1 },
        { rowOffset: 1, colOffset: 1 }
    ];

    for (const direction of directions) {
        let currentRow = row + direction.rowOffset;
        let currentCol = col + direction.colOffset;
        let foundEnemy: { row: number; col: number } | null = null;

        while (isValidPosition(currentRow, currentCol)) {
            const targetPiece = getPiece(board, currentRow, currentCol);

            if (foundEnemy === null) {
                if (targetPiece === null) {
                    moves.push({ row: currentRow, col: currentCol, type: 'move' });
                } else if (isOpponent(piece, targetPiece)) {
                    foundEnemy = { row: currentRow, col: currentCol };
                } else {
                    break;
                }
            } else {
                if (targetPiece === null) {
                    const capture: CaptureMove = {
                        row: currentRow,
                        col: currentCol,
                        type: 'capture',
                        capturedRow: foundEnemy.row,
                        capturedCol: foundEnemy.col
                    };
                    moves.push(capture);
                } else {
                    break;
                }
            }

            currentRow += direction.rowOffset;
            currentCol += direction.colOffset;
        }
    }

    return moves;
};
