import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { TipoEvento } from '@core/interfaces/tipo-evento';
import { TipoEventoService } from '@core/services/tipo-evento';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TipoEventoCrud } from '../tipo-evento-crud/tipo-evento-crud';
import { modalConfig } from '@/app/types/modals';
import { UiCard } from '@app/components/ui-card';
import { TableModule } from 'primeng/table';
import { NgIcon } from '@ng-icons/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { TipoEventoPrioridadReglas } from '../tipo-evento-crear-regla/tipo-evento-crear-regla';
import { PrioridadService } from '@core/services/prioridad-regla';
import { PrioridadRegla } from '@core/interfaces/prioridad-reglas';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';
import { BadgeClickComponent } from "@app/components/badge-click";

@Component({
  selector: 'app-tipo-evento',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    BooleanLabelPipe,
    CommonModule,
    ControlTrabajarCon
],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './tipos-evento.html',
  styleUrl: './tipos-evento.scss'
})
export class TiposEvento extends TrabajarCon<TipoEvento> {
  private tipoEventoService = inject(TipoEventoService);
  private prioridadService = inject(PrioridadService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  refPrioridadRegla!: DynamicDialogRef | null;

  tiposEvento!:TipoEvento[];

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.TIPO_EVENTO;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.tipoEventoService.getAll().pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.tiposEvento = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los tipos de evento.')
    });
  }

  alta(tipoEvento: TipoEvento): void {
    this.tipoEventoService.create(tipoEvento).subscribe({
      next: () => this.afterChange('Tipo de Evento creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el tipo de Evento.')
    });
  }

  editar(tipoEvento: TipoEvento): void {
    let tipoEventoId = tipoEvento.codigo ?? '';
    this.tipoEventoService.update(tipoEventoId, tipoEvento).subscribe({
      next: () => this.afterChange('Tipo de Evento actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el tipo de Evento.')
    });
  }

  eliminarDirecto(tipoEvento: TipoEvento): void {
    let tipoEventoId = tipoEvento.codigo ?? '';
    this.tipoEventoService.delete(tipoEventoId).subscribe({
      next: () => this.afterChange('Tipo de Evento eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Tipo de Evento.')
    });
  }

  mostrarModalCrud(tipoEvento: TipoEvento | null, modo: 'A' | 'M') {
    const data = { item: tipoEvento, modo };
    const header = modo === 'A' ? 'Nuevo Tipo de Evento' : 'Modificar Tipo de Evento';

    this.ref = this.dialogService.open(TipoEventoCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((tipoEventoCrud: TipoEvento) => {
      if (!tipoEventoCrud) return;
      modo === 'M' ? this.editar(tipoEventoCrud) : this.alta(tipoEventoCrud);
    });
  }

  mostrarModalPrioridadReglas(tipoEvento: TipoEvento | null) {
    const data = { tipoEventoCodigo: tipoEvento?.codigo };
    const header = 'Reglas de Prioridad';

    this.refPrioridadRegla = this.dialogService.open(TipoEventoPrioridadReglas, {
      ...modalConfig,
      header,
      data
    });
  }

  descargarPlantilla() {
    this.tipoEventoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_tipos_evento.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  exportarExcelImpl() {
    this.tipoEventoService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_tipos_evento_${getTimestamp()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  procesarExcel(file: File): void {
    const form = new FormData();
    form.append('file', file);

    this.loadingService.show();
    this.tipoEventoService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Tipos de Evento importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar Tipos de Evento.')
    });
  }
}
