import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../models/user';

import * as firebaseui from 'firebaseui';
import * as firebase from 'firebase/app';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public user$: Observable<User>;

  constructor(
    private firestore: AngularFirestore,
    private fireauth: AngularFireAuth,
    private router: Router
  ) {
    this.user$ = this.fireauth.authState.pipe(
      switchMap((user) => {
        if (user) {
          return this.firestore.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  public startUi(element: Element | string): void {
    const auth = firebase.auth();
    auth.useDeviceLanguage();

    const ui = new firebaseui.auth.AuthUI(auth);
    const withoutCaptcha = (provider: string) => ({
      provider,
      recaptchaParameters: { size: 'invisible' },
    });

    ui.start(element, {
      signInOptions: [
        withoutCaptcha(firebase.auth.PhoneAuthProvider.PROVIDER_ID),
        withoutCaptcha(firebase.auth.EmailAuthProvider.PROVIDER_ID),
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: (credential, redirectUrl: string) => {
          this.updateUserData(credential.user).then(() => {
            this.router.navigate([redirectUrl || '/']);
          });

          return false;
        },
      },
    });
  }

  public async signOut() {
    await this.fireauth.signOut();
    return this.router.navigate(['/']);
  }

  public updateUserData({ uid, email, photoURL, displayName }: User) {
    return this.firestore
      .doc<User>(`users/${uid}`)
      .set({ uid, email, photoURL, displayName }, { merge: true });
  }
}
