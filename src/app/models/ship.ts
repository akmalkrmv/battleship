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

  constructor(public type: ShipType) {
    this.name = ShipType[type];
    this.length = type;
  }
}

export class Field {
  public hit: boolean;
  public sunk: boolean;

  constructor(
    public index: number,
    public ship?: Ship,
    public isStart: boolean = false,
    public isEnd: boolean = false
  ) {}
}

export const SHIPS: Ship[] = [
  new Ship(ShipType.carrier),
  new Ship(ShipType.battleship),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
];
