import type { Player } from '../constants/index.ts';

export type ApiPosition = {
    row: number;
    col: number;
};

export type ApiPiece = {
    player: Player;
    isKing: boolean;
};

export type ApiGameState = {
    status: string;
    board: (ApiPiece | null)[][];
    turn: Player;
    winner: Player | null;
    timeRemaining: number;
    lightTimeRemaining: number;
    darkTimeRemaining: number;
};

export type ApiGameStateWithId = ApiGameState & {
    id: string;
};

export type ApiGameMutationState = ApiGameState & {
    moveLog: ApiMoveLogEntry[];
};

export type ApiMoveRequest = {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
};

export type ApiAIMoveRequest = {
    aiRequestId: string;
    difficulty?: 'easy' | 'medium' | 'hard';
};

export type ApiAIMoveEnqueueResponse = {
    jobId: string;
    status: string;
    aiRequestId: string;
};

export type ApiAIMoveStatusResponse = {
    jobId: string;
    status: string;
    isFinished: boolean;
    isFailed: boolean;
    result?: ApiGameMutationState;
    error?: string;
};

export type ApiMoveLogEntry = {
    notation: string;
    from: ApiPosition;
    to: ApiPosition;
};

export type ApiMoveHistory = {
    gameId: string;
    moveLog: ApiMoveLogEntry[];
};
