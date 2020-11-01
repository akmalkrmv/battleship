import { User } from './user';

export enum GameState {
  open = 'open',
  waiting = 'waiting',
  preparing = 'preparing',
  playing = 'playing',
  finished = 'finished',
  closed = 'closed',
}

export interface Match {
  id: string;
  state: GameState;
  game?: number;
  readyState?: object;
  winner?: string;
  current?: string;
  creator?: User;
  opponent?: User;
  exists?: boolean;
}

export interface Move {
  player: string;
  index: number;
}

