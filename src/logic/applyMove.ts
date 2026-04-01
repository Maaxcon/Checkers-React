import { BOARD, PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { GameCoreState, Move, MoveLogEntry, Position } from '../types/game.ts';
import { appendCaptureNotation, formatMove } from './notation.ts';
import { calculateWinner, getCapturesForPiece } from './rules.ts';

export type ApplyMoveResult = {
    state: GameCoreState;
    moveLog: MoveLogEntry[];
    turnEnded: boolean;
};

const nextTurn = (turn: Player): Player =>
    turn === PLAYERS.LIGHT ? PLAYERS.DARK : PLAYERS.LIGHT;

export const applyMove = (
    state: GameCoreState,
    moveLog: MoveLogEntry[],
    from: Position,
    move: Move
): ApplyMoveResult => {
    if (state.winner) {
        return { state, moveLog, turnEnded: true };
    }

    const board = [...state.board];
    const ensureRow = (rowIndex: number) => {
        const existing = board[rowIndex];
        const copied = existing === state.board[rowIndex] ? [...existing] : existing;
        board[rowIndex] = copied;
        return copied;
    };

    const fromRow = ensureRow(from.row);
    const toRow = ensureRow(move.row);
    const piece = fromRow[from.col] ?? null;

    if (!piece) {
        return { state, moveLog, turnEnded: true };
    }

    const isCapture = move.type === 'capture';

    const shouldPromote = !piece.isKing && (
        (piece.player === PLAYERS.LIGHT && move.row === BOARD.TOP_ROW) ||
        (piece.player === PLAYERS.DARK && move.row === BOARD.BOTTOM_ROW)
    );

    const movedPiece = shouldPromote ? { ...piece, isKing: true } : piece;

    toRow[move.col] = movedPiece;
    fromRow[from.col] = null;

    if (isCapture) {
        const capturedRow = ensureRow(move.capturedRow);
        capturedRow[move.capturedCol] = null;
    }

    const toPosition: Position = { row: move.row, col: move.col };

    let updatedMoveLog = moveLog;
    if (!state.multiJump) {
        updatedMoveLog = [
            ...moveLog,
            {
                notation: formatMove(from.row, from.col, move.row, move.col, isCapture),
                from: { row: from.row, col: from.col },
                to: toPosition
            }
        ];
    } else {
        const lastEntry = moveLog[moveLog.length - 1];
        if (lastEntry) {
            const updatedEntry: MoveLogEntry = {
                ...lastEntry,
                notation: appendCaptureNotation(lastEntry.notation, toPosition),
                to: toPosition
            };
            updatedMoveLog = [...moveLog.slice(0, -1), updatedEntry];
        } else {
            updatedMoveLog = [
                ...moveLog,
                {
                    notation: formatMove(from.row, from.col, move.row, move.col, isCapture),
                    from: { row: from.row, col: from.col },
                    to: toPosition
                }
            ];
        }
    }

    let multiJump: Position | null = null;
    let turnEnded = true;

    if (isCapture && !shouldPromote) {
        const captures = getCapturesForPiece(
            { ...state, board },
            move.row,
            move.col
        );
        if (captures.length > 0) {
            multiJump = { row: move.row, col: move.col };
            turnEnded = false;
        }
    }

    if (!turnEnded) {
        return {
            state: {
                ...state,
                board,
                multiJump,
                winner: state.winner
            },
            moveLog: updatedMoveLog,
            turnEnded
        };
    }

    const newTurn = nextTurn(state.turn);
    const nextState: GameCoreState = {
        ...state,
        board,
        turn: newTurn,
        multiJump: null,
        winner: null
    };
    const winner = calculateWinner(nextState);

    return {
        state: {
            ...nextState,
            winner
        },
        moveLog: updatedMoveLog,
        turnEnded
    };
};
