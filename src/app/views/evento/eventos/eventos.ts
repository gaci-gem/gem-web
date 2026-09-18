import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { CircularEvento, Evento, EventoCompleto, formatEventoNumero } from '@core/interfaces/evento';
import { EventoCompletoPage, EventoService } from '@core/services/evento';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EventoCrud } from '../evento-crud/evento-crud';
import { modalConfig } from '@/app/types/modals';
import { ShortcutDirective } from '@core/directive/shortcut';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { UiCard } from '@app/components/ui-card';
import { BadgeClickComponent } from "@app/components/badge-click";
import { CommonModule, DatePipe } from '@angular/common';

import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { DrawerService } from '@core/services/drawer.service';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { ModalSel } from '../eventos-usuario/components/modal-sel/modal-sel';
import { EventoAccionesService } from '@core/services/evento-acciones';
import { PrioridadIconComponent } from '@app/components/priority-icon';
import { TooltipModule } from 'primeng/tooltip';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { PermisoAccion } from '@/app/types/permisos';
import { EventoFilterState, FiltroState } from '@core/interfaces/filtro-preset';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { Table, TableFilterEvent, TablePageEvent } from 'primeng/table';
import { EventCommandService } from '@core/services/event-command.service';
import { KeyboardListNavigation } from '@app/components/keyboard-list-navigation/keyboard-list-navigation';

@Component({
  selector: 'app-eventos',
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
    PrioridadIconComponent,
    TooltipModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    NgbTooltipModule,
    DatePickerModule,
    FormsModule,
    FiltroPresetsComponent,
    KeyboardListNavigation,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss'
})
export class Eventos extends TrabajarCon<Evento> implements AfterViewInit {
  readonly pantalla = 'eventos';
  private eventoService = inject(EventoService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private userStorageService = inject(UserStorageService);
  private eventoAccionesService = inject(EventoAccionesService);
  private drawerService = inject(DrawerService);
  private eventCommandService = inject(EventCommandService);
  private eventCommandDestroyRef = inject(DestroyRef);
  @ViewChild('dt') table?: Table;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos: EventoCompleto[] = [];
  selectedEventos: EventoCompleto[] = [];

  filtroFecha: Date[] | null = null;
  globalFilter = '';
  totalEventos = 0;
  private readonly pageSize = 10;

  override ngOnInit(): void {
    const restored = this.restoreFilterSession() as EventoFilterState | null;
    this.filtroActivo = restored?.filtroActivo as FiltroActivo ?? FiltroActivo.FALSE;
    if (restored && Object.prototype.hasOwnProperty.call(restored, 'fecha')) {
      this.filtroFecha = this.normalizeDateRange(restored.fecha);
    } else {
      this.inicializarFiltroFecha();
    }
    this.globalFilter = restored?.globalFilter ?? '';
    this.searchValue.set(this.globalFilter);
    this.loadPresets();
    this.loadItems();
  }

  ngAfterViewInit(): void {
    const state = this.restoreFilterSession() as EventoFilterState | null;
    if (state) this.restoreTableState(state, this.table);
  }

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.EVENTO;
    this.eventCommandService.createEventRequested$
      .pipe(takeUntilDestroyed(this.eventCommandDestroyRef))
      .subscribe(requested => {
        if (requested && this.eventCommandService.consumeCreateEvent()) {
          this.mostrarModalCrud(null, 'A');
        }
      });
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
    this.resetPaginator();
    if (this.filtroFecha) {
      this.loadItems();
    }
    this.saveState();
  }

  onClearFecha(): void {
    this.filtroFecha = null;
    this.resetPaginator();
    this.saveState();
    this.loadItems();
  }

  onGlobalFilter(value: string): void {
    this.globalFilter = value;
    this.resetPaginator();
    this.saveState();
    this.loadItems();
  }

  onTableFilter(_event: TableFilterEvent): void {
    this.resetPaginator();
    this.saveState();
    this.loadItems();
  }
  onTableSort(_event: any): void { this.saveState(); }
  onTablePage(event: TablePageEvent): void {
    this.saveState();
    this.loadItems(event.first, event.rows);
  }

  protected override restoreFilterState(state: FiltroState): void {
    const eventState = state as EventoFilterState;
    this.filtroActivo = eventState.filtroActivo as FiltroActivo;
    this.filtroFecha = this.normalizeDateRange(eventState.fecha);
    this.globalFilter = eventState.globalFilter ?? '';
    this.restoreTableState(eventState, this.table);
  }

  protected override captureFilterState(): EventoFilterState {
    return {
      filtroActivo: this.filtroActivo,
      fecha: this.filtroFecha ? [this.formatDateKey(this.filtroFecha[0]), this.formatDateKey(this.filtroFecha[1])] : null,
      ...this.captureTableState(this.table),
      globalFilter: this.globalFilter,
    };
  }

  saveState(): void { this.saveFilterSession(); }

  protected override defaultFiltroActivo(): FiltroActivo { return FiltroActivo.FALSE; }

  protected override clearFilterState(): void {
    super.clearFilterState();
    this.filtroFecha = null;
    this.globalFilter = '';
  }

  private formatDateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
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

  protected loadItems(first = this.table?.first ?? 0, rows = this.table?.rows ?? this.pageSize): void {
    this.loadingService.show();
    
    let params: any = {};
    this.filtroFecha = this.normalizeDateRange(this.filtroFecha);
    if (this.filtroFecha) {
      params.desde = this.formatearFecha(this.filtroFecha[0]);
      params.hasta = this.formatearFecha(this.filtroFecha[1]);
    }
    params.globalSearch = this.globalFilter.trim();
    const fieldMap: Record<string, string> = {
      eventoSearch: 'eventoSearch',
      titulo: 'titulo',
      'etapaActualData.nombre': 'etapa',
      'cliente.nombre': 'cliente',
      'producto.nombre': 'producto',
      'modulo.nombre': 'modulo',
      'usuarioActual.usuario': 'usuario',
    };
    Object.entries(this.table?.filters ?? {}).forEach(([field, metadata]: [string, any]) => {
      const filter = Array.isArray(metadata) ? metadata[0] : metadata;
      const target = fieldMap[field];
      if (target && typeof filter?.value === 'string' && filter.value.trim()) {
        params[target] = filter.value.trim();
      }
    });
    params.page = Math.floor(first / rows) + 1;
    params.limit = rows;

    this.eventoService.getAllComplete(this.filtroActivo, params).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as EventoCompletoPage;
        this.totalEventos = page.total;
        this.eventos = page.data.map(e => ({
            ...e,
          evento: formatEventoNumero(e.tipo.codigo, e.numero),
          fechaInicio: (e as any).fechaInicio ? parseIsoAsLocal((e as any).fechaInicio) : null,
          fechaFinReal: (e as any).fechaFinReal ? parseIsoAsLocal((e as any).fechaFinReal) : null,
          fechaFinEst: (e as any).fechaFinEst ? parseIsoAsLocal((e as any).fechaFinEst) : null,
          fechaEntrega: (e as any).fechaEntrega ? parseIsoAsLocal((e as any).fechaEntrega) : null
        })) as unknown as EventoCompleto[];
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los eventos.')
    });
  }

  override filtroCambio(event: any): void {
    super.filtroCambio(event);
    this.resetPaginator();
    this.loadItems();
    this.saveState();
  }

  override clear(table: Table): void {
    super.clear(table);
    this.globalFilter = '';
    this.resetPaginator();
    this.loadItems();
  }

  private resetPaginator(): void {
    if (this.table) this.table.first = 0;
  }

  isFiltered(table: Table): boolean {
    return !!this.filtroFecha || this.filtroActivo !== FiltroActivo.FALSE || this.hasTableFilters(table);
  }

  private hasTableFilters(table: Table): boolean {
    return Object.values(table.filters ?? {}).some(value => {
      const filter = Array.isArray(value) ? value[0] : value;
      return filter?.value !== null && filter?.value !== undefined && filter.value !== '';
    });
  }

  abrirEventoDrawer(evento: EventoCompleto) {
    if (evento.id) {
      this.drawerService.abrirEventoDrawer(evento.id);
    }
  }
  
  abrirUsuarioDrawer(usuarioId: string | null | undefined) {
    if (usuarioId) {
      this.drawerService.abrirUsuarioDrawer(usuarioId);
    }
  }

  alta(evento: Evento): void {
    if (!this.beginAction()) return;
    delete evento.id
    this.eventoService.create(evento).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el evento.')
    });
  }

  editar(evento: Evento): void {
    if (!this.beginAction()) return;
    let eventoCodigo = evento.id ?? '';
    this.eventoService.update(eventoCodigo, evento).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el evento.')
    });
  }

  eliminarDirecto(evento: Evento): void {
    if (!this.beginAction()) return;
    let eventoCodigo = evento.id ?? '';
    this.eventoService.delete(eventoCodigo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Evento eliminado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar el Evento.')
    });
  }

  mostrarModalCrud(evento: Evento | null, modo: 'A' | 'M') {
    const data = { item: evento, modo };
    const header = modo === 'A' ? 'Nuevo Evento' : 'Modificar Evento';

    this.ref = this.dialogService.open(EventoCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (result?.changed) {
        this.afterChange(
          modo === 'M' ? 'Evento actualizado correctamente.' : 'Evento creado correctamente.',
        );
      }
    });
  }

  descargarPlantilla() {
    this.eventoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_eventos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.eventoService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_eventos_${getTimestamp()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  procesarExcel(file:File): void {
    const form = new FormData();
    form.append('file', file);

    this.loadingService.show();
    this.eventoService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Eventos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar eventos.')
    });
  }

  // Métodos privados para manejar FormData
  private altaFormData(formData: FormData): void {
    this.eventoService.createAdicional(formData).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: () => this.showError('Error al crear el evento.')
    });
  }

  private editarFormData(id: string, formData: FormData): void {
    this.eventoService.updateAdicional(id, formData).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: () => this.showError('Error al modificar el evento.')
    });
  }

  mostrarModalCrudReasignar(evento: EventoCompleto) {

    let header = "Reasignar Evento";
    let mensaje = `Etapa: ${evento?.etapaActualData?.nombre ?? ''}`;
    let rol = evento?.etapaActualData?.rolPreferido;
    let reqComentario = false;

    const data = {
      reqComentario: reqComentario,
      comentario: "",
      mensaje: mensaje,
      rol
    }

    this.ref = this.dialogService.open(ModalSel, {
      ...modalConfig,
      width: '50%',
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result) return;

      console.log(result);
      if (evento) {
        const body: CircularEvento = {
          eventoId: evento.id || '',
          usuarioId: result.usuarioSeleccionado,
          comentario: result.comentario
        }

        this.eventoAccionesService.reasignar(body).subscribe({
          next: () => this.showSuccess('Evento reasignado correctamente.'),
          error: (err: any) => this.showError(err.error.message || 'Error al reasignar el evento.'),
          complete: () => {
            this.loadItems();
          },
        });
      }

    });

  }

}
