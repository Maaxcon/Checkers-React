import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

    const interactionStateRef = useRef({
        winner,
        game,
        coreState,
        validMoves,
        getTimerSnapshot,
        applyGameMove,
        clearHighlights,
        select
    });

    useEffect(() => {
        interactionStateRef.current = {
            winner,
            game,
            coreState,
            validMoves,
            getTimerSnapshot,
            applyGameMove,
            clearHighlights,
            select
        };
    }, [
        applyGameMove,
        clearHighlights,
        coreState,
        game,
        getTimerSnapshot,
        select,
        validMoves,
        winner
    ]);

    useEffect(() => {
        if (!lastMove) return;
        const timeoutId = window.setTimeout(() => {
            setLastMove(null);
        }, GAME_SETTINGS.ANIMATION_DURATION_MS);
        return () => window.clearTimeout(timeoutId);
    }, [lastMove]);

    const handleCellClick = useCallback((row: number, col: number) => {
        const {
            winner: currentWinner,
            game: currentGame,
            coreState: currentCoreState,
            validMoves: currentValidMoves,
            getTimerSnapshot: currentGetTimerSnapshot,
            applyGameMove: currentApplyGameMove,
            clearHighlights: currentClearHighlights,
            select: currentSelect
        } = interactionStateRef.current;

        if (currentWinner) return;

        const locked = currentGame.multiJump;
        const isMoveTarget = currentValidMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && currentGame.selected) {
            const move = currentValidMoves.find(move => move.row === row && move.col === col);
            if (!move) return;

            setLastMove({ from: currentGame.selected, to: { row: move.row, col: move.col } });
            currentApplyGameMove(currentGame.selected, move, currentGetTimerSnapshot());
            currentClearHighlights();
            return;
        }

        const piece = currentGame.board[row]?.[col] ?? null;
        if (piece && piece.player === currentGame.turn) {
            if (locked && (locked.row !== row || locked.col !== col)) {
                return;
            }

            const isSameSelection =
                currentGame.selected?.row === row && currentGame.selected?.col === col;
            if (isSameSelection && !locked) {
                currentSelect(null);
                return;
            }

            const moves = getValidMoves(currentCoreState, row, col);
            if (moves.length === 0) {
                currentSelect(null);
                return;
            }

            currentSelect({ row, col });
            return;
        }

        if (!locked) {
            currentSelect(null);
        }
    }, []);

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
