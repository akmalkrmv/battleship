import { User } from './user';

export enum GameState {
  preparing = 'preparing',
  playing = 'playing',
  finished = 'finished',
}

export enum MatchState {
  open,
  closed,
}

export interface Match {
  id: string;
  state: MatchState;
  creator?: User;
  opponent?: User;
}

export interface MatchMove {
  userId: string;
  fieldIndex: string;
}
