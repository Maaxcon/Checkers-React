import { GAME_SETTINGS } from '../constants/index.ts';

const LEGACY_GAME_STATE_KEY = GAME_SETTINGS.STORAGE_KEY;
const GAME_ID_STORAGE_KEY = `${GAME_SETTINGS.STORAGE_KEY}_game_id`;

const clearLegacyGameState = (): void => {
    localStorage.removeItem(LEGACY_GAME_STATE_KEY);
};

export const saveGameId = (gameId: string): void => {
    localStorage.setItem(GAME_ID_STORAGE_KEY, gameId);
};

export const loadGameId = (): string | null => {
    clearLegacyGameState();
    const gameId = localStorage.getItem(GAME_ID_STORAGE_KEY);
    return gameId && gameId.trim().length > 0 ? gameId : null;
};

export const clearGameId = (): void => {
    localStorage.removeItem(GAME_ID_STORAGE_KEY);
};
