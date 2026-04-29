import React, { useMemo } from 'react';
import type { Board, HistoryHighlight, Move, Position } from '../../types/game.ts';
import { CSS } from '../../constants/index.ts';
import Cell from '../Cell/Cell.tsx';
import './Board.css';

type BoardProps = {
    grid: Board;
    selected: Position | null;
    validMoves: Move[];
    historyHighlight: HistoryHighlight | null;
    mandatoryPieces: Position[];
    onCellClick: (row: number, col: number) => void;
    lastMove: { from: Position; to: Position } | null;
};

function Board({
    grid,
    selected,
    validMoves,
    historyHighlight,
    mandatoryPieces,
    onCellClick,
    lastMove
}: BoardProps) {
    const validMoveKeys = useMemo(
        () => new Set(validMoves.map(move => `${move.row}-${move.col}`)),
        [validMoves]
    );
    const historyKeys = useMemo(
        () => new Set(
            historyHighlight
                ? [`${historyHighlight.from.row}-${historyHighlight.from.col}`, `${historyHighlight.to.row}-${historyHighlight.to.col}`]
                : []
        ),
        [historyHighlight]
    );
    const mandatoryKeys = useMemo(
        () => new Set(mandatoryPieces.map(piece => `${piece.row}-${piece.col}`)),
        [mandatoryPieces]
    );

    const animatedFrom = lastMove?.from ?? null;
    const animatedTo = lastMove?.to ?? null;

    return (
        <div className={CSS.BOARD} role="grid" aria-label="Checkers board">
            {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                    const isAnimatedCell =
                        animatedTo?.row === rowIndex && animatedTo?.col === colIndex;

                    return (
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
                            onCellClick={onCellClick}
                            moveFrom={isAnimatedCell ? animatedFrom : null}
                        />
                    );
                })
            )}
        </div>
    );
}

export default React.memo(Board);
