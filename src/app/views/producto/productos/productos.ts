import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Producto } from '@core/interfaces/producto';
import { ProductoPage, ProductoService } from '@core/services/producto';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableFilterEvent, TableModule, TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ProductosCrud } from '../productos-crud/productos-crud';
import { modalConfig } from '@/app/types/modals';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-productos',
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
    NgbDropdownModule,
    ControlTrabajarCon,
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.scss'
})
export class Productos extends TrabajarCon<Producto> {
  readonly pantalla = 'productos';
  private productoService = inject(ProductoService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  productos!:Producto[];
  totalProductos = 0;
  globalFilter = '';
  sortField: 'id' | 'sigla' | 'nombre' | 'entornoCodigo' | 'activo' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.PRODUCTO;
  }

  onGlobalFilter(value: string): void { this.globalFilter = value; this.resetPaginator(); this.loadItems(); }
  onTableFilter(_event: TableFilterEvent): void { this.resetPaginator(); this.loadItems(); }
  onTablePage(event: TablePageEvent): void { this.loadItems(event.first, event.rows); }
  onTableSort(event: any): void { this.sortField = event.sortField as typeof this.sortField; this.sortDirection = event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined; this.resetPaginator(); this.loadItems(); }
  override filtroCambio(event: any): void { this.filtroActivo = event; this.resetPaginator(); this.loadItems(); }
  override clear(table: Table): void { super.clear(table); this.globalFilter = ''; }
  override applyPreset(id: string): void { this.resetPaginator(); super.applyPreset(id); }
  private resetPaginator(): void { if (this.table) this.table.first = 0; }
  private getColumnFilter(field: string): string | undefined { const value = this.table?.filters?.[field]; const filter = Array.isArray(value) ? value[0] : value; return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined; }

  protected loadItems(first = this.table?.first ?? 0, rows = this.table?.rows ?? 10): void {
    this.loadingService.show();
    this.productoService.getAll(this.filtroActivo, { globalSearch: this.globalFilter.trim(), sigla: this.getColumnFilter('sigla'), nombre: this.getColumnFilter('nombre'), entornoCodigo: this.getColumnFilter('entornoCodigo'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as ProductoPage;
        this.productos = page.data;
        this.totalProductos = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los productos.')
    });
  }

  alta(producto: Producto): void {
    if (!this.beginAction()) return;
    delete producto.id
    this.productoService.create(producto).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Producto creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el producto.')
    });
  }

  editar(producto: Producto): void {
    if (!this.beginAction()) return;
    let productoId = producto.id ?? 0;
    this.productoService.update(productoId, producto).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Producto actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el producto.')
    });
  }

  eliminarDirecto(producto: Producto): void {
    if (!this.beginAction()) return;
    let productoId = producto.id ?? 0;
    this.productoService.delete(productoId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Producto eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Producto.')
    });
  }

  mostrarModalCrud(producto: Producto | null, modo: 'A' | 'M') {
    const data = { item: producto, modo };
    const header = modo === 'A' ? 'Nuevo Producto' : 'Modificar Producto';

    this.ref = this.dialogService.open(ProductosCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.productoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_productos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
    exportarExcelImpl() {
      this.productoService.exportarExcel(this.filtroActivo).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export_productos_${getTimestamp()}.xlsx`;
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
    this.productoService.importarProductos(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Productos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar productos.')
    });
  }

}
