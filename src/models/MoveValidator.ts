import { PLAYERS, BOARD } from '../constants/constants.ts';
import type { Player } from '../constants/constants.ts';
import { MoveEngine } from './MoveEngine.ts';
import type { GameState } from './GameState.ts';
import type { Piece } from './Piece.ts';
import type { CaptureMove, Move, PlayerMoveStatus } from '../types/types.ts';

export class MoveValidator {
    
    static isCurrentPlayerPiece(gameState: GameState, piece: Piece | null): boolean {
        if (piece === null) return false;
        return piece.player === gameState.currentTurn;
    }

    static getCapturesForPiece(gameState: GameState, row: number, col: number): CaptureMove[] {
        const allMoves = MoveEngine.getMovesForPiece(gameState.board, row, col);
        return allMoves.filter(MoveValidator.#isCaptureMove);
    }

    static getPlayerMoveStatus(gameState: GameState): PlayerMoveStatus {
        let hasRegularMoves = false;

        for (let row = 0; row < BOARD.ROWS; row++) {
            for (let col = 0; col < BOARD.COLS; col++) {
                const piece = gameState.board.getPiece(row, col);
                
                if (this.isCurrentPlayerPiece(gameState, piece)) {
                    const moves = MoveEngine.getMovesForPiece(gameState.board, row, col);
                    
                    if (moves.some(move => move.type === 'capture')) {
                        return { hasCaptures: true, hasMoves: true };
                    }

                    if (moves.length > 0) {
                        hasRegularMoves = true;
                    }
                }
            }
        }

        return { hasCaptures: false, hasMoves: hasRegularMoves };
    }

    static playerHasAnyCaptures(gameState: GameState): boolean {
        return this.getPlayerMoveStatus(gameState).hasCaptures;
    }

    static getValidMoves(gameState: GameState, row: number, col: number, hasGlobalCaptures: boolean | null = null): Move[] {
        if (gameState.winner) return []; 
        const piece = gameState.board.getPiece(row, col);
        if (!this.isCurrentPlayerPiece(gameState, piece)) return []; 

        const lockedPiece = gameState.multiJumpPiece;
        if (lockedPiece) {
            const isClickingAnotherPiece = (lockedPiece.row !== row || lockedPiece.col !== col);
            if (isClickingAnotherPiece) {
                return []; 
            }
        }
      
        const allMoves = MoveEngine.getMovesForPiece(gameState.board, row, col);
        const mustCapture = hasGlobalCaptures !== null
            ? hasGlobalCaptures 
            : this.playerHasAnyCaptures(gameState);

        if (mustCapture) {
            return allMoves.filter(MoveValidator.#isCaptureMove);
        }

        return allMoves;
    }

    static calculateWinner(gameState: GameState): Player | null {
        const status = this.getPlayerMoveStatus(gameState);

        if (!status.hasMoves) {
            return gameState.currentTurn === PLAYERS.LIGHT ? PLAYERS.DARK : PLAYERS.LIGHT;
        }

        return null; 
    }

    static #isCaptureMove(move: Move): move is CaptureMove {
        return move.type === 'capture';
    }
}
