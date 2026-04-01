import { PLAYERS } from '../constants/index.ts';
import type { GameCoreState, GameState } from '../types/game.ts';
import { createInitialBoard } from './board.ts';

export const createInitialGameState = (): GameState => ({
    board: createInitialBoard(),
    turn: PLAYERS.LIGHT,
    winner: null,
    multiJump: null,
    selected: null,
    moveLog: [],
    history: []
});

export const extractCoreState = (game: GameState): GameCoreState => ({
    board: game.board,
    turn: game.turn,
    winner: game.winner,
    multiJump: game.multiJump
});
