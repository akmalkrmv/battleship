import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { promise } from 'protractor';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Match, MatchMove, MatchState } from '../models/match';
import { Field } from '../models/ship';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class MatchService {
  constructor(private firestore: AngularFirestore) {}

  public openMatches(user: User) {
    return this.firestore
      .collection<any>('matches', (ref) =>
        ref
          .where('state', '==', 0)
          .where('creator.uid', '!=', user ? user.uid : 0)
      )
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
    return { id: doc.id, ...doc.data() } as Match;
  }

  public matchChanged(matchId: string): Observable<Match> {
    return this.firestore.doc<Match>(`matches/${matchId}`).valueChanges();
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

  public async sendShips(matchId: string, userId: string, ships: any[]): Promise<string> {
    return await this.firestore
      .collection<any>(`matches/${matchId}/ships`)
      .add({ userId, ships })
      .then((doc) => doc.id);
  }

  public async move(matchId: string, move: MatchMove): Promise<string> {
    return await this.firestore
      .collection<MatchMove>(`matches/${matchId}/moves`)
      .add(move)
      .then((doc) => doc.id);
  }

  public fires(matchId: string): Observable<MatchMove[]> {
    return this.firestore
      .collection<MatchMove>(`matches/${matchId}/moves`)
      .valueChanges();
  }
}
