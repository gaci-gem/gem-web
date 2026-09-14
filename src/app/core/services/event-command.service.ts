import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventCommandService {
  private readonly createEventSubject = new BehaviorSubject(false);
  readonly createEventRequested$ = this.createEventSubject.asObservable();

  requestCreateEvent(): void {
    this.createEventSubject.next(true);
  }

  consumeCreateEvent(): boolean {
    if (!this.createEventSubject.value) return false;
    this.createEventSubject.next(false);
    return true;
  }
}
