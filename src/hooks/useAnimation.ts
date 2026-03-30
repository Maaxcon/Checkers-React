import { useCallback, useRef } from 'react';
import { GAME_SETTINGS } from '../constants/index.ts';
import { AnimationHelper } from '../utils/AnimationHelper.ts';
import type { Position } from '../types/types.ts';

export const useAnimation = () => {
    const cellRefs = useRef(new Map<string, HTMLDivElement>());
    const pieceRefs = useRef(new Map<string, HTMLDivElement>());
    const isAnimatingRef = useRef(false);

    const registerCellRef = useCallback((row: number, col: number, el: HTMLDivElement | null) => {
        const key = `${row}-${col}`;
        if (el) {
            cellRefs.current.set(key, el);
        } else {
            cellRefs.current.delete(key);
        }
    }, []);

    const registerPieceRef = useCallback((row: number, col: number, el: HTMLDivElement | null) => {
        const key = `${row}-${col}`;
        if (el) {
            pieceRefs.current.set(key, el);
        } else {
            pieceRefs.current.delete(key);
        }
    }, []);

    const getCell = useCallback((row: number, col: number) => {
        return cellRefs.current.get(`${row}-${col}`) ?? null;
    }, []);

    const getPiece = useCallback((row: number, col: number) => {
        return pieceRefs.current.get(`${row}-${col}`) ?? null;
    }, []);

    const animateMove = useCallback((from: Position, to: Position, onComplete: () => void) => {
        const toCell = getCell(to.row, to.col);
        const pieceEl = getPiece(from.row, from.col);

        if (!pieceEl || !toCell) {
            return false;
        }

        isAnimatingRef.current = true;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            isAnimatingRef.current = false;
            onComplete();
        };

        AnimationHelper.movePiece(pieceEl, toCell, finish);
        window.setTimeout(finish, GAME_SETTINGS.ANIMATION_DURATION_MS + 50);
        return true;
    }, [getCell, getPiece]);

    return {
        registerCellRef,
        registerPieceRef,
        getCell,
        getPiece,
        animateMove,
        isAnimatingRef
    };
};
