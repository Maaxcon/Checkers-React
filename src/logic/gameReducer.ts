import type { Player } from '../constants/index.ts';
import type {
    GameState,
    HistoryEntry,
    Move,
    Position,
    TimerState
} from '../types/game.ts';
import { applyMove } from './applyMove.ts';
import { cloneBoard } from './board.ts';
import { createInitialGameState, extractCoreState } from './gameState.ts';

export type GameAction =
    | { type: 'SELECT'; position: Position | null }
    | { type: 'APPLY_MOVE'; from: Position; move: Move; timer: TimerState }
    | { type: 'UNDO' }
    | { type: 'RESET' }
    | { type: 'SET_WINNER'; winner: Player };

const cloneMoveLog = (moveLog: GameState['moveLog']): GameState['moveLog'] =>
    moveLog.map(entry => ({
        notation: entry.notation,
        from: { ...entry.from },
        to: { ...entry.to }
    }));

const createHistoryEntry = (state: GameState, timer: TimerState): HistoryEntry => ({
    game: {
        ...extractCoreState(state),
        board: cloneBoard(state.board)
    },
    moveLog: cloneMoveLog(state.moveLog),
    timer: { ...timer }
});

export const gameReducer = (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
        case 'SELECT':
            return {
                ...state,
                selected: action.position
            };
        case 'APPLY_MOVE': {
            if (state.winner) return state;

            const shouldRecordHistory = state.multiJump === null;
            const history = shouldRecordHistory
                ? [...state.history, createHistoryEntry(state, action.timer)]
                : state.history;

            const result = applyMove(
                extractCoreState(state),
                state.moveLog,
                action.from,
                action.move
            );

            const selected = result.state.multiJump
                ? { row: action.move.row, col: action.move.col }
                : null;

            return {
                ...state,
                ...result.state,
                moveLog: result.moveLog,
                history,
                selected
            };
        }
        case 'UNDO': {
            if (state.history.length === 0) return state;
            const last = state.history[state.history.length - 1];
            return {
                ...state,
                ...last.game,
                moveLog: last.moveLog,
                history: state.history.slice(0, -1),
                selected: null
            };
        }
        case 'RESET':
            return createInitialGameState();
        case 'SET_WINNER':
            return {
                ...state,
                winner: action.winner,
                multiJump: null,
                selected: null
            };
        default:
            return state;
    }
};
