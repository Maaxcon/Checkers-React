import { useCallback, useEffect, useMemo, useState } from 'react';
import { GAME_SETTINGS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { Position, SavedData, TimerState } from '../types/game.ts';
import { getCapturedCounts } from '../logic/selectors.ts';
import { calculateWinner, getMandatoryPieces, getValidMoves } from '../logic/rules.ts';
import { buildSavedData } from '../logic/storage.ts';
import { saveGame } from '../services/StorageService.ts';
import { useGameReducer } from './useGameReducer.ts';
import { useHighlights } from './useHighlights.ts';

type UseCheckersOptions = {
    saved: SavedData | null;
    getTimerSnapshot: () => TimerState;
};

export const useCheckers = ({ saved, getTimerSnapshot }: UseCheckersOptions) => {
    const {
        game,
        historyState,
        select,
        applyGameMove,
        undo,
        reset,
        setTimeoutWinner
    } = useGameReducer(saved);

    const {
        historyHighlight,
        historyIndex,
        selectHistory,
        clearHighlights
    } = useHighlights(historyState.moveLog);

    const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);

    const coreState = useMemo(
        () => ({
            board: game.board,
            turn: game.turn,
            multiJump: game.multiJump,
            timeoutWinner: game.timeoutWinner
        }),
        [game.board, game.multiJump, game.timeoutWinner, game.turn]
    );

    const boardWinner = useMemo(
        () => calculateWinner(coreState),
        [coreState]
    );

    const winner = useMemo(
        () => game.timeoutWinner ?? boardWinner,
        [boardWinner, game.timeoutWinner]
    );

    const validMoves = useMemo(() => {
        if (!game.selected || winner) return [];
        return getValidMoves(coreState, game.selected.row, game.selected.col);
    }, [coreState, game.selected, winner]);

    const mandatoryPieces = useMemo(() => {
        if (winner) return [];
        return getMandatoryPieces(coreState);
    }, [coreState, winner]);

    const captured = useMemo(
        () => getCapturedCounts(game.board),
        [game.board]
    );

    useEffect(() => {
        if (!lastMove) return;
        const timeoutId = window.setTimeout(() => {
            setLastMove(null);
        }, GAME_SETTINGS.ANIMATION_DURATION_MS);
        return () => window.clearTimeout(timeoutId);
    }, [lastMove]);

    const handleCellClick = useCallback((row: number, col: number) => {
        if (winner) return;

        const locked = game.multiJump;
        const isMoveTarget = validMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && game.selected) {
            const move = validMoves.find(move => move.row === row && move.col === col);
            if (!move) return;

            setLastMove({ from: game.selected, to: { row: move.row, col: move.col } });
            applyGameMove(game.selected, move, getTimerSnapshot());
            clearHighlights();
            return;
        }

        const piece = game.board[row]?.[col] ?? null;
        if (piece && piece.player === game.turn) {
            if (locked && (locked.row !== row || locked.col !== col)) {
                return;
            }

            const isSameSelection = game.selected?.row === row && game.selected?.col === col;
            if (isSameSelection && !locked) {
                select(null);
                return;
            }

            const moves = getValidMoves(coreState, row, col);
            if (moves.length === 0) {
                select(null);
                return;
            }

            select({ row, col });
            return;
        }

        if (!locked) {
            select(null);
        }
    }, [applyGameMove, clearHighlights, coreState, game.board, game.multiJump, game.selected, game.turn, getTimerSnapshot, select, validMoves, winner]);

    useEffect(() => {
        saveGame(buildSavedData(game, historyState, getTimerSnapshot()));
    }, [game, getTimerSnapshot, historyState]);

    const handleReset = useCallback(() => {
        reset();
        clearHighlights();
        setLastMove(null);
    }, [clearHighlights, reset]);

    const handleUndo = useCallback((): TimerState | null => {
        const lastTimer = undo();
        if (!lastTimer) return null;
        clearHighlights();
        setLastMove(null);
        return lastTimer ?? null;
    }, [clearHighlights, undo]);

    const handleTimeout = useCallback((winner: Player) => {
        setTimeoutWinner(winner);
    }, [setTimeoutWinner]);

    return {
        gameState: game,
        board: game.board,
        selected: game.selected,
        validMoves,
        historyHighlight,
        historyIndex,
        mandatoryPieces,
        moveLog: historyState.moveLog,
        currentPlayer: game.turn,
        winner,
        captured,
        onCellClick: handleCellClick,
        onReset: handleReset,
        onUndo: handleUndo,
        onTimeout: handleTimeout,
        onSelectHistory: selectHistory,
        lastMove
    };
};
