import { CSS } from '../../constants/constants.ts';
import type { Piece as PieceModel } from '../../models/Piece.ts';
import Piece from '../Piece/Piece.tsx';
import './Cell.css';

type CellProps = {
    isBlack: boolean;
    piece: PieceModel | null;
};

function Cell({ isBlack, piece }: CellProps) {
    const className = `${CSS.CELL} ${isBlack ? CSS.CELL_BLACK : CSS.CELL_WHITE}`;

    return (
        <div className={className}>
            {piece ? <Piece piece={piece} /> : null}
        </div>
    );
}

export default Cell;
