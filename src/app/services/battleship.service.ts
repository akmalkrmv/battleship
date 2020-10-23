import { EventEmitter, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { Direction, Field, Ship, SHIPS } from '../models/ship';
import { GameState, Match } from '../models/match';
import { MatchService } from './match.service';
import { filter } from 'rxjs/operators';
import { Player } from '../models/player';

export const FIELD_LENGTH = 10;
export const FIELD_RANGE = FIELD_LENGTH * FIELD_LENGTH;

@Injectable({ providedIn: 'root' })
export class BattleshipService {
  public loading$ = new BehaviorSubject(false);

  public user$ = new BehaviorSubject<Player>(null);
  public opponent$ = new BehaviorSubject<Player>(null);
  public current$ = new BehaviorSubject<Player>(null);
  public winner$ = new BehaviorSubject<Player>(null);

  public match$ = new BehaviorSubject<Match>(null);
  public state$ = new BehaviorSubject(GameState.preparing);
  public fired$ = new EventEmitter();

  private players: Player[] = [];
  private user: Player = null;
  private opponent: Player = null;
  private current: Player = null;
  private winner: Player = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private matchService: MatchService
  ) {}

  public init() {
    this.activatedRoute.paramMap
      .pipe(filter((params) => !!params.get('id')))
      .subscribe(async (params) => {
        this.loading$.next(true);
        this.matchService.matchChanged(params.get('id')).subscribe((match) => {
          if (!match) {
            return this.router.navigate(['/']);
          }

          this.match$.next(match);
          this.user$.next(new Player(match.creator.displayName));
          this.opponent$.next(new Player('waiting..'));
          this.players = [this.user$.value, this.opponent$.value];
          this.current$.next(this.user$.value);
          this.loading$.next(false);

          if (match.opponent) {
            this.loading$.next(true);
            this.opponent$.next(new Player(match.opponent.displayName));
            this.players = [this.user$.value, this.opponent$.value];

            this.prepare();
            this.loading$.next(false);
          }
        });
      });
  }

  public start() {
    this.state$.next(GameState.playing);
    this.current$.next(this.user);
  }
  public resign() {
    this.winner$.next(this.opponent);
    this.state$.next(GameState.finished);
  }
  public restart() {
    this.winner$.next(null);
    this.state$.next(GameState.preparing);
    this.prepare();
  }

  public createBattlefield(): Field[] {
    const fields = [];

    for (let i = 0; i < FIELD_RANGE; i++) {
      fields[i] = new Field(i);
    }

    return fields;
  }

  public async placeShips(): Promise<Field[]> {
    this.loading$.next(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const fields = this.createBattlefield();

        SHIPS.forEach((ship) => {
          const rotate = Math.random() < 0.5;
          const direction = rotate ? Direction.horizontal : Direction.vertical;
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

  public fire(field: Field) {
    if (this.state$.value !== GameState.playing) return;
    if (field.hit) return;

    field.hit = true;
    this.fired$.emit();

    const { ship } = field;

    if (ship) {
      ship.hits++;
      field.sunk = ship.sunk = ship.hits === ship.length;
    } else {
      this.nextPlayer();
    }

    if ((this.winner = this.isGameOver())) {
      this.state$.next(GameState.finished);
      return;
    }

    if (this.current.isComputer) {
      let random = this.getRandomField(this.user.battlefield);
      if (random) {
        setTimeout(() => this.fire(random), 500);
      }
    }
  }

  private nextPlayer() {
    const index = this.players.findIndex((player) => player === this.current);
    const nextIndex = (index + 1) % this.players.length;

    this.current = this.players[nextIndex];
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

  public async prepare() {
    this.user.battlefield = await this.placeShips();
    // this.matchService.sendShips(
    //   this.match.id,
    //   this.user.id,
    //   this.user.battlefield
    // );

    if (this.opponent.isComputer) {
      this.opponent.battlefield = await this.placeShips();
    }
  }

  public async randomize() {
    this.user.battlefield = await this.placeShips();
  }
}
