import type { Player } from '../constants/index.ts';
import type { GameCoreState, GameState, LastMove, Position } from '../types/game.ts';
import { createInitialGameState } from './gameState.ts';

export type GameAction =
    | { type: 'SELECT'; position: Position | null }
    | { type: 'APPLY_MOVE'; game: GameCoreState; selected: Position | null; lastMove: LastMove }
    | { type: 'UNDO'; game: GameCoreState }
    | { type: 'CLEAR_LAST_MOVE' }
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
                selected: action.selected,
                lastMove: action.lastMove
            };
        case 'UNDO':
            return {
                ...state,
                ...action.game,
                selected: null,
                lastMove: null
            };
        case 'CLEAR_LAST_MOVE':
            return {
                ...state,
                lastMove: null
            };
        case 'RESET':
            return createInitialGameState();
        case 'SET_TIMEOUT_WINNER':
            return {
                ...state,
                timeoutWinner: action.winner,
                multiJump: null,
                selected: null,
                lastMove: null
            };
        default:
            return state;
    }
};
