import './Game.css';
import Board from './components/Board/Board.tsx';
import GameInfo from './components/GameInfo/GameInfo.tsx';
import MoveHistory from './components/MoveHistory/MoveHistory.tsx';
import ActionButton from './components/ActionButton/ActionButton.tsx';
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
    const [confirmReset, setConfirmReset] = useState(false);
    const [initialTimer] = useState(() => saved?.timer ?? createInitialTimerState());
    const timerApiRef = useRef<TimerPanelApi | null>(null);
    const getTimerSnapshot = useCallback(
        () => timerApiRef.current?.getSnapshot() ?? initialTimer,
        [initialTimer]
    );
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
        mandatoryPieces,
        moveLog,
        currentPlayer,
        winner,
        canUndo,
        captured,
        lastMove,
        onCellClick,
        onReset,
        onUndo,
        onTimeout,
        onSelectHistory
    } = useCheckers({ saved, gameId, getTimerSnapshot, syncTimerFromServer });

    const handleResetGame = useCallback(() => {
        onReset();
        setConfirmReset(false);
    }, [onReset]);

    const handleUndo = useCallback(() => {
        onUndo();
    }, [onUndo]);

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
                <WinMessage winner={winner} onRestart={handleResetGame} />
            </div>
            <aside className="game-sidebar">
                <GameInfo
                    currentTurn={currentPlayer}
                    winner={winner}
                    captured={captured}
                />
                <div className="game-controls">
                    {confirmReset ? (
                        <div className="confirm-reset">
                            <span className="confirm-reset__text">Restart the game?</span>
                            <div className="confirm-reset__actions">
                                <ActionButton text="Yes" onClick={handleResetGame} />
                                <ActionButton
                                    text="Cancel"
                                    onClick={() => setConfirmReset(false)}
                                />
                            </div>
                        </div>
                    ) : (
                        <ActionButton
                            text="Reset game"
                            onClick={() => setConfirmReset(true)}
                        />
                    )}
                    <ActionButton
                        text="Undo"
                        onClick={handleUndo}
                        disabled={!canUndo}
                    />
                </div>
                <MoveHistory
                    moveLog={moveLog}
                    activeIndex={historyIndex}
                    onSelect={onSelectHistory}
                />
            </aside>
        </div>
    );
}

function Game() {
    const { saved, gameId, error, isLoading } = useGameBootstrap();

    if (isLoading) {
        return (
            <div className="game-container">
                <div className="game-section">Loading game...</div>
            </div>
        );
    }

    if (!saved || !gameId) {
        return (
            <div className="game-container">
                <div className="game-section">Failed to load game: {error}</div>
            </div>
        );
    }

    return <GameSession saved={saved} gameId={gameId} />;
}

export default Game;
