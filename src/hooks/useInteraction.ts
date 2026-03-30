import { useCallback, useState } from 'react';
import type { CheckersModel } from '../models/CheckersModel.ts';
import type { GameSnapshot } from './useGame.ts';
import type { Move, Position } from '../types/types.ts';

export type InteractionOptions = {
    modelRef: { current: CheckersModel };
    snapshot: GameSnapshot;
    persist: () => void;
    syncFromModel: () => void;
    clearHighlights: () => void;
    onNewMove?: () => void;
    animation: {
        isAnimatingRef: { current: boolean };
        animateMove: (from: Position, to: Position, onComplete: () => void) => boolean;
    };
};

export const useInteraction = ({
    modelRef,
    snapshot,
    persist,
    syncFromModel,
    clearHighlights,
    onNewMove,
    animation
}: InteractionOptions) => {
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);

    const clearSelection = useCallback(() => {
        setSelectedPiece(null);
        setValidMoves([]);
    }, []);

    const setSelection = useCallback((position: Position | null, moves: Move[]) => {
        setSelectedPiece(position);
        setValidMoves(moves);
    }, []);

    const handleCellClick = useCallback((row: number, col: number) => {
        const current = modelRef.current;
        if (animation.isAnimatingRef.current) return;
        if (snapshot.winner) return;

        const locked = current.multiJumpPiece;
        const isMoveTarget = validMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && selectedPiece) {
            const moveInfo = validMoves.find(move => move.row === row && move.col === col)!;
            const from = selectedPiece;

            const commitMove = () => {
                const turnEnded = current.movePiece(from.row, from.col, row, col, moveInfo);
                persist();
                syncFromModel();
                clearHighlights();
                onNewMove?.();

                if (turnEnded) {
                    clearSelection();
                    return;
                }

                setSelection({ row, col }, current.getValidMoves(row, col));
            };

            const animated = animation.animateMove(from, { row, col }, commitMove);
            if (!animated) {
                commitMove();
            }
            return;
        }

        const piece = current.board[row][col];
        if (piece && piece.player === current.currentTurn) {
            if (locked && (locked.row !== row || locked.col !== col)) {
                return;
            }

            const isSameSelection = selectedPiece?.row === row && selectedPiece?.col === col;
            if (isSameSelection && !locked) {
                clearSelection();
                return;
            }

            const moves = current.getValidMoves(row, col);
            if (moves.length === 0) {
                clearSelection();
                return;
            }

            setSelection({ row, col }, moves);
            return;
        }

        if (!locked) {
            clearSelection();
        }
    }, [animation, clearHighlights, clearSelection, modelRef, onNewMove, persist, selectedPiece, setSelection, snapshot.winner, syncFromModel, validMoves]);

    return {
        selectedPiece,
        validMoves,
        handleCellClick,
        clearSelection
    };
};
