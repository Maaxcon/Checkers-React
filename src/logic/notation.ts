import { BOARD } from '../constants/index.ts';
import type { Position } from '../types/game.ts';

export const toNotation = (row: number, col: number): string => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const number = BOARD.ROWS - row;
    return `${letters[col]}${number}`;
};

export const formatMove = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    isCapture: boolean
): string => {
    const fromNotation = toNotation(fromRow, fromCol);
    const toNotationValue = toNotation(toRow, toCol);
    const separator = isCapture ? ' x ' : '-';
    return `${fromNotation}${separator}${toNotationValue}`;
};

export const appendCaptureNotation = (notation: string, to: Position): string =>
    `${notation}x${toNotation(to.row, to.col)}`;
