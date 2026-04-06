import { PLAYERS } from '../constants/index.ts';
import type { Player } from '../constants/index.ts';

export const getPlayerLabel = (player: Player): string =>
    player === PLAYERS.LIGHT ? 'Light' : 'Dark';
