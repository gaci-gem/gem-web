import { ChangeDetectorRef, Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Cliente } from '@core/interfaces/cliente';
import { ClientePage, ClienteService } from '@core/services/cliente';
import { LoadingService } from '@core/services/loading.service';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableFilterEvent, TableModule, TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ClienteCrud } from '../cliente-crud/cliente-crud';
import { modalConfig } from '@/app/types/modals';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';
import { ClienteCredencial } from '../credencial/cliente-credencial';

type TableSortEvent = { field?: string | null; order?: number | null };

@Component({
  selector: 'app-clientes',
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
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss'
})
export class Clientes extends TrabajarCon<Cliente> {
  readonly pantalla = 'clientes';
  private clienteService = inject(ClienteService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  clientes!: Cliente[];
  override actionInProgress = false;
  private pendingSearchId: number | null = null;
  totalClientes = 0;
  globalFilter = '';
  sortField: 'id' | 'sigla' | 'nombre' | 'activo' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.CLIENTE;
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
      const id = Number(params.get('searchId'));
      if (!Number.isInteger(id) || id < 1) return;
      this.pendingSearchId = id;
      this.openPendingSearchResult();
    });
  }

  onGlobalFilter(value: string): void {
    this.globalFilter = value;
    this.resetPaginator();
    this.loadItems();
  }

  onTableFilter(_event: TableFilterEvent): void {
    this.resetPaginator();
    this.loadItems();
  }

  onTablePage(event: TablePageEvent): void {
    this.loadItems(event.first, event.rows);
  }

  onTableSort(event: TableSortEvent): void {
    this.sortField = event.field as typeof this.sortField;
    this.sortDirection = event.order === 1 ? 'asc' : event.order === -1 ? 'desc' : undefined;
    this.resetPaginator();
    this.loadItems();
  }

  override filtroCambio(event: any): void {
    this.filtroActivo = event;
    this.resetPaginator();
    this.loadItems();
  }

  private resetPaginator(): void {
    if (this.table) this.table.first = 0;
  }

  protected loadItems(first = 0, rows = 10): void {
    this.loadingService.show();
    this.clienteService.getAll(this.filtroActivo, {
      globalSearch: this.globalFilter.trim(),
      sigla: this.getColumnFilter('sigla'),
      nombre: this.getColumnFilter('nombre'),
      page: Math.floor(first / rows) + 1,
      limit: rows,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
    }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as ClientePage;
        this.clientes = page.data;
        this.totalClientes = page.total;
        this.cdr.detectChanges();
        this.openPendingSearchResult();
      },
      error: () => {
        this.showError('Error al cargar los clientes.');
      }
    });
  }

  private getColumnFilter(field: string): string | undefined {
    const value = this.table?.filters?.[field];
    const filter = Array.isArray(value) ? value[0] : value;
    return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined;
  }

  private openPendingSearchResult(): void {
    if (this.pendingSearchId === null) return;
    const cliente = this.clientes?.find(item => item.id === this.pendingSearchId);
    if (cliente) {
      this.pendingSearchId = null;
      this.mostrarModalCrud(cliente, 'M');
      return;
    }
    const id = this.pendingSearchId;
    this.pendingSearchId = null;
    this.clienteService.getById(id).subscribe({
      next: item => this.mostrarModalCrud(item, 'M'),
      error: () => this.showError('Error al cargar el cliente.')
    });
  }

  isFiltered(table: Table): boolean {
    return this.filtroActivo !== FiltroActivo.TRUE || this.hasTableFilters(table);
  }

  private hasTableFilters(table: Table): boolean {
    return Object.values(table.filters ?? {}).some(value => {
      const filter = Array.isArray(value) ? value[0] : value;
      return filter?.value !== null && filter?.value !== undefined && filter.value !== '';
    });
  }

  alta(cliente: Cliente): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    delete cliente.id
    this.clienteService.create(cliente).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Cliente creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el cliente.')
    });
  }

  editar(cliente: Cliente): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let clienteId = cliente.id ?? 0;
    this.clienteService.update(clienteId, cliente).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Cliente actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el cliente.')
    });
  }

  eliminarDirecto(cliente: Cliente): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let clienteId = cliente.id ?? 0;
    this.clienteService.delete(clienteId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Cliente eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Cliente.')
    });
  }

  mostrarModalCrud(cliente: Cliente | null, modo: 'A' | 'M') {
    const data = { item: cliente, modo };
    const header = modo === 'A' ? 'Nuevo Cliente' : 'Modificar Cliente';

    this.ref = this.dialogService.open(ClienteCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
    });
  }

  administrarCredencial(cliente: Cliente): void {
    if (!this.permisosService.can('CLI.GEN_PORTAL')) return;
    this.ref = this.dialogService.open(ClienteCredencial, {
      ...modalConfig,
      header: 'Credencial del GEM Clientes',
      data: { cliente },
    });
  }

  descargarPlantilla() {
    this.clienteService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_clientes.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.clienteService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_clientes_${getTimestamp()}.xlsx`;
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
    this.clienteService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Clientes importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar clientes.')
    });
  }
}
