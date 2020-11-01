import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { filter, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { BattleshipService } from '../services/battleship.service';

@Component({
  selector: 'app-battleship',
  templateUrl: './battleship.component.html',
  styleUrls: ['./battleship.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleshipComponent implements OnInit, OnDestroy {

  constructor(
    public auth: AuthService,
    public battleship: BattleshipService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnDestroy() {}

  ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(
        untilDestroyed(this),
        filter((params) => !!params.get('id')),
        switchMap((params) => this.battleship.init(params.get('id')))
      )
      .subscribe();
  }
}
