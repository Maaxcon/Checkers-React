import './Game.css';
import Board from './components/Board/Board.tsx';
import GameInfo from './components/GameInfo/GameInfo.tsx';
import MoveHistory from './components/MoveHistory/MoveHistory.tsx';
import ActionButton from './components/ActionButton/ActionButton.tsx';
import TurnTimer from './components/TurnTimer/TurnTimer.tsx';
import WinMessage from './components/WinMessage/WinMessage.tsx';
import { useAnimation } from './hooks/useAnimation.ts';
import { useGame } from './hooks/useGame.ts';
import { useHighlights } from './hooks/useHighlights.ts';
import { useHistory } from './hooks/useHistory.ts';
import { useInteraction } from './hooks/useInteraction.ts';
import { useTimer } from './hooks/useTimer.ts';

function Game() {
    const game = useGame();
    useTimer({ modelRef: game.modelRef, onTick: game.setTimerTimes, onPersist: game.persist });

    const highlights = useHighlights(game.snapshot.moveLog);
    const animation = useAnimation();
    const history = useHistory({
        modelRef: game.modelRef,
        persist: game.persist,
        syncFromModel: game.syncFromModel
    });
    const interaction = useInteraction({
        modelRef: game.modelRef,
        snapshot: game.snapshot,
        persist: game.persist,
        syncFromModel: game.syncFromModel,
        clearHighlights: highlights.clearHighlights,
        animation: {
            isAnimatingRef: animation.isAnimatingRef,
            animateMove: animation.animateMove
        }
    });

    const handleReset = () => {
        const current = game.modelRef.current;
        current.resetGame();
        current.startGame();
        game.persist();
        game.syncFromModel();
        interaction.clearSelection();
        highlights.clearHighlights();
    };

    const handleUndo = () => {
        history.undo();
        interaction.clearSelection();
        highlights.clearHighlights();
    };

    return (
        <div className="game-container">
            <div className="game-section">
                <TurnTimer
                    times={game.snapshot.timerTimes}
                    activePlayer={game.snapshot.currentPlayer}
                    winner={game.snapshot.winner}
                />
                <Board
                    grid={game.snapshot.boardState}
                    selected={interaction.selectedPiece}
                    validMoves={interaction.validMoves}
                    historyHighlight={highlights.historyHighlight}
                    mandatoryPieces={game.snapshot.mandatoryPieces}
                    onCellClick={interaction.handleCellClick}
                    onCellRef={animation.registerCellRef}
                    onPieceRef={animation.registerPieceRef}
                />
                <WinMessage winner={game.snapshot.winner} onRestart={handleReset} />
            </div>
            <aside className="game-sidebar">
                <GameInfo
                    currentTurn={game.snapshot.currentPlayer}
                    winner={game.snapshot.winner}
                    captured={game.snapshot.captured}
                />
                <div className="game-controls">
                    <ActionButton
                        text="Reset game"
                        onClick={() => {
                            if (window.confirm('Restart the game?')) {
                                handleReset();
                            }
                        }}
                    />
                    <ActionButton
                        text="Undo"
                        onClick={handleUndo}
                        disabled={game.snapshot.moveLog.length === 0}
                    />
                </div>
                <MoveHistory
                    moveLog={game.snapshot.moveLog}
                    activeIndex={highlights.historyIndex}
                    onSelect={highlights.selectHistory}
                />
            </aside>
        </div>
    );
}

export default Game;
