import { useEffect, useRef } from 'react';
import type { TimerTimes } from '../types/types.ts';
import type { CheckersModel } from '../models/CheckersModel.ts';

export type TimerHookOptions = {
    modelRef: { current: CheckersModel };
    onTick: (times: TimerTimes) => void;
    onPersist: () => void;
};

export const useTimer = ({ modelRef, onTick, onPersist }: TimerHookOptions) => {
    const lastPersistRef = useRef(0);

    useEffect(() => {
        const current = modelRef.current;

        current.bindTimerTick((times) => {
            onTick(times);
            const now = Date.now();
            if (now - lastPersistRef.current >= 2000) {
                lastPersistRef.current = now;
                onPersist();
            }
        });

        current.startGame();
    }, [modelRef, onPersist, onTick]);
};
