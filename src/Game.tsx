import './Game.css';
import Board from './components/Board/Board.tsx';
import GameInfo from './components/GameInfo/GameInfo.tsx';
import MoveHistory from './components/MoveHistory/MoveHistory.tsx';
import ActionButton from './components/ActionButton/ActionButton.tsx';
import TimerPanel, { type TimerPanelHandle } from './components/TurnTimer/TimerPanel.tsx';
import WinMessage from './components/WinMessage/WinMessage.tsx';
import { useCheckers } from './hooks/useCheckers.ts';
import { useCallback, useRef, useState } from 'react';
import { createInitialTimerState } from './logic/timer.ts';
import { loadGame } from './services/StorageService.ts';

function Game() {
    const [confirmReset, setConfirmReset] = useState(false);
    const [saved] = useState(() => loadGame());
    const [initialTimer] = useState(() => saved?.timer ?? createInitialTimerState());
    const timerRef = useRef<TimerPanelHandle | null>(null);
    const getTimerSnapshot = useCallback(
        () => timerRef.current?.getSnapshot() ?? initialTimer,
        [initialTimer]
    );
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
        captured,
        lastMove,
        onCellClick,
        onReset,
        onUndo,
        onTimeout,
        onSelectHistory
    } = useCheckers({ saved, getTimerSnapshot });

    const handleResetGame = useCallback(() => {
        onReset();
        timerRef.current?.reset();
        setConfirmReset(false);
    }, [onReset]);

    const handleUndo = useCallback(() => {
        const lastTimer = onUndo();
        if (lastTimer) {
            timerRef.current?.restore(lastTimer);
        }
    }, [onUndo]);

    return (
        <div className="game-container">
            <div className="game-section">
                <TimerPanel
                    ref={timerRef}
                    initialTimer={initialTimer}
                    turn={currentPlayer}
                    winner={winner}
                    onTimeout={onTimeout}
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
                        disabled={moveLog.length === 0}
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

export default Game;
