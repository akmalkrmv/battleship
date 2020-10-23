import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  public message$ = new Observable<any>();
  public connected$ = new Observable<any>();
  public disconnected$ = new Observable<any>();

  constructor() {}

  public connect() {}
  public disconnect() {}
  public send() {}
}
