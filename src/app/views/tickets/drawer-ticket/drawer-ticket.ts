import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { BadgeClickComponent } from '@app/components/badge-click';
import { TicketDetail, TicketEvent } from '@core/interfaces/ticket';
import { TicketService } from '@core/services/ticket';
import { EventoCompleto } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { DrawerService } from '@core/services/drawer.service';
import { PermisosService } from '@core/services/permisos';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { environment } from '@/environments/environment';
import { FiltroActivo } from '@/app/constants/filtros_activo';

@Component({
  selector: 'app-drawer-ticket',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, DrawerModule, ButtonModule, DialogModule, BadgeClickComponent],
  templateUrl: './drawer-ticket.html',
  styles: `
    .ticket-status-badge { min-width: 8.5rem; height: 1.75rem; justify-content: center; }
    @media screen and (max-width: 960px) { ::ng-deep .ticket-drawer { width: 80vw !important; } }
    @media screen and (max-width: 640px) { ::ng-deep .ticket-drawer { width: 100vw !important; } }
  `,
})
export class DrawerTicket {
  readonly apiBaseUrl = environment.BASE_URL;
  private readonly service = inject(TicketService);
  private readonly eventoService = inject(EventoService);
  private readonly drawerService = inject(DrawerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissions = inject(PermisosService);

  @Input() visible = false;
  @Input() ticketId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  ticket: TicketDetail | null = null;
  loading = false;
  error: string | null = null;
  private loadedKey: string | null = null;
  associationDialogVisible = false;
  eventSearch = '';
  availableEvents: EventoCompleto[] = [];
  loadingEvents = false;
  associationError: string | null = null;
  associatingEventId: string | null = null;

  ngOnChanges(): void {
    if (!this.canRead()) { this.ticket = null; return; }
    this.loadTicket();
  }

  canRead(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.LEER)); }

  private loadTicket(): void {
    if (!this.visible || !this.ticketId) return;
    const key = `${this.visible}:${this.ticketId}`;
    if (this.loadedKey === key) return;
    this.loadedKey = key;
    this.ticket = null;
    this.error = null;
    this.loading = true;
    this.service.detail(Number(this.ticketId)).pipe(finalize(() => {
      this.loading = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Ticket operation failed.';
        this.cdr.detectChanges();
      },
    });
  }

  statusClass(status: string): string {
    return {
      INGRESADO: 'text-bg-secondary',
      EN_REVISION: 'text-bg-info',
      EN_DESARROLLO: 'text-bg-primary',
      RESUELTO: 'text-bg-success',
      CERRADO: 'text-bg-dark',
      RECHAZADO: 'text-bg-danger',
    }[status] || 'text-bg-secondary';
  }

  openEvent(eventId: string): void {
    this.drawerService.abrirEventoDrawer(eventId);
  }

  canManage(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.GESTIONAR)); }

  openEventAssociation(): void {
    if (!this.canManage() || !this.ticket) return;
    this.associationDialogVisible = true;
    this.eventSearch = '';
    this.loadAvailableEvents();
  }

  loadAvailableEvents(): void {
    if (!this.ticket) return;
    this.loadingEvents = true;
    this.associationError = null;
    this.eventoService.getAllComplete(FiltroActivo.ALL).pipe(finalize(() => this.loadingEvents = false)).subscribe({
      next: (events) => {
        const associated = new Set(this.ticket?.events.map((event) => event.id));
        this.availableEvents = events.filter((event) => event.clienteId === this.ticket?.clientId && !associated.has(event.id ?? ''));
      },
      error: (error) => { this.associationError = error?.error?.message || 'No se pudieron cargar los eventos.'; },
    });
  }

  get filteredEvents(): EventoCompleto[] {
    const search = this.eventSearch.trim().toLocaleLowerCase();
    if (!search) return this.availableEvents;
    return this.availableEvents.filter((event) => [
      event.evento,
      event.titulo,
      event.cliente?.sigla,
      event.cliente?.nombre,
    ].some((value) => value?.toLocaleLowerCase().includes(search)));
  }

  associateEvent(event: EventoCompleto): void {
    if (!this.canManage() || !this.ticket?.id || !event.id) return;
    this.associatingEventId = event.id;
    this.service.associateEvent(this.ticket.id, event.id).pipe(finalize(() => this.associatingEventId = null)).subscribe({
      next: () => {
        const linkedEvent: TicketEvent = {
          id: event.id!,
          type: event.tipoCodigo,
          code: event.numero.toString().padStart(3, '0'),
          title: event.titulo,
          visibleState: event.cerrado ? 'CLOSED' : 'OPEN',
          color: event.tipo?.color || '#6c757d',
        };
        this.ticket!.events = [...this.ticket!.events, linkedEvent];
        this.availableEvents = this.availableEvents.filter((item) => item.id !== event.id);
      },
      error: (error) => { this.associationError = error?.error?.message || 'No se pudo asociar el evento.'; },
    });
  }

  onClose(): void { this.closed.emit(); }
}
