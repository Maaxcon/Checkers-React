import type { BoardGrid, HistoryHighlight, Move, Position } from '../../types/types.ts';
import { CSS } from '../../constants/index.ts';
import Cell from '../Cell/Cell.tsx';
import './Board.css';

type BoardProps = {
    grid: BoardGrid;
    selected: Position | null;
    validMoves: Move[];
    historyHighlight: HistoryHighlight | null;
    mandatoryPieces: Position[];
    onCellClick: (row: number, col: number) => void;
    onCellRef: (row: number, col: number, el: HTMLDivElement | null) => void;
    onPieceRef: (row: number, col: number, el: HTMLDivElement | null) => void;
};

function Board({
    grid,
    selected,
    validMoves,
    historyHighlight,
    mandatoryPieces,
    onCellClick,
    onCellRef,
    onPieceRef
}: BoardProps) {
    const validMoveKeys = new Set(validMoves.map(move => `${move.row}-${move.col}`));
    const historyKeys = new Set(
        historyHighlight
            ? [`${historyHighlight.from.row}-${historyHighlight.from.col}`, `${historyHighlight.to.row}-${historyHighlight.to.col}`]
            : []
    );
    const mandatoryKeys = new Set(mandatoryPieces.map(piece => `${piece.row}-${piece.col}`));

    return (
        <div className={CSS.BOARD} role="grid" aria-label="Checkers board">
            {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                    <Cell
                        key={`${rowIndex}-${colIndex}`}
                        row={rowIndex}
                        col={colIndex}
                        isBlack={(rowIndex + colIndex) % 2 !== 0}
                        piece={piece}
                        isSelected={selected?.row === rowIndex && selected?.col === colIndex}
                        isHighlighted={validMoveKeys.has(`${rowIndex}-${colIndex}`)}
                        isHistoryHighlight={historyKeys.has(`${rowIndex}-${colIndex}`)}
                        isMandatory={mandatoryKeys.has(`${rowIndex}-${colIndex}`)}
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        onCellRef={onCellRef}
                        onPieceRef={onPieceRef}
                    />
                ))
            )}
        </div>
    );
}

export default Board;
