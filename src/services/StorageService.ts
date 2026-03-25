import { GAME_SETTINGS } from '../constants/constants.ts';
import type { SavedData } from '../types/types.ts';

export class StorageService {
    static save(data: SavedData): void {
        localStorage.setItem(GAME_SETTINGS.STORAGE_KEY, JSON.stringify(data));
    }

    static load(): SavedData | null {
        const json = localStorage.getItem(GAME_SETTINGS.STORAGE_KEY);
        if (!json) return null;
        try {
            const parsed: unknown = JSON.parse(json);
            return parsed as SavedData;
        } catch {
            this.clear();
            return null;
        }
    }

    static clear(): void {
        localStorage.removeItem(GAME_SETTINGS.STORAGE_KEY);
    }
}
