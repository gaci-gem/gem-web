import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { getReporteEstadoDescripcion, Reporte, ReporteEstadoDescripcion } from '@core/interfaces/reporte';
import { ReportePage, ReporteService } from '@core/services/reporte';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReporteCrud } from '../reporte-crud/reporte-crud';
import { modalConfig } from '@/app/types/modals';
import { UiCard } from '@app/components/ui-card';
import { Table, TableFilterEvent, TableModule, TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
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
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';

@Component({
  selector: 'app-reportes',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    ShortcutDirective,
    CommonModule,
    BadgeClickComponent,
    StatusBadgeComponent,
    FiltroPresetsComponent,
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
  readonly pantalla = 'reportes';
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

  reportes: Reporte[] = [];
  totalReportes = 0;
  globalFilter = '';
  sortField: 'id' | 'tipo' | 'solicitadoEn' | 'generadoEn' | 'estado' | 'errorDescripcion' | 'usuario' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.REPORTE;
  }

  protected loadItems(first = this.table?.first ?? 0, rows = this.table?.rows ?? 10): void {
    this.loadingService.show();
    this.reporteService.getAll(this.filtroActivo, {
      globalSearch: this.globalFilter.trim(),
      tipo: this.getColumnFilter('tipo'),
      parametros: this.getColumnFilter('parametros'),
      usuario: this.getColumnFilter('usuario'),
      solicitadoEn: this.getColumnFilter('solicitadoEn'),
      generadoEn: this.getColumnFilter('generadoEn'),
      estado: this.getColumnFilter('estado'),
      errorDescripcion: this.getColumnFilter('errorDescripcion'),
      page: Math.floor(first / rows) + 1,
      limit: rows,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
    }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as ReportePage;
        this.reportes = page.data;
        this.totalReportes = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los reportes.')
    });
  }

  onGlobalFilter(value: string): void { this.globalFilter = value; this.resetPaginator(); this.loadItems(); }
  onTableFilter(_event: TableFilterEvent): void { this.resetPaginator(); this.loadItems(); }
  onTablePage(event: TablePageEvent): void { this.loadItems(event.first, event.rows); }
  onTableSort(event: any): void {
    this.sortField = event.sortField as typeof this.sortField;
    this.sortDirection = event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined;
    this.resetPaginator();
    this.loadItems();
  }
  override clear(table: Table): void { super.clear(table); this.globalFilter = ''; }
  override applyPreset(id: string): void { this.resetPaginator(); super.applyPreset(id); }
  private resetPaginator(): void { if (this.table) this.table.first = 0; }
  private getColumnFilter(field: string): string | undefined {
    const value = this.table?.filters?.[field];
    const filter = Array.isArray(value) ? value[0] : value;
    return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined;
  }

  alta(reporte: Reporte): void {
    if (!this.beginAction()) return;
    delete reporte.id; // Asegurarse de no enviar un id al crear
    this.reporteService.create(reporte).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Reporte creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el reporte.')
    });
  }

  editar(reporte: Reporte): void {
    if (!this.beginAction()) return;
    let ReporteId = reporte.id ?? 0;
    this.reporteService.update(ReporteId, reporte).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Reporte actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el reporte.')
    });
  }

  eliminarDirecto(reporte: Reporte): void {
    if (!this.beginAction()) return;
    let reporteId = reporte.id ?? 0;
    this.reporteService.delete(reporteId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
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
