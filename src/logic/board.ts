    import { BOARD, PLAYERS } from '../constants/index.ts';
    import type { Player } from '../constants/index.ts';
    import type { Board, Piece } from '../types/game.ts';

    const createPiece = (player: Player, isKing = false): Piece => ({
        player,
        isKing
    });

    export const createInitialBoard = (): Board => {
        const grid: Board = [];
        for (let row = 0; row < BOARD.ROWS; row++) {
            const gridRow: (Piece | null)[] = [];
            for (let col = 0; col < BOARD.COLS; col++) {
                gridRow.push(null);
            }
            grid.push(gridRow);
        }

        for (let row = 0; row < BOARD.ROWS; row++) {
            for (let col = 0; col < BOARD.COLS; col++) {
                if ((row + col) % 2 !== 0) {
                    if (row < BOARD.PIECE_ROWS) {
                        grid[row][col] = createPiece(PLAYERS.DARK);
                    } else if (row >= BOARD.ROWS - BOARD.PIECE_ROWS) {
                        grid[row][col] = createPiece(PLAYERS.LIGHT);
                    }
                }
            }
        }

        return grid;
    };

    export const cloneBoard = (board: Board): Board =>
        board.map(row => row.map(piece => (piece ? { ...piece } : null)));

    export const isValidPosition = (row: number, col: number): boolean =>
        row >= 0 && row < BOARD.ROWS && col >= 0 && col < BOARD.COLS;

    export const getPiece = (board: Board, row: number, col: number): Piece | null =>
        board[row]?.[col] ?? null;
