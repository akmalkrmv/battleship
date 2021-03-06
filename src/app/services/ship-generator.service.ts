import { Injectable } from '@angular/core';
import { ROW_RANGE, FIELD_RANGE } from '@constants/fields';
import { SHIPS } from '@constants/ships';
import { Direction, Ship, ShipsMap } from '@models/ship';
import { Field } from '@models/field';

// helper functions
const getRandomPostion = (): number => Math.floor(Math.random() * FIELD_RANGE);
const getRandomDirection = (): Direction =>
  Math.random() < 0.5 ? Direction.horizontal : Direction.vertical;

const getRow = (position: number): number => Math.floor(position / ROW_RANGE);
const getStep = (direction: Direction): number =>
  direction === Direction.horizontal ? 1 : ROW_RANGE;

const isTaken = (number: Ship): boolean =>
  number != undefined && number != null;

const isOutOfRange = (index: number): boolean => index >= FIELD_RANGE;
const isOutOfRowRange = (index: number, row: number): boolean =>
  Math.floor(index / ROW_RANGE) != row;

@Injectable({ providedIn: 'root' })
export class ShipGenerator {
  public static createEmptyShipCollection(): Ship[] {
    return Array.from({ length: FIELD_RANGE }, () => null);
  }

  public static createEmptyBattlefield(): Field[] {
    return Array.from({ length: FIELD_RANGE }, (_, k) => new Field(k, null));
  }

  public static wrapWithFields(ships: Ship[]): Field[] {
    return ships.map((ship, index) => new Field(index, ship));
  }

  public static convertToMap(ships: Ship[]): ShipsMap {
    return ships.reduce((map, ship, index) => {
      if (ship) map[index] = ship;
      return map;
    }, {});
  }

  public static placeRandomShips(collection?: Ship[]): Ship[] {
    collection = collection
      ? [...collection]
      : this.createEmptyShipCollection();

    SHIPS.forEach((ship: Ship) => {
      const direction = getRandomDirection();
      const shipCopy = { ...ship, direction };

      this.tryPlaceShip(collection, shipCopy);
    });

    return collection;
  }

  private static tryPlaceShip(collection: Ship[], ship: Ship) {
    let trycount = 0;

    while (++trycount < 1000) {
      const position = getRandomPostion();
      const canPlaceShip = this.canPlaceShip(collection, position, ship);

      if (canPlaceShip) {
        this.placeShip(collection, position, ship);
        return;
      }
    }
  }

  private static canPlaceShip(
    collection: Ship[],
    position: number,
    ship: Ship
  ) {
    const shipRange = this.getShipRange(position, ship);

    return shipRange.every((index) => {
      // already has ship
      if (isTaken(collection[index])) {
        return false;
      }

      // out of range
      if (isOutOfRange(index)) {
        return false;
      }

      // out of row range
      if (ship.direction === Direction.horizontal) {
        if (isOutOfRowRange(index, getRow(position))) {
          return false;
        }
      }

      return true;
    });
  }

  private static placeShip(collection: Ship[], position: number, ship: Ship) {
    const step = getStep(ship.direction);

    for (let i = 0; i < ship.length; i++) {
      const index = position + i * step;
      const isStart = i === 0;
      const isEnd = i === ship.length - 1;

      collection[index] = { ...ship, isStart, isEnd };
    }
  }

  private static getShipRange(position: number, ship: Ship): number[] {
    const range = [];
    const step = getStep(ship.direction);

    for (let i = 0; i < ship.length; i++) {
      const index = position + i * step;
      range.push(index);
    }

    return range;
  }
}
