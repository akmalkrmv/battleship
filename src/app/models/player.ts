import { Field, Ship } from './ship';

export class Player {
  public id: string;
  public ships: Ship[] = [];
  public battlefield: Field[] = [];

  constructor(public name: string, public isComputer = false) {}
}
