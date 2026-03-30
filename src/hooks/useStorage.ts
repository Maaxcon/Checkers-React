import { useCallback } from 'react';
import { StorageService } from '../services/StorageService.ts';
import type { SavedData } from '../types/types.ts';

export const useStorage = () => {
    const save = useCallback((data: SavedData) => {
        StorageService.save(data);
    }, []);

    const load = useCallback(() => {
        return StorageService.load();
    }, []);

    const clear = useCallback(() => {
        StorageService.clear();
    }, []);

    return { save, load, clear };
};
