import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameState } from '@models/match';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { MatchService } from '../services/match.service';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.scss'],
})
export class MatchesComponent implements OnInit {
  @Input() user: User;
  public matches$: Observable<any>;

  constructor(private matchService: MatchService, private router: Router) {}

  ngOnInit() {
    this.matches$ = this.matchService.openMatches(this.user);
  }

  public async joinMatch(id: string) {
    const update = { id, opponent: this.user, state: GameState.preparing };
    await this.matchService.updateMatch(update);
    await this.router.navigate([`match/${id}`]);
  }
}
