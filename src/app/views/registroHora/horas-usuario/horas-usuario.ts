import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon, UiCard } from '@app/components/index';
import { TipoTrabajo, TIPOS_TRABAJO } from '@/app/constants/tipo-trabajo';
import { Categoria, RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { RegistroHoraService } from '@core/services/registro-hora';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HoraCrud } from '../hora-crud/hora-crud';
import { modalConfig } from '@/app/types/modals';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ShortcutDirective } from '@core/directive/shortcut';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { TableModule } from 'primeng/table';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { getFechaLocal, parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { finalize } from 'rxjs';
import { formatEventoNumero } from '@core/interfaces/evento';
@Component({
  selector: 'app-horas-usuario',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    ShortcutDirective,
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
  getFechaLocal=getFechaLocal

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  categoriasMap: Map<string, Categoria> = new Map();

  registrosHoras!: RegistroHora[];
  registrosHorasFiltradas!: RegistroHora[];

  dateFilter = new Date();

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
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

  alta(registroHora: RegistroHora): void {
    delete registroHora.id
    this.registroHoraService.create(registroHora).subscribe({
      next: () => this.afterChange('Registro de Hora creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el registro de Hora.')
    });
  }

  editar(registroHora: RegistroHora): void {
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.update(registroHoraId, registroHora).subscribe({
      next: () => this.afterChange('Registro de Hora actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el registro de Hora.')
    });
  }

  eliminarDirecto(registroHora: RegistroHora): void {
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.delete(registroHoraId).subscribe({
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

    this.ref.onClose.subscribe((registroHoraCrud: RegistroHora) => {
      if (!registroHoraCrud) return;
      modo === 'M' ? this.editar(registroHoraCrud) : this.alta(registroHoraCrud);
    });
  }

  consultarRegistros(fechaFiltro:any){
    this.loadingService.show();
    this.registroHoraService.getByUsuario(this.usuarioActivo?.id!,fechaFiltro.getMonth() + 1, fechaFiltro.getFullYear()).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        console.log(res);
        this.registrosHoras = res.map((r: any) => ({
          ...r,
          fecha: parseIsoAsLocal(r.fecha),
          horas: r.horas?.map((h: any) => ({
            ...h,
            inicio: h?.inicio ? parseIsoAsLocal(h.inicio) : undefined,
            fin: h?.fin ? parseIsoAsLocal(h.fin) : undefined,
            categoriaCodigo: h?.categoriaCodigo || null,
            eventoTxt: formatEventoNumero(h.evento?.tipoCodigo!, h.evento?.numero!)
          }))
        })) as any;
        this.registrosHorasFiltradas = this.registrosHoras;
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
}

