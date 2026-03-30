import { useCallback } from 'react';
import type { CheckersModel } from '../models/CheckersModel.ts';

export type HistoryHookOptions = {
    modelRef: { current: CheckersModel };
    persist: () => void;
    syncFromModel: () => void;
};

export const useHistory = ({ modelRef, persist, syncFromModel }: HistoryHookOptions) => {
    const undo = useCallback(() => {
        const current = modelRef.current;
        current.undo();
        current.startGame();
        persist();
        syncFromModel();
    }, [modelRef, persist, syncFromModel]);

    return {
        undo
    };
};
