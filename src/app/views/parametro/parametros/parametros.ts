import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { Parametro } from '@core/interfaces/parametro';
import { ParametroPage, ParametroService } from '@core/services/parametros';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ParametroCrud } from '../parametro-crud/parametro-crud';
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
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-parametros',
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
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './parametros.html',
  styleUrl: './parametros.scss'
})
export class Parametros extends TrabajarCon<Parametro> {
  readonly pantalla = 'parametros';
  protected override exportarExcelImpl(): void {
    throw new Error('Method not implemented.');
  }
  protected override procesarExcel(file: File): void {
    throw new Error('Method not implemented.');
  }
  protected override descargarPlantilla(): void {
    throw new Error('Method not implemented.');
  }
  private parametroService = inject(ParametroService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  parametros!: Parametro[];
  totalParametros = 0;
  globalFilter = '';
  sortField: 'clave' | 'valor' | 'tipo' | 'ambito' | 'descripcion' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.SISTEMA;
    this.viewAction = (parametro) => this.mostrarModalCrud(parametro, 'V');
  }

  onGlobalFilter(value: string): void { this.globalFilter = value; this.resetPaginator(); this.loadItems(); }
  onTableFilter(_event: TableFilterEvent): void { this.resetPaginator(); this.loadItems(); }
  onTablePage(event: TablePageEvent): void { this.loadItems(event.first, event.rows); }
  onTableSort(event: { field?: string; order?: number }): void { this.sortField = event.field as typeof this.sortField; this.sortDirection = event.order === 1 ? 'asc' : event.order === -1 ? 'desc' : undefined; this.resetPaginator(); this.loadItems(); }
  override clear(table: Table): void { super.clear(table); this.globalFilter = ''; }
  override applyPreset(id: string): void { this.resetPaginator(); super.applyPreset(id); }
  private resetPaginator(): void { if (this.table) this.table.first = 0; }
  private getColumnFilter(field: string): string | undefined { const value = this.table?.filters?.[field]; const filter = Array.isArray(value) ? value[0] : value; return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined; }

  protected loadItems(first = this.table?.first ?? 0, rows = this.table?.rows ?? 10): void {
    this.loadingService.show();
    this.parametroService.getAll({ globalSearch: this.globalFilter.trim(), clave: this.getColumnFilter('clave'), valor: this.getColumnFilter('valor'), tipo: this.getColumnFilter('tipo'), ambito: this.getColumnFilter('ambito'), descripcion: this.getColumnFilter('descripcion'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as ParametroPage;
        this.parametros = page.data;
        this.totalParametros = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los parámetros.')
    });
  }

  alta(parametro: Parametro): void {
    if (!this.beginAction()) return;
    delete parametro.id;
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.create(parametro).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Parámetro creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el parámetro.')
    });
  }

  editar(parametro: Parametro): void {
    if (!this.beginAction()) return;
    const parametroId = parametro.id ?? '';
    delete parametro.id;
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.update(parametroId, parametro).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Parámetro actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el parámetro.')
    });
  }

  eliminarDirecto(parametro: Parametro): void {
    if (!this.beginAction()) return;
    const parametroId = parametro.id ?? '';
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.delete(parametroId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Parámetro eliminado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar el parámetro.')
    });
  }

  mostrarModalCrud(parametro: Parametro | null, modo: 'A' | 'M' | 'V') {
    const data = { item: parametro, modo };
    const header = modo === 'A'
      ? 'Nuevo Parámetro'
      : modo === 'M'
        ? 'Modificar Parámetro'
        : 'Ver Parámetro';

    this.ref = this.dialogService.open(ParametroCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Parámetro actualizado correctamente.' : 'Parámetro creado correctamente.');
    });
  }
}
