import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GAME_SETTINGS, PLAYERS } from '../constants/index.ts';
import type { LastMove, Piece, SavedData, TimerState } from '../types/game.ts';
import {
    getCapturedCounts,
    selectMandatoryPieces,
    selectValidMoves
} from '../logic/selectors.ts';
import { getValidMoves } from '../logic/rules.ts';
import {
    getGame,
    getHistory,
    aiMove as postAIMove,
    move as postMove,
    restart as postRestart,
    undo as postUndo
} from '../services/GameApi.ts';
import { useGameReducer } from './useGameReducer.ts';
import { useHighlights } from './useHighlights.ts';
import type { ApiGameMutationState, ApiGameState, ApiMoveLogEntry } from '../types/api.ts';

const msToSeconds = (value: number): number =>
    Math.max(0, Math.floor(value / 1000));
const SERVER_SYNC_INTERVAL_MS = 4000;
const DEFAULT_API_ERROR_MESSAGE = 'Server request failed';
const AI_PLAYER = PLAYERS.DARK;

const getLastMoveFromMoveLog = (moveLog: ApiMoveLogEntry[]): LastMove | null => {
    const lastEntry = moveLog.at(-1);
    if (!lastEntry) return null;
    return {
        from: { ...lastEntry.from },
        to: { ...lastEntry.to }
    };
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }
    return DEFAULT_API_ERROR_MESSAGE;
};

const isBoardEqual = (left: (Piece | null)[][], right: (Piece | null)[][]): boolean => {
    if (left.length !== right.length) return false;
    for (let row = 0; row < left.length; row += 1) {
        const leftRow = left[row] ?? [];
        const rightRow = right[row] ?? [];
        if (leftRow.length !== rightRow.length) return false;
        for (let col = 0; col < leftRow.length; col += 1) {
            const leftCell = leftRow[col];
            const rightCell = rightRow[col];
            if (leftCell === null && rightCell === null) continue;
            if (leftCell === null || rightCell === null) return false;
            if (leftCell.player !== rightCell.player || leftCell.isKing !== rightCell.isKing) return false;
        }
    }
    return true;
};

const toMoveLogEntry = (entry: ApiMoveLogEntry) => ({
    notation: entry.notation,
    from: { ...entry.from },
    to: { ...entry.to }
});

type UseCheckersOptions = {
    saved: SavedData | null;
    gameId: string;
    syncTimerFromServer: (timer: TimerState) => void;
};

export const useCheckers = ({ saved, gameId, syncTimerFromServer }: UseCheckersOptions) => {
    const {
        game,
        historyState,
        select,
        clearLastMove,
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
            serverWinner: game.serverWinner
        }),
        [game.board, game.multiJump, game.serverWinner, game.turn]
    );

    const winner = game.serverWinner;

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
    const [apiError, setApiError] = useState<string | null>(null);

    const moveInFlightRef = useRef(false);
    const syncInFlightRef = useRef(false);

    const interactionStateRef = useRef({
        winner,
        gameId,
        game,
        coreState,
        validMoves,
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
            clearHighlights,
            select
        };
    }, [
        clearHighlights,
        coreState,
        game,
        gameId,
        select,
        validMoves,
        winner
    ]);

    const applyServerSnapshot = useCallback((
        serverState: ApiGameState,
        moveLog: ApiMoveLogEntry[],
        options?: {
            lastMove?: LastMove | null;
            multiJump?: { row: number; col: number } | null;
        }
    ) => {
        setFromServer(
            {
                board: serverState.board,
                turn: serverState.turn,
                multiJump: options?.multiJump ?? null,
                serverWinner: serverState.winner
            },
            moveLog.map(toMoveLogEntry),
            options?.lastMove ?? null
        );
        syncTimerFromServer({
            light: msToSeconds(serverState.lightTimeRemaining),
            dark: msToSeconds(serverState.darkTimeRemaining),
            activePlayer: serverState.winner ? null : serverState.turn
        });
    }, [setFromServer, syncTimerFromServer]);

    const syncFromServerNow = useCallback(async (preserveMultiJump: boolean) => {
        if (moveInFlightRef.current || syncInFlightRef.current) return;
        syncInFlightRef.current = true;
        try {
            const serverState = await getGame(gameId);
            const currentGame = interactionStateRef.current.game;
            const boardChanged = !isBoardEqual(currentGame.board, serverState.board);
            const turnChanged = currentGame.turn !== serverState.turn;
            const winnerChanged = currentGame.serverWinner !== serverState.winner;

            if (!boardChanged && !turnChanged && !winnerChanged) {
                syncTimerFromServer({
                    light: msToSeconds(serverState.lightTimeRemaining),
                    dark: msToSeconds(serverState.darkTimeRemaining),
                    activePlayer: serverState.winner ? null : serverState.turn
                });
                setApiError(null);
                return;
            }

            const history = await getHistory(gameId);
            const multiJump = preserveMultiJump && currentGame.multiJump && currentGame.turn === serverState.turn
                ? { ...currentGame.multiJump }
                : null;
            applyServerSnapshot(serverState, history.moveLog, { multiJump });
            setApiError(null);
        } catch (error) {
            setApiError(getErrorMessage(error));
        } finally {
            syncInFlightRef.current = false;
        }
    }, [applyServerSnapshot, gameId, syncTimerFromServer]);

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
                let shouldRecover = false;
                try {
                    const serverState = await postMove(currentGameId, {
                        fromRow: from.row,
                        fromCol: from.col,
                        toRow: to.row,
                        toCol: to.col
                    });

                    const multiJump = wasCapture && serverState.turn === previousTurn
                        ? { ...to }
                        : null;

                    applyServerSnapshot(serverState, serverState.moveLog, {
                        lastMove: { from, to },
                        multiJump
                    });

                    const shouldTriggerAIMove =
                        previousTurn === PLAYERS.LIGHT
                        && !serverState.winner
                        && serverState.turn === AI_PLAYER;

                    if (shouldTriggerAIMove) {
                        const aiState = await postAIMove(currentGameId, { difficulty: 'medium' });
                        applyServerSnapshot(aiState, aiState.moveLog, {
                            lastMove: getLastMoveFromMoveLog(aiState.moveLog),
                            multiJump: null
                        });
                    }

                    setApiError(null);
                    currentClearHighlights();
                } catch (error) {
                    setApiError(getErrorMessage(error));
                    shouldRecover = true;
                } finally {
                    moveInFlightRef.current = false;
                    if (shouldRecover) {
                        void syncFromServerNow(true);
                    }
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
    }, [applyServerSnapshot, syncFromServerNow]);

    const runMutation = useCallback((apiCall: (currentGameId: string) => Promise<ApiGameMutationState>) => {
        if (moveInFlightRef.current) return;

        moveInFlightRef.current = true;
        void (async () => {
            let shouldRecover = false;
            try {
                const serverState = await apiCall(gameId);
                applyServerSnapshot(serverState, serverState.moveLog, { multiJump: null, lastMove: null });
                setApiError(null);
                clearHighlights();
            } catch (error) {
                setApiError(getErrorMessage(error));
                shouldRecover = true;
            } finally {
                moveInFlightRef.current = false;
                if (shouldRecover) {
                    void syncFromServerNow(true);
                }
            }
        })();
    }, [applyServerSnapshot, clearHighlights, gameId, syncFromServerNow]);

    const handleReset = useCallback(() => {
        runMutation(postRestart);
    }, [runMutation]);

    const handleUndo = useCallback(() => {
        runMutation(postUndo);
    }, [runMutation]);

    const handleTimeout = useCallback(() => {
        void syncFromServerNow(true);
    }, [syncFromServerNow]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            void syncFromServerNow(true);
        }, SERVER_SYNC_INTERVAL_MS);
        return () => {
            window.clearInterval(intervalId);
        };
    }, [syncFromServerNow]);

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
        apiError,
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
