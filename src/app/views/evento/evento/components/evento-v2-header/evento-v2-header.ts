import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoCompleto, Evento, eventoFromEventoCompleto } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { DrawerService } from '@core/services/drawer.service';
import { BadgeClickComponent } from '@app/components/badge-click';
import { PrioridadIconComponent } from '@app/components/priority-icon';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { EstadosEvento, getEstadoDescCorto } from '@/app/constants/evento_estados';
import { NgIcon } from '@ng-icons/core';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { finalize } from 'rxjs';
import { EstimacionDetalle } from '../evento-v2-details-files/evento-v2-details-files';
import { Badge } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-evento-v2-header',
  standalone: true,
  imports: [DatePipe, SlicePipe, FormsModule, BadgeClickComponent, PrioridadIconComponent, NgIcon, PopoverModule],
  templateUrl: './evento-v2-header.html',
  styleUrl: './evento-v2-header.scss',
})
export class EventoV2HeaderComponent {
  private eventoService = inject(EventoService);
  private drawerService = inject(DrawerService);
  private userStorageService = inject(UserStorageService);
  private readonly cdRef = inject(ChangeDetectorRef);

  @Input({ required: true }) evento!: EventoCompleto;
  @Input() estimacionDetalle!: EstimacionDetalle | null;
  @Input() horasTrabajadas!: any | null;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();
  esObservador = false;
  togglingObservador = false;

  ngOnChanges(): void {
    this.syncObservadorState();
  }

  get codigoEvento(): string {
    return `${this.evento.tipoCodigo}-${this.evento.numero.toString().padStart(3, '0')}`;
  }

  get estadoDesc(): string {
    if (!this.evento.estado) return '';
    return getEstadoDescCorto(this.evento.estado).replace('.', '');
  }

  get estadoBadgeClass(): string {
    const estado = this.evento.estado;
    if (estado === EstadosEvento.En_Curso) return 'text-bg-primary';
    if (estado === EstadosEvento.Completado) return 'text-bg-success';
    if (estado === EstadosEvento.Rechazado) return 'text-bg-danger';
    if (estado === EstadosEvento.Cancelado) return 'text-bg-warning';
    return 'text-bg-secondary';
  }

  formatDateForInput(dateVal: string | Date | null | undefined): string | null {
    if (!dateVal) return null;
    const d = dateVal instanceof Date ? dateVal : parseIsoAsLocal(dateVal as any);
    if (!d || isNaN(d.getTime())) return null;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  onFechaChange(event: any, campo: string): void {
    const iso = event ? `${event}T00:00:00.000Z` : null;
    if (campo && this.evento) {
      (this.evento as any)[campo] = iso;
    }
    const aux: Evento = {
      ...eventoFromEventoCompleto(this.evento),
      [campo]: iso,
    };
    this.eventoService.update(this.evento.id!, aux).subscribe();
  }

  abrirUsuarioDrawer(usuarioId: string): void {
    this.drawerService.abrirUsuarioDrawer(usuarioId);
  }

  compartirEvento(): void {
    const baseUrl = window.location.origin;
    const eventoId = this.evento?.id ?? '';
    const eventoUrl = `${baseUrl}/evento/evento/${eventoId}`;

    navigator.clipboard.writeText(eventoUrl).catch(() => {
      // noop
    });
  }

  onToggleObservador(): void {
    if (!this.usuarioActivo?.id || !this.evento?.id) return;

    this.togglingObservador = true;
    this.eventoService
      .toggleObservador(this.evento.id, this.usuarioActivo.id)
      .pipe(finalize(() => {
        this.togglingObservador = false;
        this.cdRef.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.esObservador = !this.esObservador;
        },
      });
  }

  private syncObservadorState(): void {
    const usuarioId = this.usuarioActivo?.id;
    if (!usuarioId || !Array.isArray(this.evento?.observadores)) {
      this.esObservador = false;
      return;
    }

    this.esObservador = this.evento.observadores.some((o: any) => o?.usuarioId === usuarioId || o?.id === usuarioId);
  }

  getColorForCodigo(codigo: string): string {
    const map: Record<string, string> = {
      DEV: '#2196F3', TEST: '#4CAF50', ANAL: '#FF9800',
      REV: '#9C27B0', DESIGN: '#E91E63', ADMIN: '#607D8B',
      MEET: '#795548', OTHER: '#9E9E9E',
    };
    return map[codigo] || '#9E9E9E';
  }
}
