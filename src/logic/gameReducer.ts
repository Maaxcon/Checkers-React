import type { GameCoreState, GameState, LastMove, Position } from '../types/game.ts';

export type GameAction =
    | { type: 'SELECT'; position: Position | null }
    | { type: 'APPLY_MOVE'; game: GameCoreState; selected: Position | null; lastMove: LastMove | null }
    | { type: 'CLEAR_LAST_MOVE' };

export const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'SELECT':
            return {
                ...state,
                selected: action.position
            };
        case 'APPLY_MOVE':
            return {
                ...state,
                ...action.game,
                selected: action.selected,
                lastMove: action.lastMove
            };
        case 'CLEAR_LAST_MOVE':
            return {
                ...state,
                lastMove: null
            };
        default:
            return state;
    }
};
