import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { promise } from 'protractor';
import { map } from 'rxjs/operators';
import { Match } from '../models/match';
import { User } from '../models/user';

export enum MatchState {
  open,
  closed,
}

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  constructor(private firestore: AngularFirestore) {}

  public openMatches(user: User) {
    return this.firestore
      .collection<any>('matches', (ref) => {
        let query = ref.where('state', '==', 0);

        if (user) {
          query = query.where('creator.uid', '!=', user.uid);
        }

        return query;
      })
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((action) => ({
            id: action.payload.doc.id,
            ...action.payload.doc.data(),
          }))
        )
      );
  }

  public async getMatch(matchId: string): Promise<Match> {
    const doc = await this.firestore.doc(`matches/${matchId}`).ref.get();
    return { id: doc.id, ...doc.data() };
  }

  public async createMatch(user: User) {
    return await this.firestore.collection('matches').add({
      creator: user,
      state: MatchState.open,
    });
  }

  public async joinMatch(matchId: string, user: User) {
    return await this.firestore
      .doc(`matches/${matchId}`)
      .set({ opponent: user, state: MatchState.closed }, { merge: true });
  }
}
