import { Ship, ShipsMap } from './ship';

export class Field {
  public hit: boolean;
  public sunk: boolean;

  constructor(public index: number, public ship?: Ship) {}
}
