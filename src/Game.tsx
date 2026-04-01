import './Game.css';
import Board from './components/Board/Board.tsx';
import GameInfo from './components/GameInfo/GameInfo.tsx';
import MoveHistory from './components/MoveHistory/MoveHistory.tsx';
import ActionButton from './components/ActionButton/ActionButton.tsx';
import TurnTimer from './components/TurnTimer/TurnTimer.tsx';
import WinMessage from './components/WinMessage/WinMessage.tsx';
import { useCheckers } from './hooks/useCheckers.ts';
import { useState } from 'react';

function Game() {
    const [confirmReset, setConfirmReset] = useState(false);
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
        timerTimes,
        lastMove,
        onCellClick,
        onReset,
        onUndo,
        onSelectHistory
    } = useCheckers();

    const handleConfirmReset = () => {
        onReset();
        setConfirmReset(false);
    };

    return (
        <div className="game-container">
            <div className="game-section">
                <TurnTimer
                    times={timerTimes}
                    activePlayer={winner ? null : currentPlayer}
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
                <WinMessage winner={winner} onRestart={onReset} />
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
                                <ActionButton text="Yes" onClick={handleConfirmReset} />
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
                        onClick={onUndo}
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
