import type { BoardGrid } from '../../types/types.ts';
import { CSS } from '../../constants/constants.ts';
import Cell from '../Cell/Cell.tsx';
import './Board.css';

type BoardProps = {
    grid: BoardGrid;
};

function Board({ grid }: BoardProps) {
    return (
        <div className={CSS.BOARD} role="grid" aria-label="Checkers board">
            {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                    <Cell
                        key={`${rowIndex}-${colIndex}`}
                        isBlack={(rowIndex + colIndex) % 2 !== 0}
                        piece={piece}
                    />
                ))
            )}
        </div>
    );
}

export default Board;
