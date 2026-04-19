import { useEffect, useState } from 'react';
import { createGame, getGame, getHistory } from '../services/GameApi.ts';
import { loadGameId, saveGameId } from '../services/StorageService.ts';
import { toSavedData } from '../logic/apiState.ts';
import type { ApiGameStateWithId } from '../types/api.ts';
import type { SavedData } from '../types/game.ts';

type GameBootstrapState = {
    saved: SavedData | null;
    error: string | null;
    isLoading: boolean;
};

const bootstrapSavedData = async (): Promise<SavedData> => {
    let gameId = loadGameId();
    let gameState: ApiGameStateWithId | null = null;

    if (gameId) {
        try {
            gameState = await getGame(gameId);
        } catch {
            gameId = null;
        }
    }

    if (!gameId) {
        const createdGame = await createGame();
        gameId = createdGame.id;
        saveGameId(gameId);
    }

    if (!gameState) {
        gameState = await getGame(gameId);
    }

    const history = await getHistory(gameId);
    return toSavedData(gameState, history.moveLog);
};

export const useGameBootstrap = (): GameBootstrapState => {
    const [saved, setSaved] = useState<SavedData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const runBootstrap = async () => {
            try {
                const initialSavedData = await bootstrapSavedData();
                if (cancelled) return;
                setSaved(initialSavedData);
                setError(null);
            } catch (err) {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Failed to start game';
                setError(message);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        runBootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    return { saved, error, isLoading };
};
