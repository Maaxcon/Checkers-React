import { GAME_SETTINGS } from '../constants/constants.ts';
import type { Board } from './Board.ts';
import type { Piece } from './Piece.ts';
import type { Move, CaptureMove, MoveAction } from '../types/types.ts';

export class MoveEngine {
    
    static getMovesForPiece(board: Board, row: number, col: number): Move[] {
        const piece = board.getPiece(row, col);
        
        if (piece === null) return [];
        
        if (piece.isKing) {
            return this.getKingMoves(board, row, col, piece);
        } else {
            return this.getNormalPieceMoves(board, row, col, piece);
        }
    }

    static getNormalPieceMoves(board: Board, row: number, col: number, piece: Piece): Move[] {
        const moves: Move[] = [];
        const directionsY = piece.moveDirections;
        const directionsX = [-1, 1];

        for (let dirIndex = 0; dirIndex < directionsY.length; dirIndex++) {
            const directionY = directionsY[dirIndex];
            
            for (let offsetIndex = 0; offsetIndex < directionsX.length; offsetIndex++) {
                const directionX = directionsX[offsetIndex];
                const newRow = row + directionY;
                const newCol = col + directionX;
                
                if (board.isValidPosition(newRow, newCol)) {
                    const targetPiece = board.getPiece(newRow, newCol);
                    if (targetPiece === null) {
                        const move: MoveAction = { row: newRow, col: newCol, type: 'move' };
                        moves.push(move);
                    }
                }
            }
        }

        const captureDirections = [
            {rowOffset: -1, colOffset: -1}, 
            {rowOffset: -1, colOffset: 1}, 
            {rowOffset: 1, colOffset: -1}, 
            {rowOffset: 1, colOffset: 1}
        ];
        
        for (let dirIndex = 0; dirIndex < captureDirections.length; dirIndex++) {
            const direction = captureDirections[dirIndex];
            
            const jumpRow = row + (direction.rowOffset * GAME_SETTINGS.JUMP_DISTANCE);
            const jumpCol = col + (direction.colOffset * GAME_SETTINGS.JUMP_DISTANCE);
            const middleRow = row + direction.rowOffset;
            const middleCol = col + direction.colOffset;

            if (board.isValidPosition(jumpRow, jumpCol)) {
                const middlePiece = board.getPiece(middleRow, middleCol);
                const targetPiece = board.getPiece(jumpRow, jumpCol);
                
                if (targetPiece === null) {
                    if (piece.isOpponent(middlePiece)) {
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
            }
        }

        return moves;
    }

    static getKingMoves(board: Board, row: number, col: number, piece: Piece): Move[] {
        const moves: Move[] = [];
        const directions = [
            {rowOffset: -1, colOffset: -1}, 
            {rowOffset: -1, colOffset: 1}, 
            {rowOffset: 1, colOffset: -1}, 
            {rowOffset: 1, colOffset: 1}
        ]; 

        for (let dirIndex = 0; dirIndex < directions.length; dirIndex++) {
            const direction = directions[dirIndex];
            let currentRow = row + direction.rowOffset;
            let currentCol = col + direction.colOffset;
            let foundEnemy: { row: number; col: number } | null = null;

            while (board.isValidPosition(currentRow, currentCol)) {
                const targetPiece = board.getPiece(currentRow, currentCol);

                if (foundEnemy === null) {
                    if (targetPiece === null) {
                        const move: MoveAction = { row: currentRow, col: currentCol, type: 'move' };
                        moves.push(move);
                    } else if (piece.isOpponent(targetPiece)) {
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
                
                currentRow = currentRow + direction.rowOffset;
                currentCol = currentCol + direction.colOffset;
            }
        }

        return moves;
    }
}
