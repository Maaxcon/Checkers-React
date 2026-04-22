import { PLAYERS } from '../constants/index.ts';
import type { GameState } from '../types/game.ts';
import { createInitialBoard } from './board.ts';

export const createInitialGameState = (): GameState => ({
    board: createInitialBoard(),
    turn: PLAYERS.LIGHT,
    multiJump: null,
    serverWinner: null,
    selected: null,
    lastMove: null
});
