import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Player } from '../models/player';
import { Field } from '../models/ship';
import { BattleshipService } from '../services/battleship.service';

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
export class BattleshipComponent implements OnInit {
  public loading$ = this.battleship.loading$;
  public state: GameState = GameState.preparing;
  public players: Player[] = [];
  public current: Player;
  public user: Player;
  public opponent: Player;
  public winner: Player;

  constructor(
    private battleship: BattleshipService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.user = new Player('Player');
    this.opponent = new Player('PC', true);
    this.players = [this.user, this.opponent];
    this.current = this.user;

    this.prepare();
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
