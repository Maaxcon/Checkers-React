import type { HistoryState, MoveLogEntry } from '../types/game.ts';

export type HistoryAction = { type: 'SET_FROM_SERVER'; moveLog: MoveLogEntry[] };

const cloneMoveLog = (moveLog: MoveLogEntry[]): MoveLogEntry[] =>
    moveLog.map(entry => ({
        notation: entry.notation,
        from: { ...entry.from },
        to: { ...entry.to }
    }));

export const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
    switch (action.type) {
        case 'SET_FROM_SERVER':
            return {
                moveLog: cloneMoveLog(action.moveLog)
            };
        default:
            return state;
    }
};
