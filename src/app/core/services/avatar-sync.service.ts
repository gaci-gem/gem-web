import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AvatarStrategy, AvatarUser } from '@/app/constants/avatares-disponibles';

export interface AvatarChange {
  strategy: AvatarStrategy;
  user: AvatarUser;
}

@Injectable({
  providedIn: 'root'
})
export class AvatarSyncService {
  private avatarCambiadoSubject = new BehaviorSubject<AvatarChange | null>(null);
  
  avatarCambiado$: Observable<AvatarChange | null> = this.avatarCambiadoSubject.asObservable();

  notificarCambioAvatar(strategy: AvatarStrategy, user: AvatarUser): void {
    this.avatarCambiadoSubject.next({ strategy, user });
  }
}
