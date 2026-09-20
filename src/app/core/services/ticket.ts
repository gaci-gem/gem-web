import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@/environments/environment';
import { Observable } from 'rxjs';
import {
  TicketComment,
  Ticket,
  TicketDetail,
  TicketPage,
  TicketState,
} from '@core/interfaces/ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.BASE_URL}/v1/gem-clientes/admin/clientes/tickets`;

  list(filters: { search?: string; estado?: TicketState; clientId?: number; page?: number; limit?: number; sortField?: TicketSortField; sortDirection?: 'asc' | 'desc' }): Observable<TicketPage> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.clientId) params = params.set('clienteId', filters.clientId);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.sortField) params = params.set('sortField', filters.sortField);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    return this.http.get<TicketPage>(this.baseUrl, { params });
  }

  detail(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.baseUrl}/${id}`);
  }

  allowedTransitions(id: number): Observable<TicketState[]> {
    return this.http.get<TicketState[]>(`${this.baseUrl}/${id}/transiciones`);
  }

  transition(id: number, estado: TicketState, motivoRechazo?: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/estado`, { estado, motivoRechazo });
  }

  updateExternalReference(id: number, referenciaExterna: string | null): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/referencia-externa`, { referenciaExterna });
  }

  comment(id: number, texto: string): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.baseUrl}/${id}/comments`, { texto });
  }

  createEvent(id: number, formData: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/eventos`, formData);
  }

  associateEvent(ticketId: number, eventId: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${ticketId}/eventos/${eventId}`, {});
  }
}

export type TicketSortField = 'subject' | 'clientName' | 'status' | 'createdAt';
