import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { GAME_SETTINGS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import type { SavedData, TimerState } from '../types/game.ts';
import {
    getCapturedCounts,
    selectMandatoryPieces,
    selectValidMoves
} from '../logic/selectors.ts';
import { calculateWinner, getValidMoves } from '../logic/rules.ts';
import {
    getHistory,
    move as postMove,
    restart as postRestart,
    undo as postUndo
} from '../services/GameApi.ts';
import { saveGame } from '../services/StorageService.ts';
import { useGameReducer } from './useGameReducer.ts';
import { useHighlights } from './useHighlights.ts';
import type { ApiMoveLogEntry } from '../types/api.ts';

const msToSeconds = (value: number): number =>
    Math.max(0, Math.floor(value / 1000));

const toMoveLogEntry = (entry: ApiMoveLogEntry) => ({
    notation: entry.notation,
    from: { ...entry.from },
    to: { ...entry.to }
});

type UseCheckersOptions = {
    saved: SavedData | null;
    gameId: string;
    getTimerSnapshot: () => TimerState;
    syncTimerFromServer: (timer: TimerState) => void;
};

export const useCheckers = ({ saved, gameId, getTimerSnapshot, syncTimerFromServer }: UseCheckersOptions) => {
    const {
        game,
        historyState,
        select,
        clearLastMove,
        setTimeoutWinner,
        setFromServer
    } = useGameReducer(saved);

    const {
        historyHighlight,
        historyIndex,
        selectHistory,
        clearHighlights
    } = useHighlights(historyState.moveLog);

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

    const validMoves = useMemo(
        () => selectValidMoves(coreState, game.selected, winner),
        [coreState, game.selected, winner]
    );

    const mandatoryPieces = useMemo(
        () => selectMandatoryPieces(coreState, winner),
        [coreState, winner]
    );

    const captured = useMemo(
        () => getCapturedCounts(game.board),
        [game.board]
    );

    const moveInFlightRef = useRef(false);

    const interactionStateRef = useRef({
        winner,
        gameId,
        game,
        coreState,
        validMoves,
        syncTimerFromServer,
        setFromServer,
        clearHighlights,
        select
    });

    useLayoutEffect(() => {
        interactionStateRef.current = {
            winner,
            gameId,
            game,
            coreState,
            validMoves,
            syncTimerFromServer,
            setFromServer,
            clearHighlights,
            select
        };
    }, [
        clearHighlights,
        coreState,
        game,
        gameId,
        select,
        setFromServer,
        syncTimerFromServer,
        validMoves,
        winner
    ]);

    useEffect(() => {
        if (!game.lastMove) return;
        const timeoutId = window.setTimeout(() => {
            clearLastMove();
        }, GAME_SETTINGS.ANIMATION_DURATION_MS);
        return () => window.clearTimeout(timeoutId);
    }, [clearLastMove, game.lastMove]);

    const handleCellClick = useCallback((row: number, col: number) => {
        const {
            winner: currentWinner,
            gameId: currentGameId,
            game: currentGame,
            coreState: currentCoreState,
            validMoves: currentValidMoves,
            syncTimerFromServer: currentSyncTimerFromServer,
            setFromServer: currentSetFromServer,
            clearHighlights: currentClearHighlights,
            select: currentSelect
        } = interactionStateRef.current;

        if (currentWinner) return;

        const locked = currentGame.multiJump;
        const isMoveTarget = currentValidMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && currentGame.selected) {
            if (moveInFlightRef.current) return;

            const selected = { ...currentGame.selected };
            const move = currentValidMoves.find(item => item.row === row && item.col === col);
            if (!move) return;

            const previousTurn = currentGame.turn;
            const from = { ...selected };
            const to = { row: move.row, col: move.col };
            const wasCapture = move.type === 'capture';

            moveInFlightRef.current = true;
            void (async () => {
                try {
                    const serverState = await postMove(currentGameId, {
                        fromRow: from.row,
                        fromCol: from.col,
                        toRow: to.row,
                        toCol: to.col
                    });
                    const history = await getHistory(currentGameId);

                    const multiJump = wasCapture && serverState.turn === previousTurn
                        ? { ...to }
                        : null;

                    currentSetFromServer(
                        {
                            board: serverState.board,
                            turn: serverState.turn,
                            multiJump,
                            timeoutWinner: serverState.winner
                        },
                        history.moveLog.map(toMoveLogEntry),
                        { from, to }
                    );
                    currentSyncTimerFromServer({
                        light: msToSeconds(serverState.lightTimeRemaining),
                        dark: msToSeconds(serverState.darkTimeRemaining),
                        activePlayer: serverState.winner ? null : serverState.turn
                    });
                    currentClearHighlights();
                } catch (error) {
                    console.error(error);
                } finally {
                    moveInFlightRef.current = false;
                }
            })();
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
        saveGame({
            game: coreState,
            moveLog: historyState.moveLog,
            history: historyState.history,
            timer: getTimerSnapshot()
        });
    }, [coreState, getTimerSnapshot, historyState]);

    const handleReset = useCallback(() => {
        if (moveInFlightRef.current) return;

        moveInFlightRef.current = true;
        void (async () => {
            try {
                const serverState = await postRestart(gameId);
                const history = await getHistory(gameId);
                setFromServer(
                    {
                        board: serverState.board,
                        turn: serverState.turn,
                        multiJump: null,
                        timeoutWinner: serverState.winner
                    },
                    history.moveLog.map(toMoveLogEntry),
                    null
                );
                syncTimerFromServer({
                    light: msToSeconds(serverState.lightTimeRemaining),
                    dark: msToSeconds(serverState.darkTimeRemaining),
                    activePlayer: serverState.winner ? null : serverState.turn
                });
                clearHighlights();
            } catch (error) {
                console.error(error);
            } finally {
                moveInFlightRef.current = false;
            }
        })();
    }, [clearHighlights, gameId, setFromServer, syncTimerFromServer]);

    const handleUndo = useCallback(() => {
        if (moveInFlightRef.current) return;

        moveInFlightRef.current = true;
        void (async () => {
            try {
                const serverState = await postUndo(gameId);
                const history = await getHistory(gameId);
                setFromServer(
                    {
                        board: serverState.board,
                        turn: serverState.turn,
                        multiJump: null,
                        timeoutWinner: serverState.winner
                    },
                    history.moveLog.map(toMoveLogEntry),
                    null
                );
                syncTimerFromServer({
                    light: msToSeconds(serverState.lightTimeRemaining),
                    dark: msToSeconds(serverState.darkTimeRemaining),
                    activePlayer: serverState.winner ? null : serverState.turn
                });
                clearHighlights();
            } catch (error) {
                console.error(error);
            } finally {
                moveInFlightRef.current = false;
            }
        })();
    }, [clearHighlights, gameId, setFromServer, syncTimerFromServer]);

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
        canUndo: historyState.moveLog.length > 0,
        captured,
        onCellClick: handleCellClick,
        onReset: handleReset,
        onUndo: handleUndo,
        onTimeout: handleTimeout,
        onSelectHistory: selectHistory,
        lastMove: game.lastMove
    };
};
