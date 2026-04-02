import './Game.css';
import Board from './components/Board/Board.tsx';
import GameInfo from './components/GameInfo/GameInfo.tsx';
import MoveHistory from './components/MoveHistory/MoveHistory.tsx';
import ActionButton from './components/ActionButton/ActionButton.tsx';
import TimerPanel from './components/TurnTimer/TimerPanel.tsx';
import WinMessage from './components/WinMessage/WinMessage.tsx';
import { useCheckers } from './hooks/useCheckers.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYERS } from './constants/index.ts';
import { createInitialTimerState } from './logic/timer.ts';
import { useTimer } from './hooks/useTimer.ts';
import { sanitizeSavedData } from './logic/storage.ts';
import { loadGame } from './services/StorageService.ts';

function Game() {
    const [confirmReset, setConfirmReset] = useState(false);
    const [saved] = useState(() => sanitizeSavedData(loadGame()));
    const [initialTimer] = useState(() => saved?.timer ?? createInitialTimerState());
    const timerSnapshotRef = useRef(initialTimer);
    const timeoutFiredRef = useRef(false);
    const getTimerSnapshot = useCallback(() => timerSnapshotRef.current, []);
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
    const {
        state: timerState,
        times,
        switchPlayer,
        setActivePlayer,
        reset: resetTimer,
        restore: restoreTimer
    } = useTimer({
        initial: initialTimer,
        isRunning: winner === null
    });

    useEffect(() => {
        timerSnapshotRef.current = timerState;
    }, [timerState]);

    useEffect(() => {
        switchPlayer(currentPlayer);
    }, [currentPlayer, switchPlayer]);

    useEffect(() => {
        if (winner && timerState.activePlayer !== null) {
            setActivePlayer(null);
        }
    }, [setActivePlayer, timerState.activePlayer, winner]);

    useEffect(() => {
        if (winner === null) {
            timeoutFiredRef.current = false;
        }
    }, [winner]);

    useEffect(() => {
        if (winner || timeoutFiredRef.current) return;
        if (timerState.light <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.DARK);
            return;
        }
        if (timerState.dark <= 0) {
            timeoutFiredRef.current = true;
            onTimeout(PLAYERS.LIGHT);
        }
    }, [onTimeout, timerState.dark, timerState.light, winner]);

    const handleResetGame = () => {
        onReset();
        resetTimer();
        setConfirmReset(false);
    };

    const handleUndo = () => {
        const lastTimer = onUndo();
        if (lastTimer) {
            restoreTimer(lastTimer);
        }
    };

    return (
        <div className="game-container">
            <div className="game-section">
                <TimerPanel
                    times={times}
                    activePlayer={winner ? null : timerState.activePlayer}
                    winner={winner}
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
