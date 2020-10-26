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
  public name: string;
  public length: number;
  public hits: number = 0;
  public sunk: boolean;
  public direction = Direction.horizontal;

  public isStart: boolean = false;
  public isEnd: boolean = false;

  constructor(public type: ShipType) {
    this.name = ShipType[type];
    this.length = type;
  }
}

export class Field {
  public hit: boolean;
  public sunk: boolean;

  constructor(public index: number, public ship?: Ship) {}
}
