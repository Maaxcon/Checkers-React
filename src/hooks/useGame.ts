import { useCallback, useMemo, useRef, useState } from 'react';
import { BOARD, PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';
import { CheckersModel } from '../models/CheckersModel.ts';
import type { BoardGrid, MoveLogEntry, Position, TimerTimes } from '../types/types.ts';
import { useStorage } from './useStorage.ts';
import { useGameOver } from './useGameOver.ts';

export type CapturedCounts = {
    byLight: number;
    byDark: number;
};

export type GameSnapshot = {
    boardState: BoardGrid;
    currentPlayer: Player;
    winner: Player | null;
    timerTimes: TimerTimes;
    moveLog: MoveLogEntry[];
    captured: CapturedCounts;
    isLocked: boolean;
    mandatoryPieces: Position[];
};

const INITIAL_PIECES_PER_SIDE = BOARD.PIECE_ROWS * (BOARD.COLS / 2);

const cloneBoard = (model: CheckersModel): BoardGrid => model.board.map(row => [...row]);

const getCapturedCounts = (board: BoardGrid): CapturedCounts => {
    let lightCount = 0;
    let darkCount = 0;

    for (const row of board) {
        for (const piece of row) {
            if (!piece) continue;
            if (piece.player === PLAYERS.LIGHT) {
                lightCount++;
            } else {
                darkCount++;
            }
        }
    }

    return {
        byLight: INITIAL_PIECES_PER_SIDE - darkCount,
        byDark: INITIAL_PIECES_PER_SIDE - lightCount
    };
};

const buildSnapshot = (model: CheckersModel): GameSnapshot => {
    const boardState = cloneBoard(model);

    return {
        boardState,
        currentPlayer: model.currentTurn,
        winner: model.winner,
        timerTimes: model.timerTimes,
        moveLog: [...model.moveLog],
        captured: getCapturedCounts(boardState),
        isLocked: model.multiJumpPiece !== null,
        mandatoryPieces: model.getMandatoryPieces()
    };
};

export const useGame = () => {
    const { load, save } = useStorage();

    const model = useMemo(() => {
        const instance = new CheckersModel();
        const saved = load();
        if (saved) {
            instance.loadState(saved);
        }
        return instance;
    }, [load]);

    const modelRef = useRef(model);
    const [snapshot, setSnapshot] = useState<GameSnapshot>(() => buildSnapshot(model));

    const persist = useCallback(() => {
        save(modelRef.current.exportState());
    }, [save]);

    const syncFromModel = useCallback(() => {
        setSnapshot(buildSnapshot(modelRef.current));
    }, []);

    const setTimerTimes = useCallback((times: TimerTimes) => {
        setSnapshot(prev => ({
            ...prev,
            timerTimes: times
        }));
    }, []);

    useGameOver({
        modelRef,
        onGameOver: () => {
            persist();
            syncFromModel();
        }
    });

    return {
        modelRef,
        snapshot,
        persist,
        syncFromModel,
        setTimerTimes
    };
};
