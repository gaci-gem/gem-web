import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { getReporteEstadoDescripcion, Reporte, ReporteEstadoDescripcion } from '@core/interfaces/reporte';
import { ReporteService } from '@core/services/reporte';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReporteCrud } from '../reporte-crud/reporte-crud';
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
import { BadgeClickComponent } from '@app/components/badge-click';
import { DrawerService } from '@core/services/drawer.service';
import { StatusBadgeComponent } from '@app/components/status-badge';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-reportes',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    ShortcutDirective,
    CommonModule,
    BadgeClickComponent,
    StatusBadgeComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class Reportes extends TrabajarCon<Reporte> {
  protected override exportarExcelImpl(): void {
    throw new Error('Method not implemented.');
  }
  protected override procesarExcel(file: File): void {
    throw new Error('Method not implemented.');
  }
  protected override descargarPlantilla(): void {
    throw new Error('Method not implemented.');
  }
  private reporteService = inject(ReporteService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private drawerService = inject(DrawerService);
  getReporteEstadoDescripcion = getReporteEstadoDescripcion;

  reportes!:Reporte[];

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.REPORTE;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.reporteService.getAll(this.filtroActivo).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.reportes = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los reportes.')
    });
  }

  alta(reporte: Reporte): void {
    delete reporte.id; // Asegurarse de no enviar un id al crear
    this.reporteService.create(reporte).subscribe({
      next: () => this.afterChange('Reporte creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el reporte.')
    });
  }

  editar(reporte: Reporte): void {
    let ReporteId = reporte.id ?? 0;
    this.reporteService.update(ReporteId, reporte).subscribe({
      next: () => this.afterChange('Reporte actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el reporte.')
    });
  }

  eliminarDirecto(reporte: Reporte): void {
    let reporteId = reporte.id ?? 0;
    this.reporteService.delete(reporteId).subscribe({
      next: () => this.afterChange('Reporte eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Reporte.')
    });
  }

  mostrarModalCrud(reporte: Reporte | null, modo: 'A' | 'M') {
    const data = { item: reporte, modo };
    const header = modo === 'A' ? 'Nuevo Reporte' : 'Modificar Reporte';

    this.ref = this.dialogService.open(ReporteCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Reporte actualizado correctamente.' : 'Reporte creado correctamente.');
    });
  }

  abrirUsuarioDrawer(usuarioId: string) {
    this.drawerService.abrirUsuarioDrawer(usuarioId);
  }

  descargarReporte(reporte: Reporte) {
    if (!reporte.archivoUrl) {
      this.showError('El reporte no tiene un archivo asociado para descargar.');
      return;
    }
    this.reporteService.descargarReporte(reporte.id!, { observe: 'response' }).subscribe({
      next: (response) => {
        const blob = response.body;
        let filename = '';

        if (reporte.archivoUrl) {
          let nombreArchivo = reporte.archivoUrl.split(/[\\\/]/).pop();
          if (!nombreArchivo) nombreArchivo = 'reporte.xlsx';
          filename = nombreArchivo;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        if (filename) {
          a.download = filename;
        }
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
