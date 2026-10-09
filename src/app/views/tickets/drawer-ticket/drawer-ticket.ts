import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BadgeClickComponent } from '@app/components/badge-click';
import { Ticket, TicketComment, TicketDetail, TicketEvent } from '@core/interfaces/ticket';
import { TicketService } from '@core/services/ticket';
import { Evento, EventoCompleto } from '@core/interfaces/evento';
import { DrawerService } from '@core/services/drawer.service';
import { PermisosService } from '@core/services/permisos';
import { PermisoClave } from '@core/interfaces/rol';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { environment } from '@/environments/environment';
import { UiCard } from '@app/components/ui-card';
import { Modulo } from '@core/interfaces/modulo';
import { ModuloSelect } from '@/app/views/modulo/modulo-select/modulo-select';
import { UsuarioSelect } from '@/app/views/usuario/usuario-select/usuario-select';
import { Usuario } from '@core/interfaces/usuario';
import { modalConfig } from '@/app/types/modals';
import { EventoSelect } from '@/app/views/evento/evento-select/evento-select';

@Component({
  selector: 'app-drawer-ticket',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, DrawerModule, ButtonModule, DialogModule, BadgeClickComponent, UiCard, NgIcon],
  templateUrl: './drawer-ticket.html',
  styles: `
    :host { display: block; }
     .ticket-drawer__eyebrow, .ticket-drawer__label { color: var(--ins-secondary-color); font-size: .68rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
     .ticket-drawer__subject { margin: 0; color: var(--bs-body-color); font-size: 1.45rem; font-weight: 700; }
     .ticket-drawer__body { position: relative; background: var(--bs-tertiary-bg); }
        .ticket-comment-card { border-bottom: 1px solid var(--ins-border-color); padding: .8rem 0; }
     .ticket-comment-icon { flex: 0 0 2rem; width: 2rem; height: 2rem; color: var(--bs-primary); background: var(--bs-tertiary-bg); border: 1px solid var(--ins-border-color); }
       .ticket-card--header { padding: 1.25rem; }
      .ticket-card__top { border-bottom: 1px solid var(--ins-border-color); padding-bottom: 1rem; }
      .ticket-card__identity { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-top: .35rem; }
       .ticket-card__title { display: flex; align-items: center; gap: .65rem; min-width: 0; font-size: 1.45rem; line-height: 1.2; font-weight: 700; }
       .ticket-card__origin-icon { margin-right: .35rem; }
      .ticket-card__title .ticket-drawer__subject { min-width: 0; }
      .ticket-drawer__metadata { margin-top: 1rem; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem 1.5rem; }
      .ticket-drawer__metadata > div { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
      .ticket-drawer__module-row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; width: 100%; min-width: 0; }
       .ticket-drawer__module-value { min-width: 0; overflow-wrap: anywhere; }
       .ticket-drawer__assignment-row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; width: 100%; min-width: 0; }
       .ticket-drawer__assignment-value { min-width: 0; overflow-wrap: anywhere; }
      .ticket-status-badge { min-width: 8.5rem; height: 1.75rem; align-items: center; justify-content: center; align-self: flex-start; line-height: 1; text-align: center; }
     .ticket-section__heading { margin-bottom: .75rem; }
      .ticket-section__heading h3 { margin: 0; color: var(--ins-secondary-color); font-size: .68rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
      .ticket-related-events { border-top: 1px solid var(--ins-border-color); padding: 1rem 1.25rem 1.25rem; }
    .ticket-comment-card { padding: .8rem 1rem; }
    .ticket-attachments { display: flex; flex-direction: column; gap: .5rem; }
     .ticket-attachment-row { display: flex; align-items: center; gap: .6rem; padding: .65rem .75rem; border: 1px solid var(--ins-border-color); border-radius: .4rem; color: inherit; text-decoration: none; background: var(--bs-tertiary-bg); }
    .ticket-attachment-row:hover, .ticket-attachment-row:focus-visible { border-color: var(--bs-primary); }
     .ticket-readable-text { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }
     .ticket-drawer__content-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 1fr); gap: 1rem; }
     @media screen and (max-width: 992px) { .ticket-drawer__metadata { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
     @media screen and (max-width: 640px) { .ticket-drawer__metadata { grid-template-columns: 1fr; } }
     @media screen and (max-width: 800px) { .ticket-drawer__content-grid { grid-template-columns: 1fr; } }
    @media screen and (max-width: 960px) { ::ng-deep .ticket-drawer { width: 80vw !important; } }
    @media screen and (max-width: 640px) { ::ng-deep .ticket-drawer { width: 100vw !important; } }
  `,
})
export class DrawerTicket {
  readonly apiBaseUrl = environment.BASE_URL;
  private readonly service = inject(TicketService);
  private readonly drawerService = inject(DrawerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissions = inject(PermisosService);
  private readonly dialogService = inject(DialogService);

  @Input() visible = false;
  @Input() ticketId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  ticket: TicketDetail | null = null;
  loading = false;
  error: string | null = null;
  private loadedKey: string | null = null;
  associationError: string | null = null;
  associatingEventId: string | null = null;
  commentDraft = '';
  commentSaving = false;
  commentError: string | null = null;
  commentPrivate = false;
  commentsExpanded = false;
  shareFeedback = '';
  sharingLink = false;
  private shareFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  moduleSaving = false;
  moduleError: string | null = null;
  emailDialogVisible = false;
  emailOriginal: import('@core/services/ticket').EmailOriginalView | null = null;
  emailLoading = false;
  private moduloDialog: DynamicDialogRef | null = null;
  private eventoDialog: DynamicDialogRef | null = null;
  private usuarioDialog: DynamicDialogRef | null = null;
  userSaving = false; userError: string | null = null;
  prioritySaving = false; typeSaving = false;

  async compartirLink(): Promise<void> {
    if (!this.ticket || this.sharingLink) return;
    this.sharingLink = true;
    this.shareFeedback = '';
    this.service.emitirLinkCompartido(this.ticket.id).subscribe({
      next: async ({ url, destinos }) => {
        const generatedUrl = url ?? destinos[0]?.url;
        const copied = generatedUrl ? await this.copyGeneratedUrl(generatedUrl) : false;
        this.sharingLink = false;
        this.shareFeedback = copied ? 'Link compartido copiado' : 'No pudimos copiar el link compartido';
        this.showShareFeedback();
        this.cdr.detectChanges();
      },
      error: () => {
        this.sharingLink = false;
        this.shareFeedback = 'No pudimos generar el link compartido';
        this.showShareFeedback();
        this.cdr.detectChanges();
      },
    });
  }

  private async copyGeneratedUrl(url: string): Promise<boolean> {
    if (!url) return false;
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch { /* Use the legacy fallback below. */ }
    }
    if (!copied) {
      const input = document.createElement('textarea');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      copied = document.execCommand('copy');
      input.remove();
    }
    return copied;
  }

  private showShareFeedback(): void {
    if (this.shareFeedbackTimeout) clearTimeout(this.shareFeedbackTimeout);
    this.shareFeedbackTimeout = setTimeout(() => {
      this.shareFeedback = '';
      this.cdr.detectChanges();
    }, 1800);
  }

  ngOnChanges(): void {
    if (!this.canRead()) { this.ticket = null; return; }
    this.loadTicket();
  }

  canRead(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.LEER)); }

  provenanceLabel(comment: { source?: string; displayName?: string | null }): string {
    const source = ({ GEM_CLIENTES: 'GEM Clientes', GEM_WEB: 'GEM Web', EMAIL: 'Email', SYSTEM: 'System' } as Record<string, string>)[comment.source ?? 'SYSTEM'] ?? 'Unknown source';
    return comment.displayName ? `${comment.displayName} · ${source}` : source;
  }

  private loadTicket(): void {
    if (!this.visible || !this.ticketId) return;
    const key = `${this.visible}:${this.ticketId}`;
    if (this.loadedKey === key) return;
    this.loadedKey = key;
    this.error = null;
    this.commentDraft = '';
    this.commentError = null;
    this.commentsExpanded = false;
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
       ESPERANDO_RESPUESTA_CLIENTE: 'text-bg-warning',
       CERRADO: 'text-bg-dark',
      RECHAZADO: 'text-bg-danger',
    }[status] || 'text-bg-secondary';
  }

  openEvent(eventId: string): void {
    this.drawerService.abrirEventoDrawer(eventId);
  }

  statusLabel(status: string): string {
    return ({ INGRESADO: 'Ingresado', EN_REVISION: 'En revisión', EN_DESARROLLO: 'En desarrollo', ESPERANDO_RESPUESTA_CLIENTE: 'Esperando respuesta del cliente', RECHAZADO: 'Rechazado', CERRADO: 'Cerrado' } as Record<string, string>)[status] ?? status.replaceAll('_', ' ');
  }
  priorityLabel(value: string): string { return ({ CRITICA: '🔴 Crítica', ALTA: '🟠 Alta', MEDIA: '🟡 Media', BAJA: '🟢 Baja' } as Record<string, string>)[value] ?? '🟡 Media'; }
  typeLabel(value: string | null): string { return ({ CONSULTA: 'Consultas', ERROR_INCIDENTE: 'Error / Incidente', REQUERIMIENTO_MEJORA: 'Requerimiento / Mejora' } as Record<string, string>)[value ?? ''] ?? 'Sin clasificar'; }
  updatePriority(value: string): void { if (!this.ticket || !this.canManage() || this.prioritySaving) return; this.prioritySaving = true; this.service.updatePriority(this.ticket.id, value as Ticket['priority']).pipe(finalize(() => { this.prioritySaving = false; this.cdr.detectChanges(); })).subscribe({ next: updated => this.ticket = { ...this.ticket!, priority: updated.priority }, error: () => this.cdr.detectChanges() }); }
  updateType(value: string): void { if (!this.ticket || !this.canManage() || this.typeSaving) return; this.typeSaving = true; this.service.updateType(this.ticket.id, (value || null) as Ticket['type']).pipe(finalize(() => { this.typeSaving = false; this.cdr.detectChanges(); })).subscribe({ next: updated => this.ticket = { ...this.ticket!, type: updated.type }, error: () => this.cdr.detectChanges() }); }

  openAssignedUser(userId: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.drawerService.abrirUsuarioDrawer(userId);
  }

  canManage(): boolean { return this.permissions.can(buildPermiso(PermisoClave.TICKET, PermisoAccion.GESTIONAR)); }

  get sortedComments(): TicketComment[] {
    return [...(this.ticket?.comments ?? [])].sort((a, b) => this.commentTimestamp(b) - this.commentTimestamp(a));
  }

  get latestEmailOriginal(): { id: string } | null {
    for (const comment of this.sortedComments) {
      if (comment.source !== 'EMAIL') continue;
      const file = (comment.attachments ?? []).find(attachment => attachment.mimeType.toLowerCase() === 'message/rfc822');
      if (file) return file;
    }
    return null;
  }

  isHiddenEmailAttachment(file: { name: string; mimeType: string }): boolean {
    return file.mimeType.toLowerCase() === 'message/rfc822' || file.name.toLowerCase().endsWith('.eml');
  }

  openModuleSelector(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const opener = event.currentTarget as HTMLElement | null;
    this.moduloDialog = this.dialogService.open(ModuloSelect, {
      ...modalConfig,
      header: 'Seleccionar Modulo',
    });
    if (!this.moduloDialog) return;
    this.moduloDialog.onClose.subscribe((result: Modulo | undefined) => {
      if (result) this.updateModule(result.codigo);
      setTimeout(() => opener?.focus());
    });
  }

  clearModule(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateModule(null);
  }

  openUserSelector(event: Event): void { event.preventDefault(); event.stopPropagation(); if (this.userSaving) return; this.usuarioDialog = this.dialogService.open(UsuarioSelect, { ...modalConfig, header: 'Seleccionar usuario activo' }); this.usuarioDialog?.onClose.subscribe((user: Usuario | undefined) => { if (user?.id) this.updateUser(user.id); }); }
  clearUser(event: Event): void { event.preventDefault(); event.stopPropagation(); this.updateUser(null); }
  updateUser(value: string | null): void { if (!this.ticket || !this.canManage() || this.userSaving) return; this.userSaving = true; this.userError = null; this.service.updateUser(this.ticket.id, value).pipe(finalize(() => { this.userSaving = false; this.cdr.detectChanges(); })).subscribe({ next: updated => { const rawUser = updated.assignedUser ?? (updated as Ticket & { usuarioAsignado?: { id: string; nombre: string; apellido?: string | null; email: string; color: string | null } | null }).usuarioAsignado ?? null; const assignedUser = rawUser && 'name' in rawUser ? rawUser : rawUser ? { id: rawUser.id, name: [rawUser.nombre, rawUser.apellido].filter(Boolean).join(' '), email: rawUser.email, color: rawUser.color } : null; this.ticket = { ...this.ticket!, assignedUser }; this.cdr.detectChanges(); }, error: error => { this.userError = error?.error?.message || 'No se pudo actualizar el usuario asignado.'; this.cdr.detectChanges(); } }); }

  updateModule(value: string | null): void {
    if (!this.ticket || !this.canManage() || this.moduleSaving) return;
    this.moduleSaving = true; this.moduleError = null;
    this.cdr.detectChanges();
    this.service.updateModule(this.ticket.id, value || null).pipe(finalize(() => {
      Promise.resolve().then(() => {
        this.moduleSaving = false;
        this.cdr.detectChanges();
      });
    })).subscribe({
      next: updated => Promise.resolve().then(() => {
        const rawModule = (updated.module ?? (updated as Ticket & { modulo?: { codigo?: string; nombre?: string } }).modulo ?? null) as { code?: string; name?: string; codigo?: string; nombre?: string } | null;
        const responseModule = rawModule
          ? {
              code: rawModule.code ?? rawModule.codigo ?? '',
              name: rawModule.name ?? rawModule.nombre ?? '',
            }
          : null;
        this.ticket = { ...this.ticket!, module: responseModule };
        this.cdr.detectChanges();
      }),
      error: error => Promise.resolve().then(() => {
        this.moduleError = error?.error?.message || 'Could not update module.';
        this.cdr.detectChanges();
      }),
    });
  }

  get displayedComments(): TicketComment[] {
    return this.commentsExpanded ? this.sortedComments : this.sortedComments.slice(0, 7);
  }

  get hasMoreComments(): boolean { return (this.ticket?.comments.length ?? 0) > 7; }

  toggleComments(): void { this.commentsExpanded = !this.commentsExpanded; }

  openEmailOriginal(file: { id: string }): void {
    if (!this.ticket) return;
    this.emailDialogVisible = true;
    // Let PrimeNG finish opening the dialog before changing its projected content.
    setTimeout(() => {
      this.emailLoading = true;
      this.emailOriginal = null;
      this.cdr.markForCheck();
      this.service.emailOriginal(this.ticket!.id, file.id).pipe(finalize(() => {
        setTimeout(() => {
          this.emailLoading = false;
          this.cdr.markForCheck();
        });
      })).subscribe({
        next: value => setTimeout(() => {
          this.emailOriginal = {
            ...value,
            html: value.html ? this.normalizeEmailHtml(value.html) : value.html,
            attachments: value.attachments.map(file => ({
              ...file,
              downloadUrl: file.downloadUrl ? this.normalizeAttachmentUrl(file.downloadUrl) : file.downloadUrl,
            })),
          };
          this.cdr.markForCheck();
        }),
        error: () => setTimeout(() => {
          this.emailOriginal = { headers: {}, html: null, text: 'No se pudo cargar el correo original.', attachments: [] };
          this.cdr.markForCheck();
        }),
      });
    });
  }

  normalizeAttachmentUrl(url: string): string {
    if (!url.startsWith('/v1/')) return url;
    return `${this.apiBaseUrl.replace(/\/$/, '')}${url}`;
  }

  normalizeEmailHtml(html: string): string {
    const document = new DOMParser().parseFromString(html, 'text/html');
    for (const element of document.querySelectorAll<HTMLElement>('[src], [href]')) {
      for (const attribute of ['src', 'href']) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, this.normalizeAttachmentUrl(value));
      }
    }
    return document.body.innerHTML;
  }

  emailAttachmentKey(file: { id?: string; downloadUrl?: string; contentId?: string; name: string }, index: number): string {
    return `${file.id || file.downloadUrl || file.contentId || file.name}-${index}`;
  }

  submitComment(): void {
    const text = this.commentDraft.trim();
    if (!this.ticket || !this.canManage() || !text || this.commentSaving) return;
    this.commentSaving = true;
    this.commentError = null;
    this.service.comment(this.ticket.id, text, this.commentPrivate ? 'PRIVATE' : 'PUBLIC').pipe(finalize(() => {
      this.commentSaving = false;
      this.cdr.detectChanges();
    })).subscribe({
      next: (comment) => {
        this.ticket = { ...this.ticket!, comments: [comment, ...this.ticket!.comments] };
        this.commentDraft = '';
        this.commentPrivate = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.commentError = error?.error?.message || 'No se pudo enviar el comentario. Intentá nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  onCommentKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.ctrlKey && !keyboardEvent.metaKey) return;
    keyboardEvent.preventDefault();
    this.submitComment();
  }

  private commentTimestamp(comment: TicketComment): number {
    const timestamp = new Date(comment.createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  openEventAssociation(): void {
    if (!this.canManage() || !this.ticket) return;
    this.associationError = null;
    this.eventoDialog = this.dialogService.open(EventoSelect, {
      ...modalConfig,
      header: 'Seleccionar evento existente',
      data: {
         multiple: true,
         clienteId: this.ticket.clientId,
         excludedEventIds: this.ticket.events.map((event) => event.id),
         initialSelectedEventIds: this.ticket.events.map((event) => event.id),
      },
    });
    if (!this.eventoDialog) return;
     this.eventoDialog.onClose.subscribe((events: EventoCompleto[] | Evento | undefined) => {
       if (Array.isArray(events)) this.replaceEvents(events);
       else if (events) this.associateEvent(events);
     });
   }

   replaceEvents(events: Evento[]): void {
     if (!this.ticket) return;
     this.service.replaceEvents(this.ticket.id, events.map(event => event.id!).filter(Boolean)).subscribe({
         next: () => {
           setTimeout(() => {
             this.loadedKey = null;
             this.loadTicket();
           });
         },
       error: error => { this.associationError = error?.error?.message || 'No se pudieron actualizar los eventos.'; this.cdr.detectChanges(); },
     });
   }

  associateEvent(event: Evento): void {
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
          color: (event as Evento & { tipo?: { color?: string } }).tipo?.color || '#6c757d',
        };
        if (!this.ticket) return;
        this.ticket = { ...this.ticket, events: [...this.ticket.events, linkedEvent] };
        this.cdr.detectChanges();
      },
      error: (error) => { this.associationError = error?.error?.message || 'No se pudo asociar el evento.'; },
    });
  }

  onClose(): void { this.closed.emit(); }
}
