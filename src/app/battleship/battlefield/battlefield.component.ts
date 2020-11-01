import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FIELD_RANGE } from '@constants/fields';
import { Field } from '@models/field';
import { Move } from '@models/match';
import { Player } from '@models/player';
import { ShipPlacement } from '@models/ship';

@Component({
  selector: 'app-battlefield',
  templateUrl: './battlefield.component.html',
  styleUrls: ['./battlefield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlefieldComponent implements OnChanges {
  @Input() isVisible = true;
  @Input() isClickable = true;
  @Input() current: string;
  @Input() player: Player;
  @Input() ships: ShipPlacement[];
  @Input() moves: Move[];
  @Output() fired = new EventEmitter();

  public battlefield: Field[] = [];

  ngOnInit() {
    this.battlefield = this.createEmptyBattlefield();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.current) {
      // console.log('changes.current');
    }

    if (changes.player) {
      // console.log('changes.player');
      this.renderShips();
      this.renderMoves();
    }

    if (changes.ships) {
      // console.log('changes.ships');
      this.renderShips();
    }

    if (changes.moves) {
      // console.log('changes.moves');
      this.renderMoves();
    }
  }

  public fire(field: Field) {
    if (!field.hit) {
      this.fired.emit(field);
    }
  }

  public byIndex(index: number, item: Field) {
    return item ? item.index : index;
  }

  private createEmptyBattlefield() {
    const battlefield = [];
    for (let index = 0; index < FIELD_RANGE; index++) {
      battlefield[index] = new Field(index);
    }

    return battlefield;
  }

  private renderShips() {
    if (!this.player) return;
    if (!this.ships) return;
    if (!this.ships.length) return;

    const ships = this.ships
      .filter((sh) => sh.player === this.player.uid)
      .sort((a, b) => (a.created < b.created ? -1 : 1));

    if (!ships) return;
    if (!ships.length) return;

    // console.log('rendering ships');

    const map = ships.pop().shipsMap;
    const battlefield = this.createEmptyBattlefield();
    
    for (const [index, ship] of Object.entries(map)) {
      battlefield[index].ship = ship;
    }

    this.battlefield = battlefield;
  }

  private renderMoves() {
    if (!this.player) return;
    if (!this.moves) return;
    if (!this.moves.length) return;

    // console.log('rendering moves');

    const moves = this.moves.filter((m) => m.player === this.player.uid);
    const ships = {};

    moves.forEach((move) => {
      const field = this.battlefield[move.index];
      field.hit = true;

      if (field.ship) {
        const { uid } = field.ship;

        ships[uid] = ships[uid] || { ...field.ship, hits: 0 };
        ships[uid].hits++;
      }
    });

    this.battlefield.forEach((field) => {
      if (field.ship) {
        const { uid } = field.ship;

        if (ships[uid]) {
          field.ship.sunk = ships[uid].hits === ships[uid].length;
        }
      }
    });
  }
}
