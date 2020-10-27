import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { switchMap, switchMapTo } from 'rxjs/operators';

import { Field } from '@models/field';
import { GameState, Match } from '@models/match';
import { Player } from '@models/player';
import { MatchService } from './match.service';
import { ShipGenerator } from './ship-generator.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BattleshipService {
  public loading$ = new BehaviorSubject(false);

  public player$ = new BehaviorSubject<Player>(null);
  public opponent$ = new BehaviorSubject<Player>(null);
  public current$ = new BehaviorSubject<Player>(null);
  public winner$ = new BehaviorSubject<Player>(null);

  public match$ = new BehaviorSubject<Match>(null);
  public state$ = new BehaviorSubject(GameState.waiting);
  public ready$ = new EventEmitter();
  public fired$ = new EventEmitter();

  private players: Player[] = [];
  private player: Player = null;
  private opponent: Player = null;
  private current: Player = null;
  private winner: Player = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private matchService: MatchService
  ) {}

  public init(matchId: string) {
    return combineLatest([
      this.matchService.matchChanges(matchId),
      this.authService.user$,
    ]).pipe(
      switchMap(([match, user]) => {
        console.log('matchChanges', match);
        if (!match) {
          return this.router.navigate(['/']);
        }

        this.match$.next({ id: matchId, ...match });

        const creator: boolean = user.uid === match.creator.uid;
        this.player = Player.create(creator ? match.creator : match.opponent);
        this.opponent = Player.create(creator ? match.opponent : match.creator);
        this.player$.next(this.player);
        this.opponent$.next(this.opponent);
        this.players = [this.player, this.opponent];

        this.prepare();
        this.randomize();

        if (this.opponent.uid) {
          this.matchService
            .playerChanges(matchId, this.opponent.uid)
            .subscribe((opponent) => {
              this.opponent.battlefield = Field.fromJSON(opponent.ships);
              this.opponent$.next({ ...this.opponent });
            });
        }

        return of(match);
      })
    );
  }

  public async start() {
    const { id } = this.match$.value;
    const player = this.player$.value;

    await this.matchService.updatePlayer(id, {
      uid: player.uid,
      ships: Field.toJSON(player.battlefield),
    });

    this.state$.next(GameState.playing);
    this.current$.next(this.player);
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
      let random = this.getRandomField(this.player.battlefield);
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

    if (isAllSunk(this.player)) {
      return this.opponent;
    }

    if (isAllSunk(this.opponent)) {
      return this.player;
    }

    return null;
  }

  public prepare() {
    this.state$.next(GameState.preparing);
    this.emptyBattlefield(this.player$);
    this.emptyBattlefield(this.opponent$);
  }

  public randomize() {
    this.placeShips(this.player$);
  }

  public placeShips(player: BehaviorSubject<Player>) {
    if (player && player.value) {
      player.next({
        ...player.value,
        battlefield: this.getFieldsWithRandomShips(),
      });
    }
  }

  public emptyBattlefield(player: BehaviorSubject<Player>) {
    if (player && player.value) {
      player.next({ ...player.value, battlefield: this.getEmptyFileds() });
    }
  }

  public getFieldsWithRandomShips(): Field[] {
    const emptyCollection = ShipGenerator.createEmptyShipCollection();
    const randomShips = ShipGenerator.placeRandomShips(emptyCollection);
    const fields = ShipGenerator.wrapWithFields(randomShips);
    return fields;
  }

  public getEmptyFileds(): Field[] {
    const emptyCollection = ShipGenerator.createEmptyShipCollection();
    const fields = ShipGenerator.wrapWithFields(emptyCollection);
    return fields;
  }
}
