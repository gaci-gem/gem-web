import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { Entorno } from '@core/interfaces/entorno';
import { EntornoPage, EntornoService } from '@core/services/entorno';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntornosCrud } from '../entornos-crud/entornos-crud';
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
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-entornos',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    FiltroRadioGroupComponent,
    BooleanLabelPipe,
    CommonModule,
    ControlTrabajarCon,
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './entornos.html',
  styleUrl: './entornos.scss'
})
export class Entornos extends TrabajarCon<Entorno> {
  readonly pantalla = 'entornos';
  private entornoService = inject(EntornoService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  entornos!:Entorno[];
  totalEntornos = 0;
  globalFilter = '';
  sortField: 'codigo' | 'nombre' | 'activo' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;
  override actionInProgress = false;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.ENTORNO;
  }

  onGlobalFilter(value: string): void { this.globalFilter = value; this.resetPaginator(); this.loadItems(); }
  onTableFilter(_event: TableFilterEvent): void { this.resetPaginator(); this.loadItems(); }
  onTablePage(event: TablePageEvent): void { this.loadItems(event.first, event.rows); }
  onTableSort(event: { field?: string; order?: number }): void { this.sortField = event.field as typeof this.sortField; this.sortDirection = event.order === 1 ? 'asc' : event.order === -1 ? 'desc' : undefined; this.resetPaginator(); this.loadItems(); }
  override filtroCambio(event: any): void { this.filtroActivo = event; this.resetPaginator(); this.loadItems(); }
  private resetPaginator(): void { if (this.table) this.table.first = 0; }
  private getColumnFilter(field: string): string | undefined { const value = this.table?.filters?.[field]; const filter = Array.isArray(value) ? value[0] : value; return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined; }

  protected loadItems(first = 0, rows = 10): void {
    this.loadingService.show();
    this.entornoService.getAll(this.filtroActivo, { globalSearch: this.globalFilter.trim(), codigo: this.getColumnFilter('codigo'), nombre: this.getColumnFilter('nombre'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as EntornoPage;
        this.entornos = page.data;
        this.totalEntornos = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los entornos.')
    });
  }

  alta(entorno: Entorno): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    this.entornoService.create(entorno).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Entorno creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el entorno.')
    });
  }

  editar(entorno: Entorno): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let entornoCodigo = entorno.codigo ?? '';
    this.entornoService.update(entornoCodigo, entorno).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Entorno actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el entorno.')
    });
  }

  eliminarDirecto(entorno: Entorno): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let entornoCodigo = entorno.codigo ?? '';
    this.entornoService.delete(entornoCodigo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Entorno eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Entorno.')
    });
  }

  mostrarModalCrud(entorno: Entorno | null, modo: 'A' | 'M') {
    const data = { item: entorno, modo };
    const header = modo === 'A' ? 'Nuevo Entorno' : 'Modificar Entorno';

    this.ref = this.dialogService.open(EntornosCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Entorno actualizado correctamente.' : 'Entorno creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.entornoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_entornos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.entornoService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_entornos_${getTimestamp()}.xlsx`;
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
    this.entornoService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Entornos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar entornos.')
    });
  }
}
