import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NgIcon } from '@ng-icons/core';
import { TimeAgoComponent } from '@app/components/time-ago/time-ago';
import { TicketActividad } from '@core/interfaces/ticket';

@Component({
  selector: 'app-ticket-activity-dialog',
  standalone: true,
  imports: [CommonModule, NgIcon, TimeAgoComponent],
  template: `
    <div class="ticket-activity">
      @for (item of actividades; track item.id) {
        <article class="ticket-activity__item">
          <span class="ticket-activity__icon" aria-hidden="true"><ng-icon [name]="actividadIcon(item.accion)" size="14" /></span>
          <div class="flex-grow-1"><h4 class="h6 mb-1">{{ actividadTitulo(item.accion) }}</h4><p class="mb-1 text-muted">{{ actividadDescripcion(item) }}</p><p class="mb-0 small text-body-secondary">{{ actividadActor(item) }} · <app-time-ago [fecha]="item.createdAt" /></p></div>
        </article>
      } @empty { <div class="text-muted">Sin actividad registrada.</div> }
    </div>
  `,
  styles: [`.ticket-activity__item { position: relative; display: flex; gap: .75rem; }.ticket-activity__item:not(:last-child) { padding-bottom: 1rem; }.ticket-activity__item:not(:last-child)::before { content: ''; position: absolute; left: .8rem; top: 1.65rem; bottom: 0; border-left: 1px solid var(--ins-border-color); }.ticket-activity__icon { z-index: 1; flex: 0 0 1.6rem; width: 1.6rem; height: 1.6rem; border: 1px solid var(--ins-border-color); border-radius: 50%; background: var(--bs-tertiary-bg); display: inline-flex; align-items: center; justify-content: center; }`],
})
export class TicketActivityDialog {
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  actividades: TicketActividad[] = this.config.data?.actividades ?? [];

  actividadIcon(accion: string): string { return ({ ACTUALIZAR_PRIORIDAD: 'lucideTags', CAMBIAR_ESTADO: 'lucideRefreshCw', ASIGNAR_USUARIO: 'lucideUserRound', ACTUALIZAR_MODULO: 'lucideBoxes', AGREGAR_COMENTARIO: 'lucideMessageCircle', ASOCIAR_EVENTO: 'lucideLink' } as Record<string, string>)[accion] ?? 'lucideHistory'; }
  actividadTitulo(accion: string): string { return ({ ACTUALIZAR_PRIORIDAD: 'Se actualizó la prioridad', CAMBIAR_ESTADO: 'Se cambió el estado', ASIGNAR_USUARIO: 'Se actualizó el usuario asignado', ACTUALIZAR_MODULO: 'Se actualizó el módulo', AGREGAR_COMENTARIO: 'Se agregó un comentario', ASOCIAR_EVENTO: 'Se asoció un evento' } as Record<string, string>)[accion] ?? 'Se actualizó el ticket'; }
  actividadDescripcion(item: TicketActividad): string {
    const data = { ...(item.snapshot ?? {}), ...(item.metadata ?? {}) };
    const value = (key: string) => typeof data[key] === 'string' ? String(data[key]) : '';
    if (item.accion === 'ACTUALIZAR_PRIORIDAD') return `De ${this.priorityText(value('anterior'))} a ${this.priorityText(value('nuevo'))}.`;
    if (item.accion === 'CAMBIAR_ESTADO') return `De ${this.statusLabel(value('estadoAnterior'))} a ${this.statusLabel(value('estadoNuevo'))}.`;
    return '';
  }
  actividadActor(item: TicketActividad): string { return item.actorNombre ? `Por ${item.actorNombre}` : 'Por sistema'; }
  private priorityText(value: string): string { return ({ CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' } as Record<string, string>)[value] ?? 'Sin prioridad'; }
  private statusLabel(value: string): string { return ({ INGRESADO: 'Ingresado', EN_REVISION: 'En revisión', EN_DESARROLLO: 'En desarrollo', ESPERANDO_RESPUESTA_CLIENTE: 'Esperando respuesta del cliente', RECHAZADO: 'Rechazado', CERRADO: 'Cerrado' } as Record<string, string>)[value] ?? (value ? value.replaceAll('_', ' ') : 'Sin estado'); }
  cerrar(): void { this.ref.close(); }
}
