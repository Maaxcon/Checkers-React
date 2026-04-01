import { GAME_SETTINGS } from '../constants/index.ts';
import type { SavedData } from '../types/game.ts';

export const saveGame = (data: SavedData): void => {
    localStorage.setItem(GAME_SETTINGS.STORAGE_KEY, JSON.stringify(data));
};

export const loadGame = (): SavedData | null => {
    const json = localStorage.getItem(GAME_SETTINGS.STORAGE_KEY);
    if (!json) return null;
    try {
        const parsed: unknown = JSON.parse(json);
        return parsed as SavedData;
    } catch {
        clearGame();
        return null;
    }
};

export const clearGame = (): void => {
    localStorage.removeItem(GAME_SETTINGS.STORAGE_KEY);
};
