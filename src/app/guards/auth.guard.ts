import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | Observable<boolean> {
    return this.auth.isSignedIn().pipe(
      tap((isSignedIn) => {
        if (!isSignedIn) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
