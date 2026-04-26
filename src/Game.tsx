import './Game.css';
import Board from './components/Board/Board.tsx';
import GameSidebar from './components/GameSidebar/GameSidebar.tsx';
import TimerPanel, { type TimerPanelApi } from './components/TurnTimer/TimerPanel.tsx';
import WinMessage from './components/WinMessage/WinMessage.tsx';
import { useCheckers } from './hooks/useCheckers.ts';
import { useCallback, useRef, useState } from 'react';
import { createInitialTimerState } from './logic/timer.ts';
import { useGameBootstrap } from './hooks/useGameBootstrap.ts';
import type { SavedData } from './types/game.ts';

type GameSessionProps = {
    saved: SavedData;
    gameId: string;
};

function GameSession({ saved, gameId }: GameSessionProps) {
    const [initialTimer] = useState(() => saved?.timer ?? createInitialTimerState());
    const timerApiRef = useRef<TimerPanelApi | null>(null);
    const handleTimerReady = useCallback((api: TimerPanelApi) => {
        timerApiRef.current = api;
    }, []);
    const syncTimerFromServer = useCallback((timer: SavedData['timer']) => {
        timerApiRef.current?.restore(timer);
    }, []);
    const {
        board,
        selected,
        validMoves,
        historyHighlight,
        historyIndex,
        gameMode,
        isAiThinking,
        mandatoryPieces,
        moveLog,
        currentPlayer,
        winner,
        apiError,
        canUndo,
        captured,
        lastMove,
        onSetGameMode,
        onCellClick,
        onReset,
        onUndo,
        onTimeout,
        onSelectHistory
    } = useCheckers({ saved, gameId, syncTimerFromServer });

    return (
        <div className="game-container">
            <div className="game-section">
                <TimerPanel
                    initialTimer={initialTimer}
                    currentPlayer={currentPlayer}
                    winner={winner}
                    onTimeout={onTimeout}
                    onReady={handleTimerReady}
                />
                <Board
                    grid={board}
                    selected={selected}
                    validMoves={validMoves}
                    historyHighlight={historyHighlight}
                    mandatoryPieces={mandatoryPieces}
                    onCellClick={onCellClick}
                    lastMove={lastMove}
                />
                <WinMessage winner={winner} onRestart={onReset} />
            </div>
            <GameSidebar
                currentTurn={currentPlayer}
                winner={winner}
                captured={captured}
                moveLog={moveLog}
                historyIndex={historyIndex}
                apiError={apiError}
                gameMode={gameMode}
                isAiThinking={isAiThinking}
                canUndo={canUndo}
                onSetGameMode={onSetGameMode}
                onUndo={onUndo}
                onSelectHistory={onSelectHistory}
                onResetClick={onReset}
            />
        </div>
    );
}

function Game() {
    const { saved, gameId, error, isLoading } = useGameBootstrap();

    if (isLoading) {
        return (
            <div className="game-container">
                <div className="game-section game-status-message">Loading game...</div>
            </div>
        );
    }

    if (!saved || !gameId) {
        return (
            <div className="game-container">
                <div className="game-section game-status-message game-status-message--error">
                    Failed to load game: {error}
                </div>
            </div>
        );
    }

    return <GameSession saved={saved} gameId={gameId} />;
}

export default Game;
