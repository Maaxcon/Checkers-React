import { CSS, PLAYERS } from '../../constants/index.ts';
import React from 'react';
import type { Piece as PieceModel } from '../../types/game.ts';
import './Piece.css';

type PieceProps = {
    piece: PieceModel;
    moveStyle?: React.CSSProperties;
    isMoving?: boolean;
};

function Piece({ piece, moveStyle, isMoving = false }: PieceProps) {
    const className = [
        CSS.CHECKER,
        piece.player === PLAYERS.LIGHT ? CSS.CHECKER_LIGHT : CSS.CHECKER_DARK,
        piece.isKing ? CSS.CHECKER_KING : '',
        isMoving ? 'checker--move' : ''
    ].filter(Boolean).join(' ');
    
    return <div className={className} style={moveStyle} />;
}

export default React.memo(Piece);
