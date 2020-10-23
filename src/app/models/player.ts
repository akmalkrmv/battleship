import { Field, Ship } from './ship';

export class Player {
  public id: string;
  public ships: Ship[] = [];
  public battlefield: Field[] = [];

  constructor(public displayName: string, public isComputer = false) {}
}
