import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ItemActividadComponent } from '../../../evento/components/item-actividad/item-actividad';
import { VidaEvento } from '@core/interfaces/evento';
import { ACCIONES } from '@/app/constants/actividad_acciones';
import { getTimeAgo } from '@/app/utils/datetime-utils';
import { ComentarioTextoComponent } from '../../../evento/components/comentario-texto/comentario-texto';
import { DrawerService } from '@core/services/drawer.service';
import { UsuarioService } from '@core/services/usuario';
import { MentionOption, MentionTextareaComponent } from '@app/components/mention-textarea/mention-textarea';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-evento-v2-activity',
  standalone: true,
  imports: [ButtonModule, FormsModule, ItemActividadComponent, ComentarioTextoComponent, MentionTextareaComponent],
  templateUrl: './evento-v2-activity.html',
  styleUrl: './evento-v2-activity.scss',
})
export class EventoV2ActivityComponent implements OnInit {
  private readonly drawerService = inject(DrawerService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly cdRef = inject(ChangeDetectorRef);

  private _actividades: VidaEvento[] = [];

  @Input({ required: true })
  set actividades(value: VidaEvento[]) {
    this._actividades = value ?? [];
    this.rebuildActividadView();
  }
  get actividades(): VidaEvento[] {
    return this._actividades;
  }

  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() publicarComentario = new EventEmitter<string>();
  @Output() refreshActividad = new EventEmitter<void>();

  readonly ACCIONES = ACCIONES;
  comentario = '';
  usuarioOptions: MentionOption[] = [];
  mostrarFiltros = false;
  mostrarTodasLasActividades = false;
  tiposSeleccionados = new Set<string>();
  actividadesFiltradasOrdenadas: VidaEvento[] = [];
  actividadesMostradas: VidaEvento[] = [];
  hayMasDeSieteActividades = false;

  getInitials(usuario?: string): string {
    if (!usuario) return 'US';
    return usuario.slice(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.usuarioService.getAll().pipe(
      finalize(() => {
        this.cdRef.detectChanges();
      })
    )
    .subscribe({
      next: (usuarios) => {
        this.usuarioOptions = usuarios.map((u) => ({
          id: u.id ?? u.usuario,
          label: `${u.nombre} ${u.apellido}`,
          value: u.usuario,
          sublabel: u.usuario,
          color: u.color,
        }));
      },
    });
  }

  getComentarioTexto(item: VidaEvento): string {
    return item.adicion?.comentario?.texto || '';
  }

  getComentarioTiempo(item: VidaEvento): string {
    return getTimeAgo(new Date(item.fecha));
  }

  get tiposActividadDisponibles(): string[] {
    const tipos = new Set<string>();
    for (const actividad of this.actividades ?? []) {
      if (actividad.accion) tipos.add(actividad.accion);
    }
    return Array.from(tipos).sort((a, b) => a.localeCompare(b));
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  toggleTipoActividad(tipo: string): void {
    if (this.tiposSeleccionados.has(tipo)) {
      this.tiposSeleccionados.delete(tipo);
    } else {
      this.tiposSeleccionados.add(tipo);
    }
    this.mostrarTodasLasActividades = false;
    this.rebuildActividadView();
  }

  limpiarFiltros(): void {
    this.tiposSeleccionados.clear();
    this.mostrarTodasLasActividades = false;
    this.rebuildActividadView();
  }

  toggleVerMas(): void {
    this.mostrarTodasLasActividades = !this.mostrarTodasLasActividades;
    this.rebuildActividadView();
  }

  onPublicar(): void {
    const texto = this.comentario.trim();
    if (!texto) return;

    this.publicarComentario.emit(texto);
    this.comentario = '';
  }

  abrirUsuarioDrawer(usuarioId: string): void {
    if (!usuarioId) return;
    this.drawerService.abrirUsuarioDrawer(usuarioId);
  }

  trackActividad(index: number, item: VidaEvento): string {
    const idPart = item.id !== undefined && item.id !== null ? String(item.id) : `idx-${index}`;
    return `${idPart}-${item.eventoId}-${item.accion}-${item.usuarioId}-${this.getFechaMs(item)}`;
  }

  private rebuildActividadView(): void {
    const ordenadas = [...(this.actividades ?? [])].sort((a, b) => this.getFechaMs(b) - this.getFechaMs(a));
    const filtradas = !this.tiposSeleccionados.size
      ? ordenadas
      : ordenadas.filter((actividad) => this.tiposSeleccionados.has(actividad.accion));

    this.actividadesFiltradasOrdenadas = filtradas;
    this.hayMasDeSieteActividades = filtradas.length > 7;
    this.actividadesMostradas = (this.mostrarTodasLasActividades || !this.hayMasDeSieteActividades)
      ? filtradas
      : filtradas.slice(0, 7);
  }

  private getFechaMs(item: VidaEvento): number {
    const dt = item.fecha ? new Date(item.fecha) : null;
    const ms = dt?.getTime() ?? 0;
    return Number.isNaN(ms) ? 0 : ms;
  }
}
