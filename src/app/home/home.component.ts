import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatchService } from '../services/match.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
    private matchService: MatchService
  ) {}

  ngOnInit(): void {}

  public createMatch() {
    this.auth.user$.pipe(first()).subscribe(async (user) => {
      const match = await this.matchService.createMatch(user);
      this.router.navigate([`match/${match.id}`]);
    });
  }
}
