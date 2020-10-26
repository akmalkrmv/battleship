import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Field } from '@models/ship';
import { BattleshipService } from '@services/battleship.service';
import { Player } from '@models/player';

@Component({
  selector: 'app-battlefield',
  templateUrl: './battlefield.component.html',
  styleUrls: ['./battlefield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlefieldComponent implements OnInit, OnDestroy, OnChanges {
  @Input() player: Player;
  @Input() current: Player;
  @Output() fired = new EventEmitter();

  constructor(
    private battleship: BattleshipService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.player);
  }

  ngOnDestroy(): void {}
  ngOnInit(): void {
    // this.battleship.fired$.pipe(untilDestroyed(this)).subscribe(() => {
    //   this.changeDetector.markForCheck();
    // });
  }

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
