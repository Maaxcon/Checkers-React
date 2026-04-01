import { useCallback, useEffect, useMemo, useState } from 'react';
import { GAME_SETTINGS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { Position, SavedData, TimerState } from '../types/game.ts';
import { getCapturedCounts } from '../logic/selectors.ts';
import { buildSavedData } from '../logic/storage.ts';
import { saveGame } from '../services/StorageService.ts';
import { getMandatoryPieces, getValidMoves } from '../logic/rules.ts';
import { useGameReducer } from './useGameReducer.ts';
import { useHighlights } from './useHighlights.ts';

type UseCheckersOptions = {
    saved: SavedData | null;
    getTimerSnapshot: () => TimerState;
};

export const useCheckers = ({ saved, getTimerSnapshot }: UseCheckersOptions) => {
    const { game, dispatch } = useGameReducer(saved);

    const {
        historyHighlight,
        historyIndex,
        selectHistory,
        clearHighlights
    } = useHighlights(game.moveLog);

    const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);

    const coreState = useMemo(
        () => ({
            board: game.board,
            turn: game.turn,
            winner: game.winner,
            multiJump: game.multiJump
        }),
        [game.board, game.multiJump, game.turn, game.winner]
    );

    const validMoves = useMemo(() => {
        if (!game.selected) return [];
        return getValidMoves(coreState, game.selected.row, game.selected.col);
    }, [coreState, game.selected]);

    const mandatoryPieces = useMemo(
        () => getMandatoryPieces(coreState),
        [coreState]
    );

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
        if (game.winner) return;

        const locked = game.multiJump;
        const isMoveTarget = validMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && game.selected) {
            const move = validMoves.find(move => move.row === row && move.col === col);
            if (!move) return;

            setLastMove({ from: game.selected, to: { row: move.row, col: move.col } });
            dispatch({ type: 'APPLY_MOVE', from: game.selected, move, timer: getTimerSnapshot() });
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
                dispatch({ type: 'SELECT', position: null });
                return;
            }

            const moves = getValidMoves(coreState, row, col);
            if (moves.length === 0) {
                dispatch({ type: 'SELECT', position: null });
                return;
            }

            dispatch({ type: 'SELECT', position: { row, col } });
            return;
        }

        if (!locked) {
            dispatch({ type: 'SELECT', position: null });
        }
    }, [clearHighlights, coreState, dispatch, game.board, game.multiJump, game.selected, game.turn, game.winner, getTimerSnapshot, validMoves]);

    useEffect(() => {
        saveGame(buildSavedData(game, getTimerSnapshot()));
    }, [game, getTimerSnapshot]);

    const handleReset = useCallback(() => {
        dispatch({ type: 'RESET' });
        clearHighlights();
        setLastMove(null);
    }, [clearHighlights, dispatch]);

    const handleUndo = useCallback((): TimerState | null => {
        if (game.history.length === 0) return null;
        const lastTimer = game.history[game.history.length - 1]?.timer;
        dispatch({ type: 'UNDO' });
        clearHighlights();
        setLastMove(null);
        return lastTimer ?? null;
    }, [clearHighlights, dispatch, game.history]);

    const handleTimeout = useCallback((winner: Player) => {
        dispatch({ type: 'SET_WINNER', winner });
    }, [dispatch]);

    return {
        gameState: game,
        board: game.board,
        selected: game.selected,
        validMoves,
        historyHighlight,
        historyIndex,
        mandatoryPieces,
        moveLog: game.moveLog,
        currentPlayer: game.turn,
        winner: game.winner,
        captured,
        onCellClick: handleCellClick,
        onReset: handleReset,
        onUndo: handleUndo,
        onTimeout: handleTimeout,
        onSelectHistory: selectHistory,
        lastMove
    };
};
