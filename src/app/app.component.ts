import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ship, Direction, ShipType, Field } from './models/ship';

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

export class Player {
  public ships: Ship[] = [];
  public battlefield: Field[] = [];
  constructor(public name: string, public isComputer = false) {}
}

export enum GameState {
  preparing = 'preparing',
  playing = 'playing',
  finished = 'finished',
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public loading$ = new BehaviorSubject<boolean>(false);
  public state: GameState = GameState.preparing;
  public players: Player[] = [];
  public current: Player;
  public user: Player;
  public opponent: Player;
  public winner: Player;

  constructor(private changeDetector: ChangeDetectorRef) {}

  ngOnInit() {
    this.user = new Player('Player');
    this.opponent = new Player('PC', true);
    this.players = [this.user, this.opponent];
    this.current = this.user;

    this.prepare();
  }

  public prepare() {
    for (const player of this.players) {
      this.placeShips(player.battlefield);
    }
  }

  public start() {
    this.state = GameState.playing;
    this.current = this.user;
  }
  public resign() {
    this.winner = this.opponent;
    this.state = GameState.finished;
  }
  public restart() {
    this.winner = null;
    this.state = GameState.preparing;
    this.prepare();
  }

  public randomize() {
    this.placeShips(this.user.battlefield);
  }

  public fire(field: Field) {
    if (this.state !== GameState.playing) return;
    if (field.hit) return;

    field.hit = true;

    if (field.ship) {
      field.ship.hits++;
      field.sunk = field.ship.sunk = field.ship.hits === field.ship.length;

      if ((this.winner = this.isGameOver())) {
        this.state = GameState.finished;
        return;
      }
    } else {
      this.nextPlayer();
    }

    if (this.current.isComputer) {
      let random = this.getRandomField(this.user.battlefield);
      if (random) {
        setTimeout(() => {
          this.fire(random);
          this.changeDetector.detectChanges();
        }, 1000);
      }
    }
  }

  private nextPlayer() {
    const index = this.players.findIndex((player) => player === this.current);
    const nextIndex = (index + 1) % this.players.length;

    this.current = this.players[nextIndex];
  }

  private getRandomField(fields: Field[]): Field {
    const nothit = fields.filter((field) => field && !field.hit);
    const random = Math.floor(Math.random() * nothit.length);

    return nothit[random];
  }

  private isGameOver(): Player {
    const isAllSunk = (player: Player) => {
      return player.battlefield
        .filter((field) => field.ship)
        .every((field) => field.ship.sunk);
    };

    if (isAllSunk(this.user)) {
      return this.opponent;
    }

    if (isAllSunk(this.opponent)) {
      return this.user;
    }

    return null;
  }

  public onDrop($event) {
    $event.preventDefault();
  }
  public onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
  }

  private clearFields(fields: Field[]) {
    for (let i = 0; i < FIELD_LENGTH * FIELD_LENGTH; i++) {
      fields[i] = new Field();
    }
  }

  private placeShips(field: Field[]) {
    this.loading$.next(true);

    setTimeout(() => {
      this.clearFields(field);

      SHIPS.forEach((ship) => {
        const rotate = Math.random() < 0.5;
        const direction = rotate ? Direction.horizontal : Direction.vertical;
        this.placeShip(field, { ...ship, direction });
      });

      this.loading$.next(false);
    });
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
          const isStart = i == 0;
          const isEnd = i == length - 1;

          field[index] = new Field(ship, isStart, isEnd);
        }

        return true;
      }
    }
  }
}
