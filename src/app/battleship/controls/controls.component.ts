import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameState } from '@models/match';
import { BattleshipService } from '@services/battleship.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent {
  @Input() state: GameState = GameState.preparing;
  @Input() ready: boolean = false;

  constructor(public battleship: BattleshipService) {}
}
