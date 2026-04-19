import type {
    ApiGameMutationState,
    ApiGameStateWithId,
    ApiMoveHistory,
    ApiMoveRequest
} from '../types/api.ts';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';
const rawEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = rawEnv?.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const parsePayload = async (response: Response): Promise<unknown> => {
    const text = await response.text();
    if (!text) return null;

    const contentType = response.headers.get('content-type') ?? '';
    const looksLikeJson = contentType.includes('application/json');

    if (looksLikeJson) {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    return text;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        },
        ...options
    });

    const payload = await parsePayload(response);
    if (!response.ok) {
        const message = isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : typeof payload === 'string' && payload.trim().length > 0
                ? payload
                : response.statusText
                    ? `${response.status} ${response.statusText}`
            : `Request failed (${response.status})`;
        throw new Error(message);
    }

    if (isRecord(payload)) {
        return payload as T;
    }

    throw new Error('Unexpected response format from server');
};

export const createGame = () =>
    request<ApiGameStateWithId>('/games/', { method: 'POST' });

export const getGame = (gameId: string) =>
    request<ApiGameStateWithId>(`/games/${gameId}/`);

export const move = (gameId: string, body: ApiMoveRequest) =>
    {
        const { fromRow, fromCol, toRow, toCol } = body;
        return request<ApiGameMutationState>(`/games/${gameId}/move/`, {
            method: 'POST',
            body: JSON.stringify({ fromRow, fromCol, toRow, toCol })
        });
    };

export const undo = (gameId: string) =>
    request<ApiGameMutationState>(`/games/${gameId}/undo/`, { method: 'POST' });

export const restart = (gameId: string) =>
    request<ApiGameMutationState>(`/games/${gameId}/restart/`, { method: 'POST' });

export const getHistory = (gameId: string) =>
    request<ApiMoveHistory>(`/games/${gameId}/moves/`);
