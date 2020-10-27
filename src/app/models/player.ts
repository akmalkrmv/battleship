import { Field, FieldJSON } from './field';
import { User } from './user';

export class Player {
  public uid: string;
  public photoURL?: string;
  public displayName: string;
  public battlefield: Field[] = [];
  public ships: FieldJSON = {};
  public isComputer = false;

  constructor() {}

  public static create(user: User) {
    if (!user) return this.empty();

    const player = new Player();
    player.uid = user.uid;
    player.photoURL = user.photoURL;
    player.displayName = user.displayName;
    return player;
  }

  public static empty(): Player {
    const player = new Player();
    player.displayName = 'Waiting..';
    return player;
  }

  public static computer(): Player {
    const player = new Player();
    player.displayName = 'PC';
    player.isComputer = true;
    return player;
  }
}
