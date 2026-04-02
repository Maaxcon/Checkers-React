import type { Player } from '../constants/index.ts';
import type { GameCoreState, GameState, Position } from '../types/game.ts';
import { createInitialGameState } from './gameState.ts';

export type GameAction =
    | { type: 'SELECT'; position: Position | null }
    | { type: 'APPLY_MOVE'; game: GameCoreState; selected: Position | null }
    | { type: 'UNDO'; game: GameCoreState }
    | { type: 'RESET' }
    | { type: 'SET_TIMEOUT_WINNER'; winner: Player };

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
                selected: action.selected
            };
        case 'UNDO':
            return {
                ...state,
                ...action.game,
                selected: null
            };
        case 'RESET':
            return createInitialGameState();
        case 'SET_TIMEOUT_WINNER':
            return {
                ...state,
                timeoutWinner: action.winner,
                multiJump: null,
                selected: null
            };
        default:
            return state;
    }
};
