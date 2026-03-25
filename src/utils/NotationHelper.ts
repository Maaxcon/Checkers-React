import { BOARD } from '../constants/constants.ts';

export class NotationHelper {
    static toNotation(row: number, col: number): string {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const number = BOARD.ROWS - row; 
        return `${letters[col]}${number}`;
    }

    static formatMove(fromRow: number, fromCol: number, toRow: number, toCol: number, isCapture: boolean): string {
        const fromNotation = this.toNotation(fromRow, fromCol);
        const toNotation = this.toNotation(toRow, toCol);
        const separator = isCapture ? ' x ' : '-';
        
        return `${fromNotation}${separator}${toNotation}`;
    }
}
