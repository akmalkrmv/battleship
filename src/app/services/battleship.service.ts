import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Direction, Field, Ship, SHIPS } from '../models/ship';

export const FIELD_LENGTH = 10;
export const FIELD_RANGE = FIELD_LENGTH * FIELD_LENGTH;

@Injectable({ providedIn: 'root' })
export class BattleshipService {
  public loading$ = new BehaviorSubject<boolean>(false);
  public fired$ = new EventEmitter();

  public createBattlefield(): Field[] {
    const fields = [];

    for (let i = 0; i < FIELD_RANGE; i++) {
      fields[i] = new Field(i);
    }

    return fields;
  }

  public async placeShips(): Promise<Field[]> {
    console.log('placing ships');
    this.loading$.next(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const fields = this.createBattlefield();

        SHIPS.forEach((ship) => {
          const rotate = Math.random() < 0.5;
          const direction = rotate ? Direction.horizontal : Direction.vertical;
          console.log('placing ship: ', ship.name);
          this.placeShip(fields, { ...ship, direction });
        });

        this.loading$.next(false);
        resolve(fields);
      });
    });
  }

  public placeShip(fields: Field[], ship: Ship) {
    const { direction, length } = ship;

    while (true) {
      const random = Math.floor(Math.random() * FIELD_RANGE);
      const row = Math.floor(random / FIELD_LENGTH);
      const isHorizontal = direction === Direction.horizontal;
      const step = isHorizontal ? 1 : FIELD_LENGTH;

      let isValidPlace = true;

      // validate
      for (let i = 0; i < length; i++) {
        const index = random + i * step;

        if (index >= FIELD_RANGE) {
          isValidPlace = false;
          break;
        }

        if (fields[index] != null && fields[index].ship != null) {
          isValidPlace = false;
          break;
        }

        if (isHorizontal) {
          if (Math.floor(index / FIELD_LENGTH) != row) {
            isValidPlace = false;
            break;
          }
        }
      }

      // place
      if (isValidPlace) {
        for (let i = 0; i < length; i++) {
          const index = random + i * step;
          const isStart = i == 0;
          const isEnd = i == length - 1;

          fields[index] = new Field(index, ship, isStart, isEnd);
        }

        return true;
      }
    }
  }

  public getRandomField(fields: Field[]): Field {
    const nothit = fields.filter((field) => field && !field.hit);
    const random = Math.floor(Math.random() * nothit.length);

    return nothit[random];
  }
}
