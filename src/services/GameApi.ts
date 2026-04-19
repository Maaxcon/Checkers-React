import type {
    ApiGameState,
    ApiGameStateWithId,
    ApiMoveHistory,
    ApiMoveRequest
} from '../types/api.ts';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';
const rawEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = rawEnv?.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        },
        ...options
    });

    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) {
        const message = typeof payload.error === 'string'
            ? payload.error
            : `Request failed (${response.status})`;
        throw new Error(message);
    }

    return payload as T;
};

export const createGame = () =>
    request<ApiGameStateWithId>('/games/', { method: 'POST' });

export const getGame = (gameId: string) =>
    request<ApiGameStateWithId>(`/games/${gameId}/`);

export const move = (gameId: string, body: ApiMoveRequest) =>
    request<ApiGameState>(`/games/${gameId}/move/`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

export const undo = (gameId: string) =>
    request<ApiGameState>(`/games/${gameId}/undo/`, { method: 'POST' });

export const restart = (gameId: string) =>
    request<ApiGameState>(`/games/${gameId}/restart/`, { method: 'POST' });

export const getHistory = (gameId: string) =>
    request<ApiMoveHistory>(`/games/${gameId}/moves/`);
