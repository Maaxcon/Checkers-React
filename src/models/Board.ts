import { BOARD, PLAYERS } from '../constants/constants.ts';
import { Piece } from './Piece.ts';
import type { BoardGrid, SavedGrid, SerializedPiece } from '../types/types.ts';

export class Board {
    #grid: BoardGrid;
    constructor() {
        this.#grid = [];
        this.reset();
    }

    get grid(): BoardGrid { return this.#grid; }

    reset(): void {
        this.#grid = [];
        for (let row = 0; row < BOARD.ROWS; row++) {
            const gridRow: (Piece | null)[] = [];
            for (let col = 0; col < BOARD.COLS; col++) {
                gridRow.push(null);
            }
            this.#grid.push(gridRow);
        }
        
        for (let row = 0; row < BOARD.ROWS; row++) {
            for (let col = 0; col < BOARD.COLS; col++) {
                if ((row + col) % 2 !== 0) {
                    if (row < BOARD.PIECE_ROWS) {
                        this.#grid[row][col] = new Piece(PLAYERS.DARK);
                    } 
                    else if (row >= BOARD.ROWS - BOARD.PIECE_ROWS) {
                        this.#grid[row][col] = new Piece(PLAYERS.LIGHT);
                    }
                }
            }
        }
    }

    setGrid(newGrid: BoardGrid): void {
        this.#grid = newGrid;
    }


    clone(): Board {
        const newBoard = new Board();
        const clonedGrid = this.#grid.map(row =>
            row.map(piece => piece ? piece.clone() : null)
        );
        newBoard.setGrid(clonedGrid);
        return newBoard;
    }

    getPiece(row: number, col: number): Piece | null { return this.#grid[row][col]; }
    remove(row: number, col: number): void { this.#grid[row][col] = null; }

    move(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
        const piece = this.#grid[fromRow][fromCol];
        this.#grid[toRow][toCol] = piece;
        this.#grid[fromRow][fromCol] = null;
    }

    isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < BOARD.ROWS && col >= 0 && col < BOARD.COLS;
    }

    restoreFrom(savedGrid: SavedGrid): void {
        const newGrid: BoardGrid = [];
        for (let row = 0; row < BOARD.ROWS; row++) {
            const gridRow: (Piece | null)[] = [];
            for (let col = 0; col < BOARD.COLS; col++) {
                const savedPiece = savedGrid[row][col];
                
                if (savedPiece !== null) {
                    const alivePiece = this.#restorePiece(savedPiece);
                    gridRow.push(alivePiece);
                } else {
                    gridRow.push(null);
                }
            }
            newGrid.push(gridRow);
        }
        this.#grid = newGrid;
    }

    #restorePiece(savedPiece: SerializedPiece): Piece {
        const alivePiece = new Piece(savedPiece.player);
        if (savedPiece.isKing) alivePiece.makeKing();
        return alivePiece;
    }
}
