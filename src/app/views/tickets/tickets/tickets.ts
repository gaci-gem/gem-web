import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { UiCard } from '@app/components/ui-card';
import { LoadingService } from '@core/services/loading.service';
import { TicketService } from '@core/services/ticket';
import { TICKET_STATES, Ticket, TicketState } from '@core/interfaces/ticket';
import { DrawerService } from '@core/services/drawer.service';
import { TicketActionDialog } from '../ticket/ticket-action-dialog';
import { EventoCrud } from '../../evento/evento-crud/evento-crud';
import { PermisosService } from '@core/services/permisos';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';

@Component({
  selector: 'app-tickets',
  imports: [CommonModule, FormsModule, UiCard, TableModule, ToastModule, ToolbarModule, NgIcon, DatePipe],
  providers: [DialogService, MessageService],
  templateUrl: './tickets.html',
  styles: ['.ticket-status-badge { min-width: 8.5rem; height: 1.75rem; align-items: center; justify-content: center; }'],
})
export class Tickets implements OnInit {
  private readonly service = inject(TicketService);
  private readonly dialog = inject(DialogService);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly drawers = inject(DrawerService);
  private readonly permissions = inject(PermisosService);
  private ref: DynamicDialogRef | null = null;

  tickets: Ticket[] = [];
  search = '';
  estado: TicketState | '' = '';
  readonly states = TICKET_STATES.map((value) => ({ label: value.replaceAll('_', ' '), value }));

  ngOnInit(): void { this.loadItems(); }

  loadItems(): void {
    this.loading.show();
    this.service.list({ search: this.search, estado: this.estado || undefined }).pipe(finalize(() => this.loading.hide())).subscribe({
      next: (tickets) => { this.tickets = tickets; this.cdr.detectChanges(); },
      error: (error) => this.showError(error),
    });
  }

  canRead(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.LEER)); }
  canManage(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.GESTIONAR)); }
  canCreateEvent(): boolean { return this.permissions.can(buildPermiso(PermisoClave.EVENTO, PermisoAccion.CREAR)); }

  open(ticket: Ticket): void {
    if (!this.canRead()) return;
    this.drawers.abrirTicketDrawer(ticket.id);
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

  reply(ticket: Ticket): void { if (this.canManage()) this.openAction('comment', ticket); }

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

  statusLabel(status: TicketState): string { return status.replaceAll('_', ' '); }

  statusClass(status: TicketState): string {
    return { INGRESADO: 'text-bg-secondary', EN_REVISION: 'text-bg-info', EN_DESARROLLO: 'text-bg-primary', RESUELTO: 'text-bg-success', CERRADO: 'text-bg-dark', RECHAZADO: 'text-bg-danger' }[status];
  }

  /*
  this.dialogService.open(ChangelogModalComponent, {
        header: 'Novedades',
        width: '600px',
        modal: true,
        dismissableMask: true,
        styleClass: 'changelog-dialog'
      });
  */
  private openAction(mode: 'state' | 'reference' | 'comment', ticket: Ticket, data: Record<string, unknown> = {}): void {
    this.ref = this.dialog.open(TicketActionDialog, {
      header: mode === 'state' ? 'Actualizar estado' : mode === 'reference' ? 'Referencia externa' : 'Responder ticket',
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
