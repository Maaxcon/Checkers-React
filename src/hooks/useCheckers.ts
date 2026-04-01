import { useCallback, useEffect, useMemo, useState } from 'react';
import { GAME_SETTINGS, PLAYERS } from '../constants/index.ts';
import type { Position } from '../types/game.ts';
import { getCapturedCounts } from '../logic/selectors.ts';
import { buildSavedData, sanitizeSavedData } from '../logic/storage.ts';
import { getMandatoryPieces, getValidMoves } from '../logic/rules.ts';
import { useGameReducer } from './useGameReducer.ts';
import { useHighlights } from './useHighlights.ts';
import { useTimer } from './useTimer.ts';
import { loadGame, saveGame } from '../services/StorageService.ts';

export const useCheckers = () => {
    const [saved] = useState(() => sanitizeSavedData(loadGame()));

    const { game, dispatch } = useGameReducer(saved);

    const {
        state: timerState,
        times: timerTimes,
        switchPlayer,
        setActivePlayer,
        reset: resetTimer,
        restore: restoreTimer,
        getSnapshot: getTimerSnapshot
    } = useTimer({
        initial: saved?.timer,
        isRunning: game.winner === null,
        onTimeout: (winner) => dispatch({ type: 'SET_WINNER', winner })
    });

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
        saveGame(buildSavedData(game, timerState));
    }, [game, timerState]);

    useEffect(() => {
        switchPlayer(game.turn);
    }, [game.turn, switchPlayer]);

    useEffect(() => {
        if (game.winner && timerState.activePlayer !== null) {
            setActivePlayer(null);
        }
    }, [game.winner, setActivePlayer, timerState.activePlayer]);

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

    const handleReset = useCallback(() => {
        dispatch({ type: 'RESET' });
        clearHighlights();
        resetTimer();
        setActivePlayer(PLAYERS.LIGHT);
        setLastMove(null);
    }, [clearHighlights, dispatch, resetTimer, setActivePlayer]);

    const handleUndo = useCallback(() => {
        if (game.history.length === 0) return;
        const lastTimer = game.history[game.history.length - 1]?.timer;
        dispatch({ type: 'UNDO' });
        if (lastTimer) {
            restoreTimer(lastTimer);
        }
        clearHighlights();
        setLastMove(null);
    }, [clearHighlights, dispatch, game.history, restoreTimer]);

    return {
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
        timerTimes,
        onCellClick: handleCellClick,
        onReset: handleReset,
        onUndo: handleUndo,
        onSelectHistory: selectHistory,
        lastMove
    };
};
