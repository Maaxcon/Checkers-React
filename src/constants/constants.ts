export const BOARD = {
    ROWS: 8,
    COLS: 8,
    TOP_ROW: 0,
    get BOTTOM_ROW() { return this.ROWS - 1; },
    get PIECE_ROWS() {
        return Math.floor((this.ROWS - 2) / 2);
    }
} as const;

export const PLAYERS = {
    LIGHT: 1,
    DARK: 2,
} as const;

export const CSS = {
    BOARD: 'board',
    CELL: 'board__cell',
    CELL_BLACK: 'board__cell--black',
    CELL_WHITE: 'board__cell--white',
    CHECKER: 'checker',
    CHECKER_LIGHT: 'checker--light',
    CHECKER_DARK: 'checker--dark',
    CHECKER_KING: 'checker--king',
    SELECTED: 'is-selected',
    HIGHLIGHT: 'is-highlighted'
} as const;

export const DIRECTIONS = {
    UP: -1,
    DOWN: 1
} as const;

export const GAME_SETTINGS = {
    JUMP_DISTANCE: 2,
    ANIMATION_DURATION_MS: 400,
    ANIMATION_Z_INDEX: '1000',
    STORAGE_KEY: 'checkers_save',
    INITIAL_TIME_SECONDS: 300,
} as const;

export const GAME_RESULTS = {
    TIMEOUT: 'TIMEOUT',
} as const;

export type Player = typeof PLAYERS[keyof typeof PLAYERS];
export type Direction = typeof DIRECTIONS[keyof typeof DIRECTIONS];
export type GameResult = typeof GAME_RESULTS[keyof typeof GAME_RESULTS];

