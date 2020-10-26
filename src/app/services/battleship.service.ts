import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Field } from '@models/ship';
import { GameState, Match } from '@models/match';
import { Player } from '@models/player';
import { MatchService } from './match.service';
import { ShipGenerator } from './ship-generator.service';

@Injectable({ providedIn: 'root' })
export class BattleshipService {
  public loading$ = new BehaviorSubject(false);

  public user$ = new BehaviorSubject<Player>(null);
  public opponent$ = new BehaviorSubject<Player>(null);
  public current$ = new BehaviorSubject<Player>(null);
  public winner$ = new BehaviorSubject<Player>(null);

  public match$ = new BehaviorSubject<Match>(null);
  public state$ = new BehaviorSubject(GameState.waiting);
  public fired$ = new EventEmitter();

  private players: Player[] = [];
  private user: Player = null;
  private opponent: Player = null;
  private current: Player = null;
  private winner: Player = null;

  constructor(private router: Router, private matchService: MatchService) {}

  public init(matchId: string) {
    return this.matchService.matchChanges(matchId).pipe(
      switchMap((match) => {
        console.log('matchChanges', match);

        if (!match) {
          return this.router.navigate(['/']);
        }

        this.loading$.next(true);
        this.match$.next(match);

        this.user = new Player(match.creator.displayName);
        this.user$.next(this.user);
        this.current$.next(this.user);

        if (match.opponent) {
          this.opponent = new Player(match.creator.displayName);
          this.players = [this.user, this.opponent];
          this.opponent$.next(this.opponent);
          this.prepare();
        }

        this.loading$.next(false);

        return of(match);
      })
    );
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

  public placeShips(): Field[] {
    const emptyCollection = ShipGenerator.createEmptyShipCollection();
    const randomShips = ShipGenerator.placeRandomShips(emptyCollection);
    const fields = ShipGenerator.wrapWithFields(randomShips);
    return fields;
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
      this.winner$.next(this.winner);
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

  public prepare() {
    this.state$.next(GameState.preparing);

    this.user$.next({
      ...this.user$.value,
      battlefield: this.placeShips(),
    });

    if (this.opponent.isComputer) {
      this.opponent$.next({
        ...this.opponent$.value,
        battlefield: this.placeShips(),
      });
    }
  }

  public randomize() {
    this.user$.next({ ...this.user$.value, battlefield: this.placeShips() });
  }
}
