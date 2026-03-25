import { CSS } from '../../constants/constants.ts';
import type { Piece as PieceModel } from '../../models/Piece.ts';
import './Piece.css';

type PieceProps = {
    piece: PieceModel;
};

function Piece({ piece }: PieceProps) {
    const className = [
        CSS.CHECKER,
        piece.isLight ? CSS.CHECKER_LIGHT : CSS.CHECKER_DARK,
        piece.isKing ? CSS.CHECKER_KING : ''
    ].filter(Boolean).join(' ');
    
    return <div className={className} />;
}

export default Piece;
