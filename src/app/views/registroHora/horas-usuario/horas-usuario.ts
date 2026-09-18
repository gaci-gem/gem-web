import { ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { TrabajarCon, UiCard } from '@app/components/index';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { TipoTrabajo, TIPOS_TRABAJO } from '@/app/constants/tipo-trabajo';
import { Categoria, Hora, RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { RegistroHoraQuery, RegistroHoraService } from '@core/services/registro-hora';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HoraCrud } from '../hora-crud/hora-crud';
import { modalConfig } from '@/app/types/modals';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { getFechaLocal, parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { finalize } from 'rxjs';
import { formatEventoNumero } from '@core/interfaces/evento';
import { ViewportService } from '@core/services/viewport.service';
@Component({
  selector: 'app-horas-usuario',
  imports: [
    UiCard,
    ControlTrabajarCon,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    DatePipe,
    DatePickerModule,
    ButtonModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './horas-usuario.html',
  styleUrl: './horas-usuario.scss'
})
export class HorasUsuario extends TrabajarCon<RegistroHora> {
  readonly pantalla = 'horas-usuario';
  @ViewChild('initialFocusTarget') private initialFocusTarget?: ElementRef<HTMLElement>;
  protected override exportarExcelImpl(): void {
    throw new Error('Method not implemented.');
  }
  protected override procesarExcel(file: File): void {
    throw new Error('Method not implemented.');
  }
  protected override descargarPlantilla(): void {
    throw new Error('Method not implemented.');
  }
  private registroHoraService = inject(RegistroHoraService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private userStorageService = inject(UserStorageService);
  private viewportService = inject(ViewportService);
  getFechaLocal=getFechaLocal
  readonly isMobile = this.viewportService.isMobile;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  categoriasMap: Map<string, Categoria> = new Map();

  registrosHoras!: RegistroHora[];
  registrosHorasFiltradas!: RegistroHora[];
  totalRecords = 0;
  first = 0;
  rows = 10;
  usuarioFiltro = '';
  private expandedRegistroKeys = new Set<string>();

  dateFilter = new Date();

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initialFocusTarget?.nativeElement.focus());
  }

  protected loadItems(): void {
    this.cargarCategorias();
    this.consultarRegistros(this.dateFilter);
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

  alta(registroHora: RegistroHora, onError?: () => void): void {
    if (!this.beginAction()) return;
    delete registroHora.id
    this.registroHoraService.create(registroHora).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora creado correctamente.'),
      error: (err) => {
        this.showError(err?.error?.message || 'Error al crear el registro de Hora.');
        onError?.();
      }
    });
  }

  editar(registroHora: RegistroHora, onError?: () => void): void {
    if (!this.beginAction()) return;
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.update(registroHoraId, registroHora).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora actualizado correctamente.'),
      error: (err) => {
        this.showError(err?.error?.message || 'Error al modificar el registro de Hora.');
        onError?.();
      }
    });
  }

  eliminarDirecto(registroHora: RegistroHora): void {
    if (!this.beginAction()) return;
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.delete(registroHoraId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Registro de Hora eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el registro de Hora.')
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

  consultarRegistros(fechaFiltro:any){
    this.loadingService.show();
    const query: RegistroHoraQuery = {
      mes: fechaFiltro.getMonth() + 1,
      anio: fechaFiltro.getFullYear(),
      page: Math.floor(this.first / this.rows) + 1,
      limit: this.rows,
      usuario: this.usuarioFiltro || undefined,
    };
    this.registroHoraService.getByUsuario(this.usuarioActivo?.id!, query).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.registrosHoras = res.data.map((r: any) => ({
          ...r,
          fecha: parseIsoAsLocal(r.fecha),
          horas: r.horas?.map((h: any) => ({
            ...h,
            inicio: h?.inicio ? parseIsoAsLocal(h.inicio) : undefined,
            fin: h?.fin ? parseIsoAsLocal(h.fin) : undefined,
            categoriaCodigo: h?.categoriaCodigo || null,
            eventoTxt: h.evento?.tipoCodigo && h.evento?.numero != null
              ? formatEventoNumero(h.evento.tipoCodigo, h.evento.numero)
              : undefined
          }))
        })) as any;
        this.registrosHorasFiltradas = this.registrosHoras;
        this.totalRecords = res.pagination.total;
        this.cdr.detectChanges();
        this.aplicarFiltroFecha(fechaFiltro);
      },
      error: (err) => {
        if (err?.status !== 404) {
          this.showError('Error al cargar los registros de Hora.');
        }
      }
    });
  }

  aplicarFiltroFecha(fechaSel:any){
    const aux = new Date(fechaSel);
    this.registrosHorasFiltradas = this.registrosHoras.filter( (h) => {
      const a = h.fecha instanceof Date ? h.fecha : parseIsoAsLocal(h.fecha as any);
      return (a.getMonth() === aux.getMonth()) && (a.getFullYear() === aux.getFullYear())
    })
  }

  onPeriodoMobileChange(fecha: Date): void {
    this.dateFilter = fecha;
    this.resetPaginator();
    this.consultarRegistros(fecha);
  }

  onPageChange(event: { first?: number; rows?: number }): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
    this.consultarRegistros(this.dateFilter);
  }

  onGlobalFilter(event: Event): void {
    this.usuarioFiltro = (event.target as HTMLInputElement).value;
    this.resetPaginator();
    this.consultarRegistros(this.dateFilter);
  }

  private resetPaginator(): void {
    this.first = 0;
  }

  cantidadIntervalos(registro: RegistroHora): number {
    return registro.horas?.length ?? 0;
  }

  registroKey(registro: RegistroHora): string {
    if (registro.id != null) {
      return String(registro.id);
    }

    return registro.fecha instanceof Date
      ? registro.fecha.toISOString()
      : String(registro.fecha);
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

  eventoLabel(hora: Hora): string {
    return hora.eventoTxt || hora.evento?.titulo || 'Evento sin título';
  }
}

