import { useReducer } from 'react';
import type { SavedData } from '../types/game.ts';
import { gameReducer } from '../logic/gameReducer.ts';
import { hydrateFromSaved } from '../logic/storage.ts';

export const useGameReducer = (saved: SavedData | null) => {
    const [game, dispatch] = useReducer(gameReducer, saved, (data) => hydrateFromSaved(data).game);

    return { game, dispatch };
};
