import { PLAYERS, BOARD } from '../constants/constants.ts';
import { Board } from './Board.ts';
import type { Player } from '../constants/constants.ts';
import type { BoardGrid, SavedGameState, SavedGrid, Position, Move, MoveResult } from '../types/types.ts';

export class GameState {
    #board: Board;
    #currentTurn: Player = PLAYERS.LIGHT;
    #multiJumpPiece: Position | null = null;
    #winner: Player | null = null;

    constructor() {
        this.#board = new Board();
        this.reset();
    }

    clone(): GameState {
        const clonedState = new GameState();
        clonedState.#restoreFromClone(
            this.#board.clone(),
            this.#currentTurn,
            this.#multiJumpPiece,
            this.#winner
        );
        return clonedState;
    }

    #restoreFromClone(clonedBoard: Board, turn: Player, multiJumpPiece: Position | null, winner: Player | null): void {
        this.#board = clonedBoard;
        this.#currentTurn = turn;
        this.#multiJumpPiece = multiJumpPiece ? { ...multiJumpPiece } : null;
        this.#winner = winner;
    }

    toJSON(): SavedGameState {
        return {
            grid: this.#serializeGrid(),
            turn: this.#currentTurn,
            multiJumpPiece: this.#multiJumpPiece,
            winner: this.#winner
        };
    }

    restore(savedData: SavedGameState): void {
        this.#board.restoreFrom(savedData.grid);
        this.#currentTurn = savedData.turn; 
        this.#multiJumpPiece = savedData.multiJumpPiece || null;        
        this.#winner = savedData.winner || null;
    }

    reset(): void {
        this.#board.reset();
        this.#currentTurn = PLAYERS.LIGHT;
        this.#multiJumpPiece = null;
        this.#winner = null;
    }

    get board(): Board { return this.#board; }
    get boardMatrix(): BoardGrid { return this.#board.grid; }
    get currentTurn(): Player { return this.#currentTurn; }
    get multiJumpPiece(): Position | null { return this.#multiJumpPiece; }
    get winner(): Player | null { return this.#winner; }

    setWinner(player: Player | null): void { this.#winner = player; }
    setMultiJumpPiece(row: number, col: number): void { this.#multiJumpPiece = { row, col }; }
    clearMultiJumpPiece(): void { this.#multiJumpPiece = null; }
    
    switchTurn(): void {
        if (this.#currentTurn === PLAYERS.LIGHT) {
            this.#currentTurn = PLAYERS.DARK;
        } else {
            this.#currentTurn = PLAYERS.LIGHT;
        }
    }

    executeMove(fromRow: number, fromCol: number, toRow: number, toCol: number, moveInfo: Move): MoveResult {
        const piece = this.#board.getPiece(fromRow, fromCol);
        if (!piece) {
            return { becameKing: false };
        }

        this.#board.move(fromRow, fromCol, toRow, toCol);

        if (moveInfo.type === 'capture') {
            this.#board.remove(moveInfo.capturedRow, moveInfo.capturedCol);
        }

        let becameKing = false;
        
        if (!piece.isKing) {
            if (piece.isLight === true && toRow === BOARD.TOP_ROW) { 
                piece.makeKing(); 
                becameKing = true; 
            } else if (!piece.isLight && toRow === BOARD.BOTTOM_ROW) { 
                piece.makeKing(); 
                becameKing = true; 
            }
        }

        return { becameKing: becameKing };
    }

    #serializeGrid(): SavedGrid {
        return this.#board.grid.map(row =>
            row.map(piece => piece ? piece.toJSON() : null)
        );
    }
}
