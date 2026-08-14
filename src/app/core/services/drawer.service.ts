import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DrawerState {
  visible: boolean;
  id: string | null;
  targetId?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  private eventoDrawerSubject = new BehaviorSubject<DrawerState>({ visible: false, id: null });
  private usuarioDrawerSubject = new BehaviorSubject<DrawerState>({ visible: false, id: null });
  private notaDrawerSubject = new BehaviorSubject<DrawerState>({ visible: false, id: null });
  private ticketDrawerSubject = new BehaviorSubject<DrawerState>({ visible: false, id: null });

  eventoDrawer$ = this.eventoDrawerSubject.asObservable();
  usuarioDrawer$ = this.usuarioDrawerSubject.asObservable();
  notaDrawer$ = this.notaDrawerSubject.asObservable();
  ticketDrawer$ = this.ticketDrawerSubject.asObservable();

  abrirEventoDrawer(eventoId: string, targetId?: string): void {
    this.eventoDrawerSubject.next({ visible: true, id: eventoId, targetId: targetId || null });
  }

  cerrarEventoDrawer(): void {
    this.eventoDrawerSubject.next({ visible: false, id: null, targetId: null });
  }

  abrirUsuarioDrawer(usuarioId: string): void {
    this.usuarioDrawerSubject.next({ visible: true, id: usuarioId });
  }

  cerrarUsuarioDrawer(): void {
    this.usuarioDrawerSubject.next({ visible: false, id: null });
  }

  abrirNotaDrawer(notaId?: string): void {
    this.notaDrawerSubject.next({ visible: true, id: null, targetId: notaId || null });
  }

  cerrarNotaDrawer(): void {
    this.notaDrawerSubject.next({ visible: false, id: null, targetId: null });
  }

  abrirTicketDrawer(ticketId: number): void {
    this.ticketDrawerSubject.next({ visible: true, id: String(ticketId) });
  }

  cerrarTicketDrawer(): void {
    this.ticketDrawerSubject.next({ visible: false, id: null });
  }
}
