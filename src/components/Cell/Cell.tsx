import { CSS } from '../../constants/index.ts';
import { useCallback } from 'react';
import type { Piece as PieceModel } from '../../models/Piece.ts';
import Piece from '../Piece/Piece.tsx';
import './Cell.css';

type CellProps = {
    row: number;
    col: number;
    isBlack: boolean;
    piece: PieceModel | null;
    isSelected: boolean;
    isHighlighted: boolean;
    isHistoryHighlight: boolean;
    isMandatory: boolean;
    onClick: () => void;
    onCellRef: (row: number, col: number, el: HTMLDivElement | null) => void;
    onPieceRef: (row: number, col: number, el: HTMLDivElement | null) => void;
};

function Cell({
    row,
    col,
    isBlack,
    piece,
    isSelected,
    isHighlighted,
    isHistoryHighlight,
    isMandatory,
    onClick,
    onCellRef,
    onPieceRef
}: CellProps) {
    const className = [
        CSS.CELL,
        isBlack ? CSS.CELL_BLACK : CSS.CELL_WHITE,
        isSelected ? CSS.SELECTED : '',
        isHighlighted ? CSS.HIGHLIGHT : '',
        isHistoryHighlight ? 'is-history-highlight' : '',
        isMandatory ? 'is-mandatory' : ''
    ].filter(Boolean).join(' ');

    const setCellRef = useCallback((el: HTMLDivElement | null) => {
        onCellRef(row, col, el);
    }, [col, onCellRef, row]);

    const setPieceRef = useCallback((el: HTMLDivElement | null) => {
        onPieceRef(row, col, el);
    }, [col, onPieceRef, row]);

    return (
        <div
            className={className}
            role="gridcell"
            onClick={onClick}
            ref={setCellRef}
        >
            {piece ? <Piece piece={piece} elementRef={setPieceRef} /> : null}
        </div>
    );
}

export default Cell;
