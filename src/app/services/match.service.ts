import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@models/user';
import { ShipPlacement } from '@models/ship';
import { GameState, Match, Move } from '@models/match';

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
    return this.firestore
      .doc<Match>(`matches/${matchId}`)
      .snapshotChanges()
      .pipe(
        map((snapshot) => ({
          id: snapshot.payload.id,
          exists: snapshot.payload.exists,
          ...snapshot.payload.data(),
        }))
      );
  }

  public async createMatch(user: User): Promise<string> {
    return await this.addToCollection(`matches`, {
      creator: user,
      state: GameState.open,
      game: 1,
    });
  }

  public async updateMatch({ id, ...rest }: Partial<Match>): Promise<void> {
    return await this.firestore.doc(`matches/${id}`).set(rest, { merge: true });
  }

  // Ships
  public async addShips(match: Match, ships: ShipPlacement): Promise<string> {
    ships = { ...ships, created: Date.now() };
    const path = `matches/${match.id}/game/${match.game}/ships`;
    return await this.addToCollection(path, ships);
  }
  public shipsChanges(match: Match): Observable<ShipPlacement[]> {
    const path = `matches/${match.id}/game/${match.game}/ships`;
    return this.firestore.collection<ShipPlacement>(path).valueChanges();
  }

  // Moves
  public async move(match: Match, move: Move): Promise<string> {
    const path = `matches/${match.id}/game/${match.game}/moves`;
    return await this.addToCollection(path, move);
  }
  public moveChanges(match: Match): Observable<Move[]> {
    const path = `matches/${match.id}/game/${match.game}/moves`;
    return this.firestore.collection<Move>(path).valueChanges();
  }
}
