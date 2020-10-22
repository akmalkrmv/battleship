import { User } from './user';

export interface Match {
  id: string;
  creator?: User;
  opponent?: User;
}
