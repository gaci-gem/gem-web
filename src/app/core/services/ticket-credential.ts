import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@/environments/environment';
import {
  TicketCredentialCreate,
  TicketCredentialUpdate,
  TicketCredential,
} from '@core/interfaces/ticket-credential';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TicketCredentialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_URL}/v1/gem-clientes/admin/clientes`;

  list(clienteId: number): Observable<TicketCredential[]> {
    return this.http.get<TicketCredential[]>(`${this.baseUrl}/${clienteId}/credenciales`);
  }

  create(clienteId: number, payload: TicketCredentialCreate): Observable<TicketCredential> {
    return this.http.post<TicketCredential>(`${this.baseUrl}/${clienteId}/credenciales`, payload);
  }

  update(clienteId: number, credentialId: string, payload: TicketCredentialUpdate): Observable<TicketCredential> {
    return this.http.patch<TicketCredential>(`${this.baseUrl}/${clienteId}/credenciales/${credentialId}`, payload);
  }

  rotate(clienteId: number, credentialId: string): Observable<TicketCredential> {
    return this.http.post<TicketCredential>(`${this.baseUrl}/${clienteId}/credenciales/${credentialId}/rotate`, {});
  }

  deactivate(clienteId: number, credentialId: string): Observable<TicketCredential> {
    return this.http.delete<TicketCredential>(`${this.baseUrl}/${clienteId}/credenciales/${credentialId}`);
  }
}
