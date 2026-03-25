import { useState } from 'react';
import './Game.css';
import Board from './components/Board/Board.tsx';
import { CheckersModel } from './models/CheckersModel.ts';

function Game() {
    const [model] = useState(() => new CheckersModel());

    return (
        <div className="game-container">
            <div className="game-section">
                <Board grid={model.board} />
            </div>
        </div>
    );
}

export default Game;
