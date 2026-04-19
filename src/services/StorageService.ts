import { GAME_SETTINGS } from '../constants/index.ts';
import type { SavedData } from '../types/game.ts';
import { isSavedData } from '../logic/storage.ts';

const GAME_ID_STORAGE_KEY = `${GAME_SETTINGS.STORAGE_KEY}_game_id`;

export const saveGame = (data: SavedData): void => {
    localStorage.setItem(GAME_SETTINGS.STORAGE_KEY, JSON.stringify(data));
};

export const loadGame = (): SavedData | null => {
    const json = localStorage.getItem(GAME_SETTINGS.STORAGE_KEY);
    if (!json) return null;
    try {
        const parsed: unknown = JSON.parse(json);
        if (!isSavedData(parsed)) {
            clearGame();
            return null;
        }
        return parsed;
    } catch {
        clearGame();
        return null;
    }
};

export const clearGame = (): void => {
    localStorage.removeItem(GAME_SETTINGS.STORAGE_KEY);
};

export const saveGameId = (gameId: string): void => {
    localStorage.setItem(GAME_ID_STORAGE_KEY, gameId);
};

export const loadGameId = (): string | null => {
    const gameId = localStorage.getItem(GAME_ID_STORAGE_KEY);
    return gameId && gameId.trim().length > 0 ? gameId : null;
};

export const clearGameId = (): void => {
    localStorage.removeItem(GAME_ID_STORAGE_KEY);
};
