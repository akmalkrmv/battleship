import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Ship, Direction, ShipType } from './models/ship';

export const FIELD_LENGTH = 10;
export const SHIPS: Ship[] = [
  new Ship(ShipType.carrier),
  new Ship(ShipType.battleship),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.cruiser),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
  new Ship(ShipType.submarine),
];

export class Field {
  public hit: boolean;
  public sunk: boolean;
  constructor(public ship?: Ship) {}
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  battlefield: Field[] = [];
  opponentfield: Field[] = [];
  opponentType: 'pc' | 'player' = 'pc';
  current = true;

  ngOnInit() {
    this.randomize();

    if (this.opponentType == 'pc') {
      this.placeShips(this.opponentfield);
    }
  }

  public randomize() {
    this.placeShips(this.battlefield);
  }

  public fire(field: Field) {
    field.hit = true;
    this.current = !this.current;
    if (!this.current) {
      let random = -1;
      while (
        this.opponentfield[random] != null &&
        this.opponentfield[random].hit == false
      ) {
        random = Math.floor(Math.random() * this.opponentfield.length);
      }
    }
  }

  public onDrop($event) {
    $event.preventDefault();
    console.log($event);
  }

  public onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
  }

  private clearField(field: Field[]) {
    for (let i = 0; i < FIELD_LENGTH * FIELD_LENGTH; i++) {
      field[i] = new Field();
    }
  }

  private placeShips(field: Field[]) {
    this.clearField(field);

    SHIPS.forEach((ship) => {
      const rotate = Math.random() < 0.5;
      const direction = rotate ? Direction.horizontal : Direction.vertical;
      this.placeShip(field, { ...ship, direction });
    });

    console.log(field);
  }

  private placeShip(field: Field[], ship: Ship) {
    const range = field.length;
    const { direction, length } = ship;

    while (true) {
      const random = Math.floor(Math.random() * range);
      const row = Math.floor(random / FIELD_LENGTH);
      const isHorizontal = direction === Direction.horizontal;
      const step = isHorizontal ? 1 : FIELD_LENGTH;

      let isValidPlace = true;

      // validate
      for (let i = 0; i < length; i++) {
        const index = random + i * step;

        if (index >= range) {
          isValidPlace = false;
          break;
        }

        if (field[index] != null && field[index].ship != null) {
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

          field[index] = new Field({
            ...ship,
            isStart: i == 0,
            isEnd: i == length - 1,
          });
        }

        return true;
      }
    }
  }
}
