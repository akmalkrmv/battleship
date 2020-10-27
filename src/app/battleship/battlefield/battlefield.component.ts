import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Field } from '@models/field';
import { Player } from '@models/player';

@Component({
  selector: 'app-battlefield',
  templateUrl: './battlefield.component.html',
  styleUrls: ['./battlefield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlefieldComponent {
  @Input() player: Player;
  @Input() current: Player;
  @Input() isVisible = true;
  @Output() fired = new EventEmitter();

  constructor() {}

  public onDrop(event) {
    event.preventDefault();
  }
  public onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  public fire(field: Field) {
    this.fired.emit(field);
  }

  public byIndex(index: number, item: Field) {
    return item ? item.index : index;
  }
}
