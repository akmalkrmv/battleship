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
  public direction = Direction.horizontal;
  public isStart: boolean;
  public isEnd: boolean;

  constructor(public type: ShipType) {
    this.name = ShipType[type];
    this.length = type;
  }
}
