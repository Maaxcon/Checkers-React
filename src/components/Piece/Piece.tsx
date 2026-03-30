import { CSS } from '../../constants/index.ts';
import type { Piece as PieceModel } from '../../models/Piece.ts';
import './Piece.css';

type PieceProps = {
    piece: PieceModel;
    elementRef?: (el: HTMLDivElement | null) => void;
};

function Piece({ piece, elementRef }: PieceProps) {
    const className = [
        CSS.CHECKER,
        piece.isLight ? CSS.CHECKER_LIGHT : CSS.CHECKER_DARK,
        piece.isKing ? CSS.CHECKER_KING : ''
    ].filter(Boolean).join(' ');
    
    return <div className={className} ref={elementRef} />;
}

export default Piece;
