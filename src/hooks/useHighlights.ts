import { useCallback, useState } from 'react';
import type { HistoryHighlight, MoveLogEntry } from '../types/types.ts';

const getHistoryHighlight = (moveLog: MoveLogEntry[], index: number | null): HistoryHighlight | null => {
    if (index === null) return null;
    const entry = moveLog[index];
    if (!entry) return null;
    return { from: entry.from, to: entry.to };
};

export const useHighlights = (moveLog: MoveLogEntry[]) => {
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [historyHighlight, setHistoryHighlight] = useState<HistoryHighlight | null>(null);

    const clearHighlights = useCallback(() => {
        setHistoryIndex(null);
        setHistoryHighlight(null);
    }, []);

    const selectHistory = useCallback((index: number | null) => {
        if (index === null) {
            clearHighlights();
            return;
        }
        if (index < 0 || index >= moveLog.length) return;
        setHistoryIndex(index);
        setHistoryHighlight(getHistoryHighlight(moveLog, index));
    }, [clearHighlights, moveLog]);

    return {
        historyIndex,
        historyHighlight,
        selectHistory,
        clearHighlights
    };
};
