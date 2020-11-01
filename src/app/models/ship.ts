export enum Direction {
  horizontal = 'horizontal',
  vertical = 'vertical',
}

export enum ShipType {
  carrier = 5,
  battleship = 4,
  cruiser = 3,
  submarine = 2,
}

export class Ship {
  public uid: string;
  public name: string;
  public length: number;
  public hits: number = 0;
  public sunk: boolean;
  public direction = Direction.horizontal;

  public isStart: boolean = false;
  public isEnd: boolean = false;

  constructor(public type: ShipType) {
    this.uid = Math.random().toString();
    this.name = ShipType[type];
    this.length = type;
  }
}

export type ShipsMap = { [index: number]: Ship };

export interface ShipPlacement {
  created?: number;
  player: string;
  shipsMap: ShipsMap;
}
