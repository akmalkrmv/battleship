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
  creator?: User;
  opponent?: User;
}

export interface Move {
  userId: string;
  data: any;
}
