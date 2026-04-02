import { PLAYERS } from '../constants/index.ts';
import type { GameCoreState, GameState } from '../types/game.ts';
import { createInitialBoard } from './board.ts';

export const createInitialGameState = (): GameState => ({
    board: createInitialBoard(),
    turn: PLAYERS.LIGHT,
    multiJump: null,
    timeoutWinner: null,
    selected: null
});

export const extractCoreState = (game: GameState): GameCoreState => ({
    board: game.board,
    turn: game.turn,
    multiJump: game.multiJump,
    timeoutWinner: game.timeoutWinner
});
