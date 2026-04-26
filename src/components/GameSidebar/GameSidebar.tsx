import React, { useMemo, useState, useCallback } from 'react';
import type { Player } from '../../constants/index.ts';
import type { CapturedCounts, GameMode, MoveLogEntry } from '../../types/game.ts';
import GameInfo from '../GameInfo/GameInfo.tsx';
import MoveHistory from '../MoveHistory/MoveHistory.tsx';
import ActionButton from '../ActionButton/ActionButton.tsx';

type GameSidebarProps = {
    currentTurn: Player;
    winner: Player | null;
    captured: CapturedCounts;
    moveLog: MoveLogEntry[];
    historyIndex: number | null;
    apiError: string | null;
    gameMode: GameMode;
    isAiThinking: boolean;
    canUndo: boolean;
    onSetGameMode: (mode: GameMode) => void;
    onUndo: () => void;
    onSelectHistory: (index: number | null) => void;
    onResetClick: () => void;
};

function GameSidebar({
    currentTurn,
    winner,
    captured,
    moveLog,
    historyIndex,
    apiError,
    gameMode,
    isAiThinking,
    canUndo,
    onSetGameMode,
    onUndo,
    onSelectHistory,
    onResetClick
}: GameSidebarProps) {
    const [confirmReset, setConfirmReset] = useState(false);

    const gameInfoData = useMemo(
        () => ({ currentTurn, winner, captured }),
        [currentTurn, winner, captured]
    );

    const moveHistoryData = useMemo(
        () => ({ moveLog, historyIndex }),
        [moveLog, historyIndex]
    );

    const handleReset = useCallback(() => {
        onResetClick();
        setConfirmReset(false);
    }, [onResetClick]);

    const handleResetRequest = useCallback(() => {
        setConfirmReset(true);
    }, []);

    return (
        <aside className="game-sidebar">
            <GameInfo
                currentTurn={gameInfoData.currentTurn}
                winner={gameInfoData.winner}
                captured={gameInfoData.captured}
            />
            {apiError ? <div className="game-api-error">{apiError}</div> : null}
            <div className="game-mode-toggle">
                <ActionButton
                    text="Local"
                    onClick={() => onSetGameMode('local')}
                    disabled={isAiThinking}
                    className={gameMode === 'local' ? 'btn mode-button mode-button--active' : 'btn mode-button'}
                    ariaPressed={gameMode === 'local'}
                />
                <ActionButton
                    text="Vs AI"
                    onClick={() => onSetGameMode('vs-ai')}
                    disabled={isAiThinking}
                    className={gameMode === 'vs-ai' ? 'btn mode-button mode-button--active' : 'btn mode-button'}
                    ariaPressed={gameMode === 'vs-ai'}
                />
            </div>
            {isAiThinking ? <div className="game-ai-status">AI is thinking...</div> : null}
            <div className="game-controls">
                {confirmReset ? (
                    <div className="confirm-reset">
                        <span className="confirm-reset__text">Restart the game?</span>
                        <div className="confirm-reset__actions">
                            <ActionButton text="Yes" onClick={handleReset} disabled={isAiThinking} />
                            <ActionButton
                                text="Cancel"
                                onClick={() => setConfirmReset(false)}
                                disabled={isAiThinking}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <ActionButton
                            text="Reset game"
                            onClick={handleResetRequest}
                            disabled={isAiThinking}
                        />
                        <ActionButton
                            text="Undo"
                            onClick={onUndo}
                            disabled={!canUndo}
                        />
                    </>
                )}
            </div>
            <MoveHistory
                moveLog={moveHistoryData.moveLog}
                activeIndex={moveHistoryData.historyIndex}
                onSelect={onSelectHistory}
            />
        </aside>
    );
}

export default React.memo(GameSidebar);
