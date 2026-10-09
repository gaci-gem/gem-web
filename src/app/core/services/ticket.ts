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

  list(filters: { search?: string; estado?: TicketState; prioridad?: string; tipo?: string; status?: TicketState; priority?: string; type?: string; id?: number; subject?: string; client?: string; externalReference?: string; events?: string; assignedUser?: string; createdFrom?: string; createdTo?: string; clientId?: number; page?: number; limit?: number; sortField?: TicketSortField; sortDirection?: 'asc' | 'desc' }): Observable<TicketPage> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.prioridad) params = params.set('prioridad', filters.prioridad);
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.status) params = params.set('estado', filters.status);
    if (filters.priority) params = params.set('prioridad', filters.priority);
    if (filters.type) params = params.set('tipo', filters.type);
    if (filters.id !== undefined) params = params.set('id', filters.id);
    for (const [key, value] of Object.entries({ subject: filters.subject, client: filters.client, externalReference: filters.externalReference, events: filters.events, assignedUser: filters.assignedUser, createdFrom: filters.createdFrom, createdTo: filters.createdTo })) if (value) params = params.set(key, value);
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

  emitirLinkCompartido(id: number): Observable<{ token: string; destino?: string; destinos: Array<{ aplicacion: string; url: string }>; url?: string }> {
    return this.http.post<{ token: string; destino?: string; destinos: Array<{ aplicacion: string; url: string }>; url?: string }>(`${environment.apiBaseUrl}/tickets/${id}/shared-links`, {});
  }

  resolverLinkCompartido(token: string): Observable<SharedTicketResponse> {
    return this.http.get<SharedTicketResponse>(`${environment.apiBaseUrl}/shared/ticket/${encodeURIComponent(token)}`);
  }

  resolverTicketCompartido(token: string): Observable<{ id: number }> {
    return this.http.get<{ id: number }>(`${environment.apiBaseUrl}/shared/ticket/${encodeURIComponent(token)}/ticket`);
  }

  allowedTransitions(id: number): Observable<TicketState[]> {
    return this.http.get<TicketState[]>(`${this.baseUrl}/${id}/transiciones`);
  }

  transition(id: number, estado: TicketState, observacion?: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/estado`, { estado, observacion });
  }

  updateExternalReference(id: number, referenciaExterna: string | null): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/referencia-externa`, { referenciaExterna });
  }

  updateModule(id: number, moduloCodigo: string | null): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/modulo`, { moduloCodigo });
  }
  updateUser(id: number, usuarioId: string | null): Observable<Ticket> { return this.http.patch<Ticket>(`${this.baseUrl}/${id}/usuario`, { usuarioId }); }
  updatePriority(id: number, priority: Ticket['priority']): Observable<Ticket> { return this.http.patch<Ticket>(`${this.baseUrl}/${id}/priority`, { priority }); }
  updateType(id: number, type: Ticket['type']): Observable<Ticket> { return this.http.patch<Ticket>(`${this.baseUrl}/${id}/type`, { type }); }

  comment(id: number, texto: string, visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC'): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.baseUrl}/${id}/comments`, { texto, visibilidad: visibility });
  }

  emailOriginal(ticketId: number, attachmentId: string): Observable<EmailOriginalView> {
    return this.http.get<EmailOriginalView>(`${environment.BASE_URL}/v1/gem-clientes/admin/clientes/tickets/${ticketId}/attachments/${attachmentId}/view`);
  }

  createEvent(id: number, formData: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/eventos`, formData);
  }

  associateEvent(ticketId: number, eventId: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${ticketId}/eventos/${eventId}`, {});
  }

  replaceEvents(ticketId: number, eventoIds: string[]): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.baseUrl}/${ticketId}/eventos`, { eventoIds });
  }
}

export interface EmailOriginalView { headers: Record<string, string>; html: string | null; text: string | null; attachments: Array<{ name: string; downloadUrl?: string; contentId?: string }> }

export type TicketSortField = 'subject' | 'clientName' | 'status' | 'priority' | 'type' | 'createdAt';

export interface SharedTicketResponse {
  tipo: 'TICKET';
  destinos: Array<'GEM_WEB' | 'GEM_CLIENTES'>;
}
