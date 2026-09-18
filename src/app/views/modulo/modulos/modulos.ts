import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Modulo } from '@core/interfaces/modulo';
import { ModuloPage, ModuloService } from '@core/services/modulo';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableFilterEvent, TableModule, TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ModuloCrud } from '../modulo-crud/modulo-crud';
import { modalConfig } from '@/app/types/modals';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-modulos',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    BooleanLabelPipe,
    CommonModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './modulos.html',
  styleUrl: './modulos.scss'
})
export class Modulos extends TrabajarCon<Modulo> {
  readonly pantalla = 'modulos';
  private moduloService = inject(ModuloService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  modulos!:Modulo[];
  totalModulos = 0; globalFilter = ''; sortField: 'codigo' | 'nombre' | 'padreCodigo' | 'activo' | undefined; sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.MODULO;
  }

  onGlobalFilter(value: string): void { this.globalFilter = value; this.resetPaginator(); this.loadItems(); }
  onTableFilter(_event: TableFilterEvent): void { this.resetPaginator(); this.loadItems(); }
  onTablePage(event: TablePageEvent): void { this.loadItems(event.first, event.rows); }
  onTableSort(event: any): void { this.sortField = event.sortField as typeof this.sortField; this.sortDirection = event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined; this.resetPaginator(); this.loadItems(); }
  override filtroCambio(event: any): void { this.filtroActivo = event; this.resetPaginator(); this.loadItems(); }
  private resetPaginator(): void { if (this.table) this.table.first = 0; }
  private getColumnFilter(field: string): string | undefined { const value = this.table?.filters?.[field]; const filter = Array.isArray(value) ? value[0] : value; return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined; }

  protected loadItems(first = 0, rows = 10): void {
    this.loadingService.show();
    this.moduloService.getAll(this.filtroActivo, { globalSearch: this.globalFilter.trim(), codigo: this.getColumnFilter('codigo'), nombre: this.getColumnFilter('nombre'), padreCodigo: this.getColumnFilter('padreCodigo'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as ModuloPage; this.modulos = page.data; this.totalModulos = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los modulos.')
    });
  }

  alta(modulo: Modulo): void {
    if (!this.beginAction()) return;
    this.moduloService.create(modulo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Modulo creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el modulo.')
    });
  }

  editar(modulo: Modulo): void {
    if (!this.beginAction()) return;
    let moduloCodigo = modulo.codigo ?? '';
    this.moduloService.update(moduloCodigo, modulo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Modulo actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el modulo.')
    });
  }

  eliminarDirecto(modulo: Modulo): void {
    if (!this.beginAction()) return;
    let moduloCodigo = modulo.codigo ?? '';
    this.moduloService.delete(moduloCodigo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Modulo eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Modulo.')
    });
  }

  mostrarModalCrud(modulo: Modulo | null, modo: 'A' | 'M') {
    const data = { item: modulo, modo };
    const header = modo === 'A' ? 'Nuevo Modulo' : 'Modificar Modulo';

    this.ref = this.dialogService.open(ModuloCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Modulo actualizado correctamente.' : 'Modulo creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.moduloService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_modulos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.moduloService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_modulos_${getTimestamp()}.xlsx`;
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
    this.moduloService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Modulos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar modulos.')
    });
  }
}
