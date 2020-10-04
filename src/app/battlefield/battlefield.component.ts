import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Field } from '../models/ship';
import { BattleshipService } from '../services/battleship.service';

@Component({
  selector: 'app-battlefield',
  templateUrl: './battlefield.component.html',
  styleUrls: ['./battlefield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlefieldComponent implements OnInit {
  @Input() battlefield: Field[];
  @Output() fired = new EventEmitter();

  constructor(
    private battleship: BattleshipService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.battleship.fired$.subscribe(() => {
      this.changeDetector.markForCheck();
    });
  }

  public onDrop($event) {
    $event.preventDefault();
  }
  public onDragOver($event) {
    $event.stopPropagation();
    $event.preventDefault();
  }

  public fire(field: Field) {
    this.fired.emit(field);
  }

  public byIndex(index: number, item: Field) {
    return item ? item.index : index;
  }
}
