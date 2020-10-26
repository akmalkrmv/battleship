import { Ship, ShipType } from '@models/ship';

export const SHIPS: Ship[] = [
  new Ship(ShipType.carrier),
  new Ship(ShipType.battleship),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
];
