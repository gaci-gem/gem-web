import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { MenuItem, MessageService } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { Table, TableFilterEvent, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { UiCard } from '@app/components/ui-card';
import { LoadingService } from '@core/services/loading.service';
import { TicketService, TicketSortField } from '@core/services/ticket';
import { TICKET_STATES, Ticket, TicketState } from '@core/interfaces/ticket';
import { DrawerService } from '@core/services/drawer.service';
import { TicketActionDialog } from '../ticket/ticket-action-dialog';
import { EventoCrud } from '../../evento/evento-crud/evento-crud';
import { PermisosService } from '@core/services/permisos';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { KeyboardListNavigation } from '@app/components/keyboard-list-navigation/keyboard-list-navigation';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { FiltroPreset, FiltroState } from '@core/interfaces/filtro-preset';
import { FiltroPresetService } from '@core/services/filtro-preset';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BadgeClickComponent } from '@app/components/badge-click';

@Component({
  selector: 'app-tickets',
  imports: [CommonModule, FormsModule, UiCard, TableModule, ContextMenuModule, InputTextModule, ToastModule, ToolbarModule, NgIcon, DatePipe, KeyboardListNavigation, FiltroPresetsComponent, RouterLink, BadgeClickComponent],
  providers: [DialogService, MessageService],
  templateUrl: './tickets.html',
  styles: [`
    .ticket-status-badge { min-width: 8.5rem; height: 1.75rem; align-items: center; justify-content: center; }
    .ticket-action-column { min-width: 4.5rem; width: 4.5rem; }
    .ticket-id-column { min-width: 5rem; }
    .ticket-subject-column { min-width: 16rem; }
    .ticket-client-column { min-width: 14rem; }
    .ticket-status-column, .ticket-priority-column, .ticket-type-column { min-width: 12rem; }
    .ticket-reference-column, .ticket-assigned-column { min-width: 14rem; }
    .ticket-created-column { min-width: 12rem; }
    .ticket-actions-column { min-width: 12rem; }
    .ticket-events-column { width: 16rem; min-width: 16rem; max-width: 16rem; }
    .ticket-events-list { min-width: 0; max-width: 16rem; overflow: hidden; white-space: nowrap; }
    .ticket-events-list .badge { flex: 0 0 auto; }
  `],
})
export class Tickets implements OnInit {
  private readonly service = inject(TicketService);
  private readonly dialog = inject(DialogService);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly drawers = inject(DrawerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermisosService);
  private readonly presetService = inject(FiltroPresetService);
  private ref: DynamicDialogRef | null = null;
  private readonly drawerClosedSubscription = this.drawers.ticketClosed$.subscribe(() => this.loadItems());
  private clearingFilters = false;
  @ViewChild('dt') table?: Table;

  readonly pantalla = 'tickets';
  readonly presets = signal<FiltroPreset[]>([]);
  selectedPresetId = '';
   tickets: Ticket[] = [];
   total = 0;
   page = 1;
  limit = 10;
  sortField: TicketSortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  search = '';
  estado: TicketState | '' = '';
   prioridad = ''; tipo = '';
   idFilter = ''; subjectFilter = ''; clientFilter = ''; externalReferenceFilter = ''; eventsFilter = ''; assignedUserFilter = ''; createdFrom = ''; createdTo = '';
  readonly states = TICKET_STATES.map((value) => ({ label: this.statusLabel(value), value }));
  readonly priorities = [{ label: 'Crítica', value: 'CRITICA' }, { label: 'Alta', value: 'ALTA' }, { label: 'Media', value: 'MEDIA' }, { label: 'Baja', value: 'BAJA' }];
  readonly types = [{ label: 'Consulta', value: 'CONSULTA' }, { label: 'Error / Incidente', value: 'ERROR_INCIDENTE' }, { label: 'Requerimiento / Mejora', value: 'REQUERIMIENTO_MEJORA' }];
  contextMenuSelection: Ticket | null = null;
  menuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.loadPresets();
    this.loadItems();
    this.openSharedTicket();
  }

  private openSharedTicket(): void {
    const token = this.route.snapshot.queryParamMap.get('sharedTicketToken');
    if (!token) return;

    this.service.resolverTicketCompartido(token).subscribe({
      next: ({ id }) => {
        if (Number.isInteger(id) && id > 0) this.drawers.abrirTicketDrawer(id);
        this.clearSharedTicketToken();
      },
      error: () => this.clearSharedTicketToken(),
    });
  }

  private clearSharedTicketToken(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sharedTicketToken: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  ngOnDestroy(): void {
    this.drawerClosedSubscription.unsubscribe();
  }

  private loadPresets(): void {
    this.presetService.list(this.pantalla).subscribe({
      next: (presets) => this.presets.set(presets),
      error: () => this.showError({ error: { message: 'No se pudieron cargar los presets.' } }),
    });
  }

  private captureFilterState(): FiltroState {
    return { search: this.search, estado: this.estado };
  }

  applyPreset(id: string): void {
    const preset = this.presets().find((item) => item.id === id);
    if (!preset) return;
    const filtros = preset.filtros;
    this.search = typeof filtros['search'] === 'string' ? filtros['search'] : '';
    this.estado = typeof filtros['estado'] === 'string' ? filtros['estado'] as TicketState | '' : '';
    this.selectedPresetId = id;
    this.page = 1;
    if (this.table) this.table.first = 0;
    this.loadItems();
  }

  savePreset(event: { id: string; name: string }): void {
    const request = event.id
      ? this.presetService.update(this.pantalla, event.id, event.name, this.captureFilterState())
      : this.presetService.create(this.pantalla, event.name, this.captureFilterState());
    request.subscribe({
      next: (preset) => {
        this.selectedPresetId = preset.id;
        this.loadPresets();
      },
      error: (error) => this.showError(error),
    });
  }

  removePreset(id: string): void {
    this.presetService.remove(this.pantalla, id).subscribe({
      next: () => {
        this.selectedPresetId = '';
        this.loadPresets();
      },
      error: (error) => this.showError(error),
    });
  }

  setPresetDefault(id: string): void {
    this.presetService.setDefault(this.pantalla, id).subscribe({
      next: () => this.loadPresets(),
      error: (error) => this.showError(error),
    });
  }

  clearFilters(): void {
    this.clearingFilters = true;
    this.table?.clear();
    this.search = '';
    this.estado = ''; this.prioridad = ''; this.tipo = '';
    this.idFilter = ''; this.subjectFilter = ''; this.clientFilter = ''; this.externalReferenceFilter = ''; this.eventsFilter = ''; this.assignedUserFilter = ''; this.createdFrom = ''; this.createdTo = '';
    this.selectedPresetId = '';
    this.page = 1;
    if (this.table) this.table.first = 0;
    this.clearingFilters = false;
    this.loadItems();
  }

  onFilterChange(): void {
    this.page = 1;
    if (this.table) this.table.first = 0;
    this.loadItems();
  }

  loadItems(): void {
    this.loading.show();
     this.service.list({ search: this.search, id: this.idFilter ? Number(this.idFilter) : undefined, subject: this.subjectFilter || undefined, client: this.clientFilter || undefined, status: this.estado || undefined, priority: this.prioridad || undefined, type: this.tipo || undefined, externalReference: this.externalReferenceFilter || undefined, events: this.eventsFilter || undefined, assignedUser: this.assignedUserFilter || undefined, createdFrom: this.createdFrom || undefined, createdTo: this.createdTo || undefined, page: this.page, limit: this.limit, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(finalize(() => this.loading.hide())).subscribe({
      next: (result) => { this.tickets = result.data; this.total = result.total; this.cdr.detectChanges(); },
      error: (error) => this.showError(error),
    });
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.limit = event.rows ?? this.limit;
    this.page = Math.floor((event.first ?? 0) / this.limit) + 1;
    this.loadItems();
  }

  onSort(event: { field?: string; order?: number }): void {
    if (!['subject', 'clientName', 'status', 'priority', 'type', 'createdAt'].includes(event.field as string)) return;
    this.sortField = event.field as TicketSortField;
    this.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.page = 1;
    if (this.table) this.table.first = 0;
    this.loadItems();
  }

  canRead(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.LEER)); }
  canManage(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.GESTIONAR)); }
  canCreateEvent(): boolean { return this.permissions.can(buildPermiso(PermisoClave.EVENTO, PermisoAccion.CREAR)); }

  buildContextMenu(ticket: Ticket | null): void {
    this.contextMenuSelection = ticket;
    if (!ticket) {
      this.menuItems = [];
      return;
    }

    this.menuItems = [
      { label: 'Ver ticket', icon: 'pi pi-eye', command: () => this.openSelectedTicket() },
      ...(this.canManage() ? [
        { label: 'Cambiar estado', icon: 'pi pi-arrow-right-arrow-left', command: () => this.manageSelectedTicket((item) => this.transition(item)) },
        { label: 'Referencia Externa', icon: 'pi pi-pencil', command: () => this.manageSelectedTicket((item) => this.updateReference(item)) },
      ] : []),
      ...(this.canCreateEvent() ? [
        { label: 'Crear evento', icon: 'pi pi-calendar-plus', command: () => this.createSelectedEvent() },
      ] : []),
    ];
  }

  private openSelectedTicket(): void {
    if (this.contextMenuSelection) this.open(this.contextMenuSelection);
  }

  private manageSelectedTicket(action: (ticket: Ticket) => void): void {
    if (this.contextMenuSelection && this.canManage()) action(this.contextMenuSelection);
  }

  private createSelectedEvent(): void {
    if (this.contextMenuSelection && this.canCreateEvent()) this.createEvent(this.contextMenuSelection);
  }

  open(ticket: Ticket): void {
    if (!this.canRead()) return;
    this.drawers.abrirTicketDrawer(ticket.id);
  }

  openAssignedUser(userId: string, event: Event): void {
    event.stopPropagation();
    this.drawers.abrirUsuarioDrawer(userId);
  }

  transition(ticket: Ticket): void {
    if (!this.canManage()) return;
    this.service.allowedTransitions(ticket.id).subscribe({
      next: (transitions) => {
        this.openAction('state', ticket, { transitions })
      },
      error: (error) => this.showError(error),
    });
  }

  updateReference(ticket: Ticket): void { if (this.canManage()) this.openAction('reference', ticket); }

  createEvent(ticket: Ticket): void {
    if (!this.canCreateEvent()) return;
    this.ref = this.dialog.open(EventoCrud, {
      header: 'Nuevo Evento', width: 'min(1000px, 96vw)', modal: true, maximizable: true, closable: true,
      data: { modo: 'A', item: null, requiredPermission: buildPermiso(PermisoClave.EVENTO, PermisoAccion.CREAR), submitExternally: (formData: FormData) => this.service.createEvent(ticket.id, formData), fixedClient: { id: ticket.clientId, sigla: ticket.clientCode, nombre: ticket.clientName } },
    });
    this.ref?.onClose.subscribe((result: { changed?: boolean } | null) => {
      if (result?.changed) this.loadItems();
    });
  }

  statusLabel(status: string): string {
    return ({
      INGRESADO: 'Ingresado',
      EN_REVISION: 'En revisión',
      EN_DESARROLLO: 'En desarrollo',
      ESPERANDO_RESPUESTA_CLIENTE: 'Esperando respuesta del cliente',
      RECHAZADO: 'Rechazado',
      CERRADO: 'Cerrado',
    } as Record<string, string>)[status] ?? status.replaceAll('_', ' ');
  }

  statusClass(status: TicketState): string {
    return { INGRESADO: 'text-bg-secondary', EN_REVISION: 'text-bg-info', EN_DESARROLLO: 'text-bg-primary', ESPERANDO_RESPUESTA_CLIENTE: 'text-bg-warning', RECHAZADO: 'text-bg-danger', CERRADO: 'text-bg-dark' }[status] || 'text-bg-secondary';
  }

  onColumnFilter(event: TableFilterEvent): void {
    if (this.clearingFilters) return;
    const value = (field: string): string => {
      const metadata = event.filters?.[field];
      const first = Array.isArray(metadata) ? metadata[0] : metadata;
      const constraint = first?.constraints?.[0] ?? first;
      const raw = constraint?.value;
      if (raw instanceof Date) return raw.toISOString().slice(0, 10);
      return raw == null ? '' : String(raw).trim();
    };
    this.idFilter = value('id'); this.subjectFilter = value('subject'); this.clientFilter = value('client');
    this.estado = value('status') as TicketState | ''; this.prioridad = value('priority'); this.tipo = value('type');
    this.externalReferenceFilter = value('externalReference'); this.eventsFilter = value('events'); this.assignedUserFilter = value('assignedUser');
    this.createdFrom = value('createdFrom'); this.createdTo = value('createdTo'); this.onFilterChange();
  }
  priorityLabel(value: string): string { return ({ CRITICA: '🔴 Crítica', ALTA: '🟠 Alta', MEDIA: '🟡 Media', BAJA: '🟢 Baja' } as Record<string, string>)[value] ?? '🟡 Media'; }
  typeLabel(value: string | null): string { return ({ CONSULTA: 'Consultas', ERROR_INCIDENTE: 'Error / Incidente', REQUERIMIENTO_MEJORA: 'Requerimiento / Mejora' } as Record<string, string>)[value ?? ''] ?? 'Sin clasificar'; }

  /*
  this.dialogService.open(ChangelogModalComponent, {
        header: 'Novedades',
        width: '600px',
        modal: true,
        dismissableMask: true,
        styleClass: 'changelog-dialog'
      });
  */
  private openAction(mode: 'state' | 'reference', ticket: Ticket, data: Record<string, unknown> = {}): void {
    this.ref = this.dialog.open(TicketActionDialog, {
      header: mode === 'state' ? 'Actualizar estado' : 'Referencia externa',
      width: 'min(520px, 96vw)',
      modal: true,
      closable: true,
      data: { mode, ticketId: ticket.id, reference: ticket.externalReference, ...data },
    });

    this.ref?.onClose.subscribe((changed) => { if (changed) this.loadItems(); });
  }

  private showError(error: any): void {
    this.messages.add({ severity: 'error', summary: 'Error', detail: error?.error?.message || 'Ticket operation failed.' });
  }
}
