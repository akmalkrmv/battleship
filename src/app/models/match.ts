import { User } from './user';

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
