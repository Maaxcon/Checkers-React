import { useEffect } from 'react';
import type { CheckersModel } from '../models/CheckersModel.ts';

export type GameOverHookOptions = {
    modelRef: { current: CheckersModel };
    onGameOver: () => void;
};

export const useGameOver = ({ modelRef, onGameOver }: GameOverHookOptions) => {
    useEffect(() => {
        const current = modelRef.current;
        current.bindGameOver(() => {
            onGameOver();
        });
    }, [modelRef, onGameOver]);
};
