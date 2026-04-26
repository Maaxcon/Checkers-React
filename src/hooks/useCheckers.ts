import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GAME_SETTINGS, PLAYERS } from '../constants/index.ts';
import type { GameMode, LastMove, Piece, SavedData, TimerState } from '../types/game.ts';
import {
    getCapturedCounts,
    selectMandatoryPieces,
    selectValidMoves
} from '../logic/selectors.ts';
import { getValidMoves } from '../logic/rules.ts';
import {
    aiMove as requestAiMove,
    getGame,
    getAiMoveStatus,
    getHistory,
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
const AI_POLL_INTERVAL_MS = 1200;
const AI_POLL_TIMEOUT_MS = 30000;
const AI_PLAYER = PLAYERS.DARK;
const DEFAULT_AI_DIFFICULTY = 'medium' as const;
const DEFAULT_API_ERROR_MESSAGE = 'Server request failed';

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }
    return DEFAULT_API_ERROR_MESSAGE;
};

const waitFor = (ms: number): Promise<void> =>
    new Promise(resolve => {
        window.setTimeout(resolve, ms);
    });

const createAiRequestId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `ai-${crypto.randomUUID()}`;
    }
    return `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    const [gameMode, setGameMode] = useState<GameMode>('local');
    const [apiError, setApiError] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const moveInFlightRef = useRef(false);
    const aiInFlightRef = useRef(false);
    const syncInFlightRef = useRef(false);

    const interactionStateRef = useRef({
        winner,
        gameId,
        game,
        gameMode,
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
            gameMode,
            coreState,
            validMoves,
            clearHighlights,
            select
        };
    }, [
        clearHighlights,
        coreState,
        game,
        gameMode,
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

    const shouldAiPlayTurn = useCallback((turn: number, serverWinner: number | null) => {
        return gameMode === 'vs-ai' && serverWinner === null && turn === AI_PLAYER;
    }, [gameMode]);

    const requestAiMoveResult = useCallback(async (currentGameId: string): Promise<ApiGameMutationState> => {
        const enqueuePayload = await requestAiMove(currentGameId, {
            aiRequestId: createAiRequestId(),
            difficulty: DEFAULT_AI_DIFFICULTY
        });

        const startedAt = Date.now();
        let latestStatus = enqueuePayload.status;

        while (Date.now() - startedAt < AI_POLL_TIMEOUT_MS) {
            const statusPayload = await getAiMoveStatus(currentGameId, enqueuePayload.jobId);
            latestStatus = statusPayload.status;

            if (statusPayload.isFailed) {
                throw new Error(statusPayload.error ?? `AI job failed (${latestStatus})`);
            }

            if (statusPayload.isFinished) {
                if (statusPayload.result) {
                    return statusPayload.result;
                }
                throw new Error('AI job finished without result');
            }

            await waitFor(AI_POLL_INTERVAL_MS);
        }

        throw new Error(`AI job timeout (${latestStatus})`);
    }, []);

    const runAiTurn = useCallback(async (currentGameId: string) => {
        if (aiInFlightRef.current) return;

        aiInFlightRef.current = true;
        setIsAiThinking(true);

        try {
            let keepGoing = true;
            while (keepGoing) {
                const serverState = await requestAiMoveResult(currentGameId);
                applyServerSnapshot(serverState, serverState.moveLog, { multiJump: null, lastMove: null });
                clearHighlights();
                keepGoing = shouldAiPlayTurn(serverState.turn, serverState.winner);
            }
            setApiError(null);
        } catch (error) {
            setApiError(getErrorMessage(error));
        } finally {
            aiInFlightRef.current = false;
            setIsAiThinking(false);
        }
    }, [applyServerSnapshot, clearHighlights, requestAiMoveResult, shouldAiPlayTurn]);

    const syncFromServerNow = useCallback(async (preserveMultiJump: boolean) => {
        if (moveInFlightRef.current || aiInFlightRef.current || syncInFlightRef.current) return;
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
            gameMode: currentGameMode,
            coreState: currentCoreState,
            validMoves: currentValidMoves,
            clearHighlights: currentClearHighlights,
            select: currentSelect
        } = interactionStateRef.current;

        if (currentWinner) return;
        if (currentGameMode === 'vs-ai' && currentGame.turn === AI_PLAYER) return;

        const locked = currentGame.multiJump;
        const isMoveTarget = currentValidMoves.some(move => move.row === row && move.col === col);

        if (isMoveTarget && currentGame.selected) {
            if (moveInFlightRef.current || aiInFlightRef.current) return;

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
                    setApiError(null);
                    currentClearHighlights();
                    if (shouldAiPlayTurn(serverState.turn, serverState.winner)) {
                        await runAiTurn(currentGameId);
                    }
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
    }, [applyServerSnapshot, runAiTurn, shouldAiPlayTurn, syncFromServerNow]);

    const runMutation = useCallback((apiCall: (currentGameId: string) => Promise<ApiGameMutationState>) => {
        if (moveInFlightRef.current || aiInFlightRef.current) return;

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

    const handleSetGameMode = useCallback((mode: GameMode) => {
        setGameMode(mode);
    }, []);

    const handleTimeout = useCallback(() => {
        void syncFromServerNow(true);
    }, [syncFromServerNow]);

    useEffect(() => {
        if (!shouldAiPlayTurn(game.turn, game.serverWinner)) return;
        void runAiTurn(gameId);
    }, [game.serverWinner, game.turn, gameId, runAiTurn, shouldAiPlayTurn]);

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
        gameMode,
        isAiThinking,
        currentPlayer: game.turn,
        winner,
        apiError,
        canUndo: historyState.moveLog.length > 0 && !isAiThinking,
        captured,
        onSetGameMode: handleSetGameMode,
        onCellClick: handleCellClick,
        onReset: handleReset,
        onUndo: handleUndo,
        onTimeout: handleTimeout,
        onSelectHistory: selectHistory,
        lastMove: game.lastMove
    };
};
