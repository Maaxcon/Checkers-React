import { CSS } from '../../constants/index.ts';
import React, { useCallback } from 'react';
import { GAME_SETTINGS } from '../../constants/index.ts';
import type { Position } from '../../types/game.ts';
import type { Piece as PieceModel } from '../../types/game.ts';
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
    onCellClick: (row: number, col: number) => void;
    moveFrom: Position | null;
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
    onCellClick,
    moveFrom
}: CellProps) {
    const className = [
        CSS.CELL,
        isBlack ? CSS.CELL_BLACK : CSS.CELL_WHITE,
        isSelected ? CSS.SELECTED : '',
        isHighlighted ? CSS.HIGHLIGHT : '',
        isHistoryHighlight ? CSS.HISTORY_HIGHLIGHT : '',
        isMandatory ? CSS.MANDATORY : ''
    ].filter(Boolean).join(' ');

    const handleClick = useCallback(() => {
        onCellClick(row, col);
    }, [col, onCellClick, row]);

    const moveStyle = moveFrom
        ? ({
            '--move-x': `calc(var(--square-size) * ${moveFrom.col - col})`,
            '--move-y': `calc(var(--square-size) * ${moveFrom.row - row})`,
            '--move-duration': `${GAME_SETTINGS.ANIMATION_DURATION_MS}ms`
        } as React.CSSProperties)
        : undefined;

    return (
        <div
            className={className}
            role="gridcell"
            onClick={handleClick}
        >
            {piece ? <Piece piece={piece} moveStyle={moveStyle} isMoving={Boolean(moveFrom)} /> : null}
        </div>
    );
}

export default React.memo(Cell);
