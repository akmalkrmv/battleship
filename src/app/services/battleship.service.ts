import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, switchMap } from 'rxjs/operators';

import { User } from '@models/user';
import { Player } from '@models/player';
import { GameState, Match, Move } from '@models/match';
import { Field } from '@models/field';
import { ShipPlacement, ShipsMap } from '@models/ship';
import { ShipGenerator } from './ship-generator.service';
import { MatchService } from './match.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BattleshipService {
  public loading$ = new BehaviorSubject(false);

  public player$ = new BehaviorSubject<Player>(null);
  public opponent$ = new BehaviorSubject<Player>(null);
  public current$ = new BehaviorSubject<string>(null);
  public winner$ = new BehaviorSubject<string>(null);

  public match$ = new BehaviorSubject<Match>(null);
  public state$ = new BehaviorSubject(GameState.waiting);
  public ready$ = new BehaviorSubject(false);
  public round$ = new BehaviorSubject(0);

  public ships$ = new BehaviorSubject<ShipPlacement[]>([]);
  public moves$ = new BehaviorSubject<Move[]>([]);

  private initializing: boolean = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private matchService: MatchService
  ) {}

  public init(matchId: string) {
    this.initializing = true;
    this.loading$.next(true);

    return combineLatest([
      this.matchService.matchChanges(matchId),
      this.authService.user$,
    ]).pipe(
      switchMap(async ([match, user]) => {
        if (!match || !match.exists || !this.hasAccess(match, user)) {
          this.loading$.next(false);
          return this.router.navigate(['/']);
        }

        // console.log('matchChanges', match);
        this.match$.next(match);
        this.state$.next(match.state);
        this.current$.next(match.current);
        this.winner$.next(match.winner);
        this.ready$.next(match.readyState && match.readyState[user.uid]);
        this.round$.next(match.game);

        if (this.initializing) {
          this.initializing = false;
          this.setPlayers(user, match);
          this.checkForGameOver();
          this.loading$.next(false);
        }

        if (match.state == GameState.open) {
          if (!match.opponent && user.uid !== match.creator.uid) {
            match = await this.joinMatch({ id: matchId, ...match }, user);
            this.setPlayers(user, match);
          }

          return of(match);
        }

        if (match.state == GameState.preparing) {
          if (!match.readyState) {
            this.setPlayers(user, match);
            this.randomize();
          } else {
            const player = this.player$.value;
            const opponent = this.opponent$.value;

            if (
              match.readyState[player.uid] &&
              match.readyState[opponent.uid]
            ) {
              await this.setState(GameState.playing);
              await this.nextPlayer();
              return of(match);
            }
          }

          return of(match);
        }

        if (match.state == GameState.playing) {
          return of(match);
        }

        return of(match);
      })
    );
  }

  private hasAccess(match: Match, user: User): boolean {
    if (!match) return false;
    if (!match.creator || !match.opponent) return true;
    if (user.uid === match.creator.uid) return true;
    if (user.uid === match.opponent.uid) return true;

    return false;
  }

  private async joinMatch(match: Match, opponent: User): Promise<Match> {
    const update = { ...match, opponent, state: GameState.preparing };
    await this.matchService.updateMatch(update);
    return update;
  }

  public setPlayers(user: User, match: Match) {
    const creator: boolean = user.uid === match.creator.uid;
    this.player$.next(Player.create(creator ? match.creator : match.opponent));
    this.opponent$.next(
      Player.create(creator ? match.opponent : match.creator)
    );
  }

  public getPlayer(uid: string): Player {
    if (!uid) return null;
    const player = this.player$.value;
    const opponent = this.opponent$.value;
    return uid === player?.uid ? player : opponent;
  }
  public getOpponent(uid: string): Player {
    if (!uid) return null;
    const player = this.player$.value;
    const opponent = this.opponent$.value;
    return uid === player?.uid ? opponent : player;
  }

  public async start() {
    const match = this.match$.value;
    const player = this.player$.value;
    const readyState = { ...match.readyState, [player.uid]: true };
    await this.matchService.updateMatch({ ...match, readyState });
  }

  public async resign() {
    const match = this.match$.value;
    const opponent = this.opponent$.value;
    await this.setWinner(match, opponent.uid);
  }

  public async restart() {
    const match = this.match$.value;
    await this.matchService.updateMatch({
      ...match,
      winner: null,
      readyState: null,
      state: GameState.preparing,
      game: match.game + 1,
    });
  }

  public async setState(state: GameState) {
    const match = this.match$.value;
    if (match.state === state) return;
    await this.matchService.updateMatch({ ...match, state });
  }

  public async fire(field: Field) {
    if (this.state$.value !== GameState.playing) return;
    if (this.current$.value !== this.player$.value.uid) return;

    const match = this.match$.value;
    const current = this.current$.value;
    const opponent = this.getOpponent(current);

    await this.matchService.move(match, {
      player: opponent.uid,
      index: field.index,
    });

    if (!field.ship) {
      await this.nextPlayer();
    }

    // if ((this.winner = this.isGameOver())) {
    //   this.state$.next(GameState.finished);
    //   this.winner$.next(this.winner);
    //   return;
    // }

    // if (this.opponent.isComputer && this.current === this.opponent.uid) {
    //   let random = this.getRandomField(this.player.battlefield);
    //   if (random) {
    //     setTimeout(() => this.fire(random), 500);
    //   }
    // }
  }

  private async nextPlayer() {
    const match = this.match$.value;
    const player = this.player$.value.uid;
    const opponent = this.opponent$.value.uid;
    const current = this.current$.value === player ? opponent : player;

    this.current$.next(current);

    await this.matchService.updateMatch({ ...match, current });
  }

  public async randomize() {
    const match = this.match$.value;
    const player = this.player$.value.uid;
    const shipsMap = ShipGenerator.convertToMap(
      ShipGenerator.placeRandomShips()
    );

    await this.matchService.addShips(match, { player, shipsMap });
  }

  public getRandomField(fields: Field[]): Field {
    const nothit = fields.filter((field) => field && !field.hit);
    const random = Math.floor(Math.random() * nothit.length);

    return nothit[random];
  }

  public checkForGameOver() {
    let subs: Subscription[] = [];

    this.round$.pipe(distinctUntilChanged()).subscribe((round) => {
      const match = this.match$.value;

      if (subs) {
        subs.forEach((sub) => sub.unsubscribe());
      }

      this.ships$.next([]);
      this.moves$.next([]);

      subs = [
        this.matchService
          .shipsChanges(match)
          .subscribe((ships) => this.ships$.next(ships)),
        this.matchService
          .moveChanges(match)
          .subscribe((moves) => this.moves$.next(moves)),
      ];
    });

    combineLatest([
      this.match$,
      this.player$,
      this.opponent$,
      this.ships$,
      this.moves$,
    ])
      .pipe(
        filter(([match]) => !!match && match.state === GameState.playing),
        filter(([, player, opponent]) => !!player && !!opponent),
        filter(([, , , ships, moves]) => !!ships && !!moves),
        filter(([, , , ships, moves]) => !!ships.length && !!moves.length)
      )
      .subscribe(async ([match, player, opponent, ships, moves]) => {
        const emptyMap = { shipsMap: null };
        const getShipsMap = (uid: string): ShipsMap => {
          const filtered = ships
            .filter((s) => s.player === uid)
            .sort((a, b) => (a.created < b.created ? -1 : 1));

          return ((filtered || []).pop() || emptyMap).shipsMap;
        };

        const playerShips: ShipsMap = getShipsMap(player.uid);
        const opponentShips: ShipsMap = getShipsMap(opponent.uid);

        const isAllSunk = (map: ShipsMap) =>
          map &&
          Object.entries(map).every(
            ([index, ship]) =>
              !ship || !!moves.find((move) => move.index.toString() === index)
          );

        if (isAllSunk(playerShips)) {
          await this.setWinner(match, opponent.uid);
        } else if (isAllSunk(opponentShips)) {
          await this.setWinner(match, player.uid);
        }
      });
  }

  private async setWinner(match, winner: string) {
    await this.matchService.updateMatch({
      ...match,
      winner,
      readyState: null,
      state: GameState.finished,
    });
  }
}
