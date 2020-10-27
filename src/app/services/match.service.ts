import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GameState, Match, Move } from '@models/match';
import { User } from '@models/user';
import { Player } from '@models/player';
import { Ship } from '@models/ship';

@Injectable({ providedIn: 'root' })
export class MatchService {
  constructor(private firestore: AngularFirestore) {}

  private async addToCollection<T>(path: string, value: T): Promise<string> {
    return await this.firestore
      .collection<T>(path)
      .add(value)
      .then((doc) => doc.id);
  }

  public openMatches(user: User) {
    return this.firestore
      .collection<any>('matches', (ref) =>
        ref
          .where('state', '==', GameState.open)
          .where('creator', '!=', user ? user.uid : 0)
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

  public matchChanges(matchId: string): Observable<Match> {
    return this.firestore.doc<Match>(`matches/${matchId}`).valueChanges();
  }

  public async createMatch(user: User): Promise<string> {
    const id = await this.addToCollection(`matches`, {
      creator: user,
      state: GameState.open,
    });

    await this.firestore
      .doc(`matches/${id}/players/${user.uid}`)
      .set(user, { merge: true });

    return id;
  }

  public async updateMatch({ id, ...rest }: Partial<Match>): Promise<void> {
    return await this.firestore.doc(`matches/${id}`).set(rest, { merge: true });
  }

  // Players

  public async addPlayer(matchId: string, player: Player): Promise<string> {
    return await this.addToCollection(`matches/${matchId}/players`, player);
  }
  public async updatePlayer(
    matchId: string,
    { uid: uid, ...rest }: Partial<Player>
  ): Promise<void> {
    const path = `matches/${matchId}/players/${uid}`;
    return await this.firestore.doc(path).set(rest, { merge: false });
  }
  public playerChanges(matchId: string, playerId: string): Observable<Player> {
    const path = `matches/${matchId}/players/${playerId}`;
    return this.firestore.doc<Player>(path).valueChanges();
  }

  // Moves
  public async move(
    matchId: string,
    playerId: string,
    move: Move
  ): Promise<string> {
    const path = `matches/${matchId}/players/${playerId}/moves`;
    return await this.addToCollection(path, move);
  }
  public moveChanges(matchId: string, playerId: string): Observable<Move[]> {
    const path = `matches/${matchId}/players/${playerId}/moves`;
    return this.firestore.collection<Move>(path).valueChanges();
  }
}
