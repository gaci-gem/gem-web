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
import { Categoria, ComparativaHorasMes, Hora, RegistroHora, RegistroHoraDia, RegistroHoraUsuario, ResumenHorasPeriodo, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { RegistroHoraQuery, RegistroHoraService } from '@core/services/registro-hora';
import { NgIcon } from '@ng-icons/core';
import { finalize, map, Observable } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { HoraCrud } from '../hora-crud/hora-crud';
import { CompararMesesModal } from '../comparar-meses-modal/comparar-meses-modal';

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
  sortField: 'fecha' | 'createdAt' = 'fecha';
  sortDirection: 'asc' | 'desc' = 'desc';

  dateRangeFilter: Date[] | undefined;

  categoriaFiltro: string | null = null;
  usuarioFiltro = '';
  readonly tiposTrabajo = TIPOS_TRABAJO;
  private expandedRegistroKeys = new Set<string>();
  expandedDias: Record<string, boolean> = {};
  expandedUsuarios: Record<string, boolean> = {};
  registrosHorasPorDia: RegistroHoraDia[] = [];
  private todosLosDias: RegistroHoraDia[] = [];
  resumenPeriodo: ResumenHorasPeriodo = { totalHoras: 0, totalHorasFormateadas: '00:00', diasConCarga: 0, usuariosActivos: 0 };
  comparativaMensual: ComparativaHorasMes[] = [];

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
      this.cargarResumen(this.dateRangeFilter[0], this.dateRangeFilter[1]);
    }
  }

  onClearFecha(): void {
    this.dateRangeFilter = undefined;
    this.resetPaginator();
    this.consultarRegistros();
    this.resumenPeriodo = { totalHoras: 0, totalHorasFormateadas: '00:00', diasConCarga: 0, usuariosActivos: 0 };
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
    if (this.dateRangeFilter?.[0] && this.dateRangeFilter?.[1]) this.cargarResumen(this.dateRangeFilter[0], this.dateRangeFilter[1]);
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.actualizarPaginaDias();
  }

  onSort(event: { field?: string; order?: number }): void {
    if (event.field !== 'fecha' && event.field !== 'createdAt') return;
    this.sortField = event.field;
    this.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.resetPaginator();
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

  cantidadIntervalos(registro: RegistroHora): number {
    return registro.horas?.length ?? 0;
  }

  registroKey(registro: RegistroHora): string {
    if (registro.id != null) return String(registro.id);

    const fecha = registro.fecha instanceof Date
      ? registro.fecha.toISOString()
      : String(registro.fecha);
    return `${registro.usuarioId}|${fecha}`;
  }

  isRegistroExpandido(registro: RegistroHora): boolean {
    return this.expandedRegistroKeys.has(this.registroKey(registro));
  }

  toggleRegistro(registro: RegistroHora): void {
    const key = this.registroKey(registro);
    if (this.expandedRegistroKeys.has(key)) {
      this.expandedRegistroKeys.delete(key);
    } else {
      this.expandedRegistroKeys.add(key);
    }
  }

  claveDia(fecha: Date | string): string {
    const fechaLocal = fecha instanceof Date ? fecha : parseIsoAsLocal(fecha);
    return `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`;
  }

  alternarDia(dia: RegistroHoraDia): void {
    this.expandedDias[dia.clave] = !this.expandedDias[dia.clave];
  }

  alternarUsuario(dia: RegistroHoraDia, usuario: RegistroHoraUsuario): void {
    const clave = `${dia.clave}|${usuario.id}`;
    this.expandedUsuarios[clave] = !this.expandedUsuarios[clave];
  }

  usuarioExpandido(dia: RegistroHoraDia, usuario: RegistroHoraUsuario): boolean {
    return !!this.expandedUsuarios[`${dia.clave}|${usuario.id}`];
  }

  cargasUsuario(usuario: RegistroHoraUsuario): Hora[] {
    return usuario.registros.flatMap(registro => registro.horas ?? []);
  }

  private construirJerarquia(registros: RegistroHora[]): void {
    const dias = new Map<string, Map<string, RegistroHoraUsuario>>();
    registros.forEach(registro => {
      const claveDia = this.claveDia(registro.fecha);
      const usuario = registro.usuario ?? { id: registro.usuarioId, nombre: '', apellido: '', usuario: registro.usuarioId };
      const usuarios = dias.get(claveDia) ?? new Map<string, RegistroHoraUsuario>();
      const usuarioActual = usuarios.get(usuario.id) ?? { ...usuario, registros: [], totalHoras: 0, totalHorasFormateadas: '00:00' };
      usuarioActual.registros.push(registro);
      usuarioActual.totalHoras += registro.horasTotales ?? 0;
      usuarioActual.totalHorasFormateadas = this.formatearHoras(usuarioActual.totalHoras);
      usuarios.set(usuario.id, usuarioActual);
      dias.set(claveDia, usuarios);
    });
    this.registrosHorasPorDia = Array.from(dias.entries()).map(([clave, usuarios]) => {
      const usuariosArray = Array.from(usuarios.values());
      const totalHoras = usuariosArray.reduce((total, usuario) => total + usuario.totalHoras, 0);
      return { clave, fecha: parseIsoAsLocal(`${clave}T00:00:00`), usuarios: usuariosArray, totalHoras, totalHorasFormateadas: this.formatearHoras(totalHoras) };
    });
  }

  private formatearHoras(total: number): string {
    const horas = Math.floor(total);
    const minutos = Math.round((total - horas) * 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  eventoLabel(hora: Hora): string {
    return hora.eventoTxt || hora.evento?.titulo || 'Evento sin título';
  }

  consultarRegistros(desde?: Date, hasta?: Date) {
    this.loadingService.show();
    const inicio = desde ?? this.dateRangeFilter?.[0];
    const fin = hasta ?? this.dateRangeFilter?.[1];
    if (!inicio || !fin) {
      this.todosLosDias = [];
      this.actualizarPaginaDias();
      this.loadingService.hide();
      return;
    }
    this.registroHoraService.getHorasGenerales(inicio, fin, this.categoriaFiltro || undefined).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (usuarios) => {
        const registros = usuarios
          .filter(usuario => !this.usuarioFiltro || `${usuario.usuario} ${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(this.usuarioFiltro.toLowerCase()))
          .flatMap(usuario => usuario.registrosHora.map(registro => ({
            ...registro,
            usuarioId: usuario.id,
            usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, usuario: usuario.usuario },
            fecha: parseIsoAsLocal(registro.fecha),
            horas: registro.horas?.map((h: any) => ({ ...h, inicio: h?.inicio ? parseIsoAsLocal(h.inicio) : undefined, fin: h?.fin ? parseIsoAsLocal(h.fin) : undefined, categoriaCodigo: h?.categoriaCodigo || null }))
          })));
        this.registrosHorasGenerales = registros;
        this.registrosHorasGeneralesFiltradas = registros;
        this.construirJerarquia(registros);
        this.todosLosDias = this.registrosHorasPorDia;
        this.ordenarDias();
        this.totalRecords = this.todosLosDias.length;
        this.actualizarPaginaDias();
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los registros de Hora.')
    });
  }

  abrirComparativaMeses(): void {
    if (!this.dateRangeFilter?.[0]) return;
    const anio = this.dateRangeFilter[0].getFullYear();
    this.dialogService.open(CompararMesesModal, {
      ...modalConfig,
      header: 'Comparar meses',
      width: 'min(900px, 95vw)',
      data: {
        anio,
        cargarComparativa: (anioSeleccionado: number) => this.cargarComparativaAnual(anioSeleccionado)
      }
    });
  }

  cargarComparativaAnual(anio: number): Observable<ComparativaHorasMes[]> {
    const desde = new Date(anio, 0, 1);
    const hasta = new Date(anio + 1, 0, 0);
    this.loadingService.show();
    return this.registroHoraService.getHorasGenerales(desde, hasta, this.categoriaFiltro || undefined).pipe(
      map(usuarios => Array.from({ length: 12 }, (_, mes) => {
        const usuariosDelMes = usuarios.map(usuario => {
          const registrosHora = usuario.registrosHora.filter(registro => {
            const fecha = new Date(registro.fecha);
            return fecha.getFullYear() === anio && fecha.getMonth() === mes;
          });
          return {
            ...usuario,
            registrosHora,
            totalMes: registrosHora.reduce((total, registro) => total + (registro.horasTotales ?? 0), 0)
          };
        }).filter(usuario => usuario.registrosHora.length > 0);
        return this.crearResumenMensual(new Date(anio, mes, 1), usuariosDelMes);
      })),
      finalize(() => this.loadingService.hide())
    );
  }

  private actualizarPaginaDias(): void {
    this.registrosHorasPorDia = this.todosLosDias.slice(this.first, this.first + this.rows);
  }

  private ordenarDias(): void {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    this.todosLosDias.sort((a, b) => (a.fecha.getTime() - b.fecha.getTime()) * factor);
  }

  private cargarResumen(desde: Date, hasta: Date): void {
    this.registroHoraService.getHorasGenerales(desde, hasta, this.categoriaFiltro || undefined).subscribe(usuarios => {
      this.resumenPeriodo = this.crearResumen(usuarios);
    });
  }

  private crearResumenMensual(mes: Date, usuarios: UsuarioHorasGenerales[]): ComparativaHorasMes {
    return { mes: mes.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }), ...this.crearResumen(usuarios) };
  }

  private crearResumen(usuarios: UsuarioHorasGenerales[]): ResumenHorasPeriodo {
    const dias = new Set<string>();
    const totalHoras = usuarios.reduce((total, usuario) => total + (usuario.totalMes ?? 0), 0);
    usuarios.forEach(usuario => usuario.registrosHora.forEach(registro => dias.add(new Date(registro.fecha).toISOString().slice(0, 10))));
    const horas = Math.floor(totalHoras);
    const minutos = Math.round((totalHoras - horas) * 60);
    return { totalHoras, totalHorasFormateadas: `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`, diasConCarga: dias.size, usuariosActivos: usuarios.length };
  }
}
