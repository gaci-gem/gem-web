import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  effect,
  inject,
  NgZone,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeClickComponent } from '@app/components/badge-click';
import { EventoCronometroComponent } from '@app/components/evento-cronometro';
import { PrioridadIconComponent } from '@app/components/priority-icon';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { UiCard } from '@app/components/ui-card';
import { modalConfig } from '@/app/types/modals';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { getTimestamp } from '@/app/utils/time-utils';
import { ShortcutDirective } from '@core/directive/shortcut';
import {
  CircularEvento,
  Evento,
  EventoCompleto,
  formatEventoNumero,
} from '@core/interfaces/evento';
import { PermisoClave } from '@core/interfaces/rol';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { EventoFilterState, FiltroState } from '@core/interfaces/filtro-preset';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { DrawerService } from '@core/services/drawer.service';
import { EventoAccionesService } from '@core/services/evento-acciones';
import { EventoTrabajoService } from '@core/services/evento-trabajo.service';
import { EventoService } from '@core/services/evento';
import { SseService } from '@core/services/sse.service';
import {
  UserStorageService,
  UsuarioLogeado,
} from '@core/services/user-storage';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { EventoCrud } from '../evento-crud/evento-crud';
import { ModalSel } from './components/modal-sel/modal-sel';
import { SelEventoPropio } from './components/sel-evento-propio/sel-evento-propio';
import { ContextMenuModule } from 'primeng/contextmenu';
import { KeyboardListNavigation } from '@app/components/keyboard-list-navigation/keyboard-list-navigation';

@Component({
  selector: 'app-eventos-usuario',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    BadgeClickComponent,
    DatePipe,
    CommonModule,
    NgbPopoverModule,
    TooltipModule,
    PrioridadIconComponent,
    NgbTooltipModule,
    DatePickerModule,
    FormsModule,
    ControlTrabajarCon,
    FiltroPresetsComponent,
    ContextMenuModule,
    KeyboardListNavigation,
  ],
  providers: [DialogService, MessageService, ConfirmationService],
  templateUrl: './eventos-usuario.html',
  styleUrl: './eventos-usuario.scss',
})
export class EventosUsuario extends TrabajarCon<Evento> {
  readonly pantalla = 'eventos-usuario';
  private eventoService = inject(EventoService);
  private eventoAccionesService = inject(EventoAccionesService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private userStorageService = inject(UserStorageService);
  private eventoTrabajoService = inject(EventoTrabajoService);
  private drawerService = inject(DrawerService);
  private sseService = inject(SseService);
  private zone = inject(NgZone);
  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
  @ViewChild('dt') table!: Table;
  private selecionarEventoPropio!: DynamicDialogRef | null;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos: EventoCompleto[] = [];
  selectedEventos: EventoCompleto[] = [];

  filtroFecha: Date[] | null = null;
  globalFilter = '';

  selectedEvento: EventoCompleto | null = null;
  menuItems: MenuItem[] = [];

  // Simplificar las propiedades del evento en trabajo
  eventoEnTrabajo: EventoCompleto | null = null;
  tiempoInicioTrabajo: Date | null = null;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService),
    );
    this.permisoClave = PermisoClave.EVENTO;

    effect(() => {
      const notificaciones = this.sseService.notifications();
      if (notificaciones.length === 0) return;

      const ultima = notificaciones[0];
      if (ultima?.targetType === 'EVENTO') {
        this.programarRefresco();
      }
    });
  }

  override ngOnInit(): void {
    const restored = this.restoreFilterSession() as EventoFilterState | null;
    this.filtroActivo = restored?.filtroActivo as FiltroActivo ?? this.filtroActivo;
    if (restored && Object.prototype.hasOwnProperty.call(restored, 'fecha')) {
      this.filtroFecha = this.normalizeDateRange(restored.fecha);
    } else if (!restored) {
      this.inicializarFiltroFecha();
    }
    this.globalFilter = restored?.globalFilter ?? '';
    this.searchValue.set(this.globalFilter);
    this.loadPresets();
    this.verificarEventoEnTrabajo();
    this.loadItems();

    // Suscribirse a cambios en el evento en trabajo
    this.eventoTrabajoService.eventoEnTrabajo$.subscribe((evento) => {
      this.eventoEnTrabajo = evento;
      this.cdr.detectChanges();
    });

    this.eventoTrabajoService.tiempoInicio$.subscribe((tiempo) => {
      this.tiempoInicioTrabajo = tiempo;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    const state = this.restoreFilterSession();
    if (state) this.restoreTableState(state, this.table);
  }

  buildContextMenu(e: EventoCompleto | null): void {
    this.selectedEvento = e;
    if (!e) {
      this.menuItems.splice(0, this.menuItems.length);
      return;
    }

    const items: MenuItem[] = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.abrirEventoDrawer(evento)),
      },
    ];

    if (!e.cerrado && !e.tipo?.propio) {
      const accionItems: MenuItem[] = [];

      if (e.etapaSiguiente) {
        if (e.etapaActualData?.deAutoriza) {
          accionItems.push({
            label: 'Autorizar',
            icon: 'pi pi-check-circle',
            command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.mostrarModalCrud(evento, 'AUT')),
          });
        } else {
          accionItems.push({
            label: 'Avanzar',
            icon: 'pi pi-forward',
            command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.mostrarModalCrud(evento, 'AVZ')),
          });
        }
      }

      if (e.etapaAnterior) {
        if (e.etapaActualData?.deAutoriza) {
          accionItems.push({
            label: 'Rechazar',
            icon: 'pi pi-ban',
            command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.mostrarModalCrud(evento, 'REC')),
          });
        } else {
          accionItems.push({
            label: 'Retroceder',
            icon: 'pi pi-backward',
            command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.mostrarModalCrud(evento, 'RTO')),
          });
        }
      }

      accionItems.push({
        label: 'Reasignar',
        icon: 'pi pi-arrow-right-arrow-left',
        command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.mostrarModalCrud(evento, 'RAS')),
      });

      items.push({ separator: true }, ...accionItems);
    }

    if (!this.eventoEnTrabajo) {
      items.push(
        { separator: true },
        {
          label: 'Tomar Evento',
          icon: 'pi pi-play',
          command: () => this.ejecutarSobreEventoSeleccionado((evento) => this.tomarEvento(evento)),
        },
      );
    }

    this.menuItems.splice(0, this.menuItems.length, ...items);
  }

  private ejecutarSobreEventoSeleccionado(action: (evento: EventoCompleto) => void): void {
    if (this.selectedEvento) action(this.selectedEvento);
  }

  ngOnDestroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  private inicializarFiltroFecha(): void {
    const hoy = new Date();
    const hace3Meses = new Date();
    hace3Meses.setMonth(hoy.getMonth() - 3);
    this.filtroFecha = [hace3Meses, hoy];
  }

  private formatearFecha(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  onFechaChange(): void {
    this.filtroFecha = this.normalizeDateRange(this.filtroFecha);
    if (
      this.filtroFecha &&
      this.filtroFecha.length === 2 &&
      this.filtroFecha[0] &&
      this.filtroFecha[1]
    ) {
      this.loadItems();
    }
    this.saveState();
  }

  onClearFecha(): void {
    this.filtroFecha = null;
    this.saveState();
    this.loadItems();
  }

  onTableFilter(): void { this.saveState(); }
  onTableSort(): void { this.saveState(); }
  onTablePage(): void { this.saveState(); }

  protected override restoreFilterState(state: FiltroState): void {
    const eventState = state as EventoFilterState;
    if (eventState.filtroActivo) this.filtroActivo = eventState.filtroActivo as FiltroActivo;
    this.filtroFecha = this.normalizeDateRange(eventState.fecha);
    this.globalFilter = eventState.globalFilter ?? '';
    this.searchValue.set(this.globalFilter);
    this.restoreTableState(eventState, this.table);
  }

  protected override captureFilterState(): EventoFilterState {
    return {
      filtroActivo: this.filtroActivo,
      fecha: this.filtroFecha
        ? [this.formatDateKey(this.filtroFecha[0]), this.formatDateKey(this.filtroFecha[1])]
        : null,
      ...this.captureTableState(this.table),
      globalFilter: this.globalFilter,
    };
  }

  saveState(): void { this.saveFilterSession(); }

  protected override clearFilterState(): void {
    super.clearFilterState();
    this.filtroFecha = null;
    this.globalFilter = '';
  }

  private formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  private normalizeDateRange(value: unknown): Date[] | null {
    if (!Array.isArray(value) || value.length !== 2) return null;
    const dates = value.map(item => item instanceof Date ? item : this.parseDate(item));
    return dates.every((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime())) ? dates : null;
  }

  protected loadItems(): void {
    this.loadingService.show();

    let params: any = {};
    this.filtroFecha = this.normalizeDateRange(this.filtroFecha);
    if (this.filtroFecha) {
      params.desde = this.formatearFecha(this.filtroFecha[0]);
      params.hasta = this.formatearFecha(this.filtroFecha[1]);
    }

    this.eventoService
      .getAllCompleteByUsuario(this.usuarioActivo?.id ?? '', params)
      .pipe(
        finalize(() => {
          this.loadingService.hide();
        }),
      )
      .subscribe({
        next: (res) => {
          const eventos = res.map((e) => ({
            ...e,
            evento: formatEventoNumero(e.tipo.codigo, e.numero),
            fechaInicio: (e as any).fechaInicio
              ? parseIsoAsLocal((e as any).fechaInicio)
              : null,
            fechaFinReal: (e as any).fechaFinReal
              ? parseIsoAsLocal((e as any).fechaFinReal)
              : null,
            fechaFinEst: (e as any).fechaFinEst
              ? parseIsoAsLocal((e as any).fechaFinEst)
              : null,
            fechaEntrega: (e as any).fechaEntrega
              ? parseIsoAsLocal((e as any).fechaEntrega)
              : null,
          })) as unknown as EventoCompleto[];

          this.zone.run(() => {
            this.eventos = eventos;
            this.cdr.markForCheck();
          });
        },
        error: () => {
          this.showError('Error al cargar los eventos.');
        },
      });
  }

  /** Programa un refresco de la grilla con throttle de 2s para evitar múltiples llamadas */
  private programarRefresco(): void {
    if (this.refreshTimeout) return;
    this.refreshTimeout = setTimeout(() => {
      this.refreshTimeout = null;
      this.loadItems();
    }, 2000);
  }

  protected override exportarExcelImpl(): void {
    this.eventoService.exportarExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_eventos_${getTimestamp()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    });
  }

  protected override procesarExcel(file: File): void {
    const form = new FormData();
    form.append('file', file);

    this.loadingService.show();
    this.eventoService
      .importarExcel(form)
      .pipe(
        finalize(() => {
          this.loadingService.hide();
        }),
      )
      .subscribe({
        next: () => this.afterChange('Eventos importados correctamente.'),
        error: (err) =>
          this.showError(err?.error?.message || 'Error al importar eventos.'),
      });
  }

  protected override descargarPlantilla(): void {
    this.eventoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_eventos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    });
  }

  alta(evento: Evento): void {
    if (!this.beginAction()) return;
    delete evento.id;
    this.eventoService.create(evento).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: (err) =>
        this.showError(err.error.message || 'Error al crear el evento.'),
    });
  }

  editar(evento: Evento): void {
    if (!this.beginAction()) return;
    let eventoCodigo = evento.id ?? '';
    this.eventoService.update(eventoCodigo, evento).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: (err) =>
        this.showError(err.error.message || 'Error al modificar el evento.'),
    });
  }

  eliminarDirecto(evento: Evento): void {
    if (!this.beginAction()) return;
    let eventoCodigo = evento.id ?? '';
    this.eventoService.delete(eventoCodigo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento eliminado correctamente.'),
      error: (err) =>
        this.showError(err.error.message || 'Error al eliminar el Evento.'),
    });
  }

  mostrarModalCrud(
    evento: EventoCompleto | null,
    modo: 'A' | 'M' | 'AVZ' | 'RTO' | 'RAS' | 'AUT' | 'REC',
  ) {
    // Si es modo de Alta o Modificación, abrir el modal de EventoCrud
    if (modo === 'A' || modo === 'M') {
      const data = { item: evento, modo };
      const header = modo === 'A' ? 'Nuevo Evento' : 'Modificar Evento';

      this.ref = this.dialogService.open(EventoCrud, {
        ...modalConfig,
        header,
        data,
      });

      if (!this.ref) return;

      this.ref.onClose.subscribe((result: any) => {
        if (result?.changed) {
          this.afterChange(
            modo === 'M' ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.',
          );
        }
      });
      return;
    }

    // Modo original para acciones de evento (AVZ, RTO, RAS, AUT, REC)
    let header: string;
    let data = {
      reqComentario: false,
      comentario: '',
      mensaje: '',
      modo: modo,
      etapaActual: '',
      proximaEtapa: '',
      rol: '',
      requisitos: [] as any[],
      eventoId: evento?.id ?? '',
      usuarioId: this.usuarioActivo?.id ?? '',
    };

    switch (modo) {
      case 'AVZ':
        header = 'Avanzar Evento';
        // data.reqComentario = evento?.etapaSiguiente?.requiereComentario || false;
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaSiguiente?.rolPreferido ?? '';
        break;
      case 'RTO':
        header = 'Retroceder Evento';
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaAnterior?.rolPreferido ?? '';
        break;
      case 'RAS':
        header = 'Reasignar Evento';
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.rol = evento?.etapaActualData?.rolPreferido ?? '';
        break;
      case 'AUT':
        header = 'Autorizar Evento';
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaSiguiente?.rolPreferido ?? '';
        break;
      case 'REC':
        header = 'Rechazar Evento';
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaAnterior?.nombre ?? '';
        // data.rol = evento?.etapaActualData?.rolPreferido ?? '';
        break;
    }

    this.ref = this.dialogService.open(ModalSel, {
      ...modalConfig,
      width: '50%',
      header,
      data,
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result) return;

      console.log(result);
      if (evento) {
        const body: CircularEvento = {
          eventoId: evento.id || '',
          usuarioId: result.usuarioSeleccionado,
          comentario: result.comentario,
        };

        // Verificar si el evento a procesar es el mismo que está en trabajo
        const eventoEnTrabajoId = this.eventoEnTrabajo?.id;
        const eventoActualId = evento.id;
        const debeLiberar =
          eventoEnTrabajoId === eventoActualId &&
          (modo === 'AVZ' || modo === 'RTO' || modo === 'RAS');

        this.loadingService.show();

        // Si debe liberar, primero liberar el evento
        if (debeLiberar) {
          this.eventoAccionesService
            .liberar(
              eventoEnTrabajoId || '',
              'Liberado automáticamente por acción de usuario',
            )
            .subscribe({
              next: () => {
                // Limpiar el evento en trabajo
                this.eventoTrabajoService.limpiarEvento();
                this.showSuccess('Evento liberado automáticamente.');

                // Continuar con la acción original
                this.ejecutarAccionEvento(modo, body);
              },
              error: (err: any) => {
                this.showError(
                  err.error.message ||
                    'Error al liberar el evento automáticamente.',
                );
                this.loadingService.hide();
              },
            });
        } else {
          // Ejecutar la acción directamente
          this.ejecutarAccionEvento(modo, body);
        }
      }
    });
  }

  private ejecutarAccionEvento(
    modo: 'AVZ' | 'RTO' | 'RAS' | 'AUT' | 'REC',
    body: CircularEvento,
  ): void {
    if (modo === 'AVZ') {
      this.eventoAccionesService.avanzar(body).subscribe({
        next: () => this.showSuccess('Evento avanzado correctamente.'),
        error: (err: any) => {
          this.showError(err.error.message || 'Error al avanzar el evento.');
        },
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'RTO') {
      this.eventoAccionesService.retroceder(body).subscribe({
        next: () => this.showSuccess('Evento retrocedido correctamente.'),
        error: (err: any) =>
          this.showError(err.error.message || 'Error al retroceder el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'RAS') {
      this.eventoAccionesService.reasignar(body).subscribe({
        next: () => this.showSuccess('Evento reasignado correctamente.'),
        error: (err: any) =>
          this.showError(err.error.message || 'Error al reasignar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'AUT') {
      this.eventoAccionesService.autorizar(body).subscribe({
        next: () => this.showSuccess('Evento autorizado correctamente.'),
        error: (err: any) =>
          this.showError(err.error.message || 'Error al autorizar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'REC') {
      delete body.usuarioId; // no se usa en rechazar
      this.eventoAccionesService.rechazar(body).subscribe({
        next: () => this.showSuccess('Evento rechazado correctamente.'),
        error: (err: any) =>
          this.showError(err.error.message || 'Error al rechazar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    }
  }

  // Métodos privados para manejar FormData
  private altaFormData(formData: FormData): void {
    this.eventoService.createAdicional(formData).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: () => this.showError('Error al crear el evento.'),
    });
  }

  private editarFormData(id: string, formData: FormData): void {
    this.eventoService.updateAdicional(id, formData).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: () => this.showError('Error al modificar el evento.'),
    });
  }

  abrirUsuarioDrawer(usuarioId: string | null | undefined) {
    if (usuarioId) {
      this.drawerService.abrirUsuarioDrawer(usuarioId);
    }
  }

  getRequisitosFaltantes(evento: EventoCompleto): string {
    // console.log(evento.etapaActualData?.requisitosFaltantes);
    if (evento.etapaActualData?.requisitosFaltantes?.length === 0) return '';
    let req = '';
    evento.etapaActualData?.requisitosFaltantes?.forEach((r) => {
      req += `- ${r.descripcion}\n`;
    });
    // console.log(req);
    return req;
  }

  // Nuevos métodos para manejar eventos en trabajo
  tomarEvento(evento: EventoCompleto): void {
    if (this.eventoEnTrabajo) {
      this.showError(
        'Ya tienes un evento en trabajo. Libera el evento actual antes de tomar otro.',
      );
      return;
    }

    this.loadingService.show();
    this.eventoAccionesService.tomar(evento.id || '').subscribe({
      next: () => {
        const tiempoInicio = new Date();

        // Actualizar a través del servicio
        this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);

        this.showSuccess(
          `Evento ${evento.tipo.codigo}-${evento.numero?.toString().padStart(3, '0')} tomado.`,
        );
        this.loadItems();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.showError(err.error.message || 'Error al tomar el evento.');
      },
      complete: () => {
        this.loadingService.hide();
      },
    });
  }

  onEventoLiberado(): void {
    // Ya no es necesario limpiar aquí porque el servicio lo maneja
    this.loadItems(); // Solo recargar la lista
  }

  private verificarEventoEnTrabajo(): void {
    // Solo verificar para el estado local, el servicio maneja la verificación global
    this.eventoAccionesService
      .obtenerEventoEnTrabajo(this.usuarioActivo?.id ?? '')
      .subscribe({
        next: (evento: any) => {
          if (evento && evento.registroTiempo) {
            const tiempoInicio = this.resolverTiempoInicio(
              evento.registroTiempo.inicio,
            );

            // Actualizar a través del servicio
            this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);
            return;
          }

          this.eventoTrabajoService.limpiarEvento();
        },
        error: () => {
          this.eventoTrabajoService.limpiarEvento();
        },
      });
  }

  private resolverTiempoInicio(inicio: string | Date): Date {
    if (typeof inicio === 'string' && /^1970-01-01T/.test(inicio)) {
      const match = inicio.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const ahora = new Date();
        const tiempoInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
        );

        if (tiempoInicio.getTime() > ahora.getTime()) {
          tiempoInicio.setDate(tiempoInicio.getDate() - 1);
        }

        return tiempoInicio;
      }
    }

    return parseIsoAsLocal(inicio);
  }

  abrirEventoDrawer(evento: EventoCompleto) {
    if (evento.id) {
      this.drawerService.abrirEventoDrawer(evento.id);
    }
  }

  abrirSelectorEventoPropio(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.selecionarEventoPropio = this.dialogService.open(SelEventoPropio, {
      ...modalConfig,
      header: 'Seleccionar Evento Propio a tomar',
      focusOnShow: false,
    });

    if (!this.selecionarEventoPropio) return;

    this.selecionarEventoPropio.onClose.subscribe((result: any) => {
      if (result) {
        this.tomarEvento(result);
      }
    });
  }
}
