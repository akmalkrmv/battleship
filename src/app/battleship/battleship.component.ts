import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { BattleshipService } from '../services/battleship.service';

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleshipComponent implements OnInit, OnDestroy {
  public loading$ = this.battleship.loading$;
  public state$ = this.battleship.state$;
  public match$ = this.battleship.match$;

  constructor(public auth: AuthService, public battleship: BattleshipService) {}

  ngOnDestroy() {}

  ngOnInit() {
    this.battleship.init();
  }
}
