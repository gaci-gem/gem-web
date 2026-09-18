import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrabajarCon, UiCard } from '@app/components/index';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { TipoTrabajo, TIPOS_TRABAJO } from '@/app/constants/tipo-trabajo';
import { modalConfig } from '@/app/types/modals';
import { getFechaLocal, parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { getTimestamp } from '@/app/utils/time-utils';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { Categoria, RegistroHora } from '@core/interfaces/registro-hora';
import { RegistroHoraQuery, RegistroHoraService } from '@core/services/registro-hora';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { Table, TableModule, TableRowCollapseEvent, TableRowExpandEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { HoraCrud } from '../hora-crud/hora-crud';

@Component({
  selector: 'app-horas',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    DatePickerModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    SelectModule,
    ControlTrabajarCon,
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './horas.html',
  styleUrl: './horas.scss'
})
export class Horas extends TrabajarCon<RegistroHora> {
  readonly pantalla = 'horas';
  private registroHoraService = inject(RegistroHoraService);
  private dialogService = inject(DialogService);

  ref!: DynamicDialogRef | null;
  getFechaLocal = getFechaLocal;

  categoriasMap: Map<string, Categoria> = new Map();

  registrosHorasGenerales: RegistroHora[] = [];
  registrosHorasGeneralesFiltradas: RegistroHora[] = [];
  totalRecords = 0;
  first = 0;
  rows = 10;

  dateRangeFilter: Date[] | undefined;

  categoriaFiltro: string | null = null;
  usuarioFiltro = '';
  readonly tiposTrabajo = TIPOS_TRABAJO;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.HORAS_GENERALES;
    this.inicializarFiltroFecha();
  }

  protected override exportarExcelImpl(): void {
    if (this.dateRangeFilter && this.dateRangeFilter.length === 2 && this.dateRangeFilter[0] && this.dateRangeFilter[1]) {
      const [desde, hasta] = this.dateRangeFilter;
      this.registroHoraService.exportExcel(desde, hasta).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export_horas_${getTimestamp()}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    }
  }

  protected override procesarExcel(file: File): void {
    throw new Error('Method not implemented.');
  }

  protected override descargarPlantilla(): void {
    throw new Error('Method not implemented.');
  }

  protected loadItems(): void {
    this.cargarCategorias();
    this.onFechaChange();
  }

  private cargarCategorias(): void {
    if (this.categoriasMap.size > 0) return;
    this.registroHoraService.getCategorias().subscribe(cats => {
      cats.forEach(c => this.categoriasMap.set(c.codigo, c));
    });
  }

  getCategoriaInfo(codigo: string | null | undefined): Categoria | null {
    if (!codigo) return null;
    return this.categoriasMap.get(codigo) ?? null;
  }

  private inicializarFiltroFecha(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.dateRangeFilter = [inicioMes, finMes];
  }

  alta(registroHora: RegistroHora): void {
    if (!this.beginAction()) return;
    delete registroHora.id
    this.registroHoraService.create(registroHora).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora creado correctamente.'),
      error: () => this.showError('Error al crear el registro de Hora.')
    });
  }

  editar(registroHora: RegistroHora): void {
    if (!this.beginAction()) return;
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.update(registroHoraId, registroHora).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora actualizado correctamente.'),
      error: () => this.showError('Error al modificar el registro de Hora.')
    });
  }

  eliminarDirecto(registroHora: RegistroHora): void {
    if (!this.beginAction()) return;
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.delete(registroHoraId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora eliminado correctamente.'),
      error: () => this.showError('Error al eliminar el registro de Hora.')
    });
  }

  mostrarModalCrud(registroHora: RegistroHora | null, modo: 'A' | 'M') {
    const data = { item: registroHora, modo };
    const header = modo === 'A' ? 'Nuevo Registro de Hora' : 'Modificar Registro de Hora';

    this.ref = this.dialogService.open(HoraCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Registro de Hora actualizado correctamente.' : 'Registro de Hora creado correctamente.');
    });
  }

  onFechaChange(): void {
    this.resetPaginator();
    if (this.dateRangeFilter && this.dateRangeFilter.length === 2 && this.dateRangeFilter[0] && this.dateRangeFilter[1]) {
      this.consultarRegistros(this.dateRangeFilter[0], this.dateRangeFilter[1]);
    }
  }

  onClearFecha(): void {
    this.inicializarFiltroFecha();
    this.onFechaChange();
  }

  isFiltered(table: Table): boolean {
    return !!this.dateRangeFilter?.length || !!this.categoriaFiltro || this.hasTableFilters(table);
  }

  private hasTableFilters(table: Table): boolean {
    return Object.values(table.filters ?? {}).some(value => {
      const filter = Array.isArray(value) ? value[0] : value;
      return filter?.value !== null && filter?.value !== undefined && filter.value !== '';
    });
  }

  override clear(table: Table): void {
    this.dateRangeFilter = undefined;
    this.categoriaFiltro = null;
    super.clear(table);
    this.inicializarFiltroFecha();
    this.onFechaChange();
  }

  filtrarPorCategoria(codigo: string | null): void {
    this.categoriaFiltro = codigo;
    this.resetPaginator();
    this.consultarRegistros(this.dateRangeFilter?.[0], this.dateRangeFilter?.[1]);
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.consultarRegistros(this.dateRangeFilter?.[0], this.dateRangeFilter?.[1]);
  }

  onGlobalFilter(event: Event): void {
    this.usuarioFiltro = (event.target as HTMLInputElement).value;
    this.resetPaginator();
    this.consultarRegistros(this.dateRangeFilter?.[0], this.dateRangeFilter?.[1]);
  }

  private resetPaginator(): void {
    this.first = 0;
  }

  consultarRegistros(desde?: Date, hasta?: Date) {
    if (!desde || !hasta) return;
    this.loadingService.show();
    const query: RegistroHoraQuery = {
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows,
      fechaDesde: desde.toISOString().slice(0, 10),
      fechaHasta: hasta.toISOString().slice(0, 10),
      categoriaCodigo: this.categoriaFiltro || undefined,
      usuario: this.usuarioFiltro || undefined,
    };
    this.registroHoraService.getAll(query).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const registros = res.data.map((reg: any) => ({
          ...reg,
          fecha: parseIsoAsLocal(reg.fecha),
          horas: reg.horas?.map((h: any) => ({
            ...h,
            inicio: h?.inicio ? parseIsoAsLocal(h.inicio) : undefined,
            fin: h?.fin ? parseIsoAsLocal(h.fin) : undefined,
            categoriaCodigo: h?.categoriaCodigo || null,
          })),
        }));
        this.registrosHorasGenerales = registros;
        this.registrosHorasGeneralesFiltradas = registros;
        this.totalRecords = res.pagination.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los registros de Hora.')
    });
  }
}
