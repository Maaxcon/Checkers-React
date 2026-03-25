import { GAME_SETTINGS } from '../constants/constants.ts';

export class AnimationHelper {
    static movePiece(piece: HTMLElement, endCell: HTMLElement, onComplete: () => void): void {
        const startRect = piece.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();

        const deltaX = endRect.left - startRect.left + (endRect.width - startRect.width) / 2;
        const deltaY = endRect.top - startRect.top + (endRect.height - startRect.height) / 2;

        piece.style.transition = `transform ${GAME_SETTINGS.ANIMATION_DURATION_MS}ms ease-in-out`;
        piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        piece.style.zIndex = GAME_SETTINGS.ANIMATION_Z_INDEX;

        
        piece.addEventListener('transitionend', () => {
            piece.style.transition = '';
            piece.style.transform = '';
            piece.style.zIndex = '';
            onComplete();
        }, {once: true});
    }
}
