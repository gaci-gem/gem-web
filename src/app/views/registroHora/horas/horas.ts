import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrabajarCon, UiCard } from '@app/components/index';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { modalConfig } from '@/app/types/modals';
import { getFechaLocal, parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { getTimestamp } from '@/app/utils/time-utils';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { RegistroHoraService } from '@core/services/registro-hora';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule, TableRowCollapseEvent, TableRowExpandEvent } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { HoraCrud } from '../hora-crud/hora-crud';

@Component({
  selector: 'app-horas',
  imports: [
    UiCard,
    TableModule,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    DatePickerModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    ControlTrabajarCon,
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
  private registroHoraService = inject(RegistroHoraService);
  private dialogService = inject(DialogService);

  ref!: DynamicDialogRef | null;
  getFechaLocal = getFechaLocal;

  registrosHorasGenerales!: UsuarioHorasGenerales[];
  registrosHorasGeneralesFiltradas!: UsuarioHorasGenerales[];

  dateRangeFilter: Date[] | undefined;

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
    this.onFechaChange();
  }

  private inicializarFiltroFecha(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    this.dateRangeFilter = [inicioMes, finMes];
  }

  alta(registroHora: RegistroHora): void {
    delete registroHora.id
    this.registroHoraService.create(registroHora).subscribe({
      next: () => this.afterChange('Registro de Hora creado correctamente.'),
      error: () => this.showError('Error al crear el registro de Hora.')
    });
  }

  editar(registroHora: RegistroHora): void {
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.update(registroHoraId, registroHora).subscribe({
      next: () => this.afterChange('Registro de Hora actualizado correctamente.'),
      error: () => this.showError('Error al modificar el registro de Hora.')
    });
  }

  eliminarDirecto(registroHora: RegistroHora): void {
    let registroHoraId = registroHora.id ?? 0;
    this.registroHoraService.delete(registroHoraId).subscribe({
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

    this.ref.onClose.subscribe((registroHoraCrud: RegistroHora) => {
      if (!registroHoraCrud) return;
      modo === 'M' ? this.editar(registroHoraCrud) : this.alta(registroHoraCrud);
    });
  }

  onFechaChange(): void {
    if (this.dateRangeFilter && this.dateRangeFilter.length === 2 && this.dateRangeFilter[0] && this.dateRangeFilter[1]) {
      this.consultarRegistros(this.dateRangeFilter[0], this.dateRangeFilter[1]);
    }
  }

  onClearFecha(): void {
    this.inicializarFiltroFecha();
    this.onFechaChange();
  }

  consultarRegistros(desde: Date, hasta: Date) {
    this.loadingService.show();
    this.registroHoraService.getHorasGenerales(desde, hasta).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        // console.log(res)
        const registros = (res || []).map((usuario: any) => {
          const registrosHora = Array.isArray(usuario.registrosHora)
            ? usuario.registrosHora.map((reg: any) => {
                const fecha = reg?.fecha ? parseIsoAsLocal(reg.fecha) : undefined;
                const horas = Array.isArray(reg.horas)
                  ? reg.horas.map((h: any) => ({
                      ...h,
                      inicio: h?.inicio ? parseIsoAsLocal(h.inicio) : undefined,
                      fin: h?.fin ? parseIsoAsLocal(h.fin) : undefined
                    }))
                  : reg.horas;
                return { ...reg, fecha, horas };
              })
            : usuario.registrosHora;
          return { ...usuario, registrosHora };
        });

        const filtrados = registros.filter((usuario: any) =>
          Array.isArray(usuario.registrosHora) && usuario.registrosHora.length > 0
        );
        this.registrosHorasGenerales = filtrados;
        this.registrosHorasGeneralesFiltradas = filtrados;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los registros de Hora.')
    });
  }
}
