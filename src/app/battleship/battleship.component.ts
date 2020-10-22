import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { filter } from 'rxjs/operators';
import { Match } from '../models/match';
import { Player } from '../models/player';
import { Field } from '../models/ship';
import { AuthService } from '../services/auth.service';
import { BattleshipService } from '../services/battleship.service';
import { MatchService } from '../services/match.service';

export enum GameState {
  preparing = 'preparing',
  playing = 'playing',
  finished = 'finished',
}

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleshipComponent implements OnInit, OnDestroy {
  public loading$ = this.battleship.loading$;
  public state: GameState = GameState.preparing;
  public players: Player[] = [];
  public current: Player;
  public user: Player;
  public opponent: Player;
  public winner: Player;
  public match: Match;

  constructor(
    public auth: AuthService,
    private activatedRoute: ActivatedRoute,
    private battleship: BattleshipService,
    private matchService: MatchService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnDestroy() {}

  ngOnInit() {
    this.loading$.next(true);
    this.activatedRoute.paramMap
      .pipe(filter((params) => !!params.get('id')))
      .subscribe(async (params) => {
        this.loading$.next(false);

        this.matchService
          .matchChanged(params.get('id'))
          .pipe(untilDestroyed(this))
          .subscribe((match) => {
            console.log(match);
            this.match = match;
            this.user = new Player(this.match.creator.displayName);
            this.opponent = new Player('waiting..');
            this.players = [this.user, this.opponent];
            this.current = this.user;

            if (match.opponent) {
              this.loading$.next(true);
              this.opponent = new Player(this.match.opponent.displayName);
              this.players = [this.user, this.opponent];

              this.prepare();
              this.loading$.next(false);
            }

            this.changeDetector.markForCheck();
          });
      });
  }

  public onDrop($event) {
    $event.preventDefault();
  }
  public onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
  }

  public start() {
    this.state = GameState.playing;
    this.current = this.user;
    this.changeDetector.markForCheck();
  }
  public resign() {
    this.winner = this.opponent;
    this.state = GameState.finished;
    this.changeDetector.markForCheck();
  }
  public restart() {
    this.winner = null;
    this.state = GameState.preparing;
    this.prepare();
    this.changeDetector.markForCheck();
  }

  public async prepare() {
    this.user.battlefield = await this.battleship.placeShips();

    if (this.opponent.isComputer) {
      this.opponent.battlefield = await this.battleship.placeShips();
    }
  }

  public async randomize() {
    this.user.battlefield = await this.battleship.placeShips();
  }

  public fire(field: Field) {
    if (this.state !== GameState.playing) return;
    if (field.hit) return;

    field.hit = true;
    this.battleship.fired$.emit();

    const { ship } = field;

    if (ship) {
      ship.hits++;
      field.sunk = ship.sunk = ship.hits === ship.length;
    } else {
      this.nextPlayer();
    }

    if ((this.winner = this.isGameOver())) {
      this.state = GameState.finished;
      return;
    }

    if (this.current.isComputer) {
      let random = this.battleship.getRandomField(this.user.battlefield);
      if (random) {
        setTimeout(() => {
          this.fire(random);
          this.changeDetector.detectChanges();
        }, 500);
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
}
