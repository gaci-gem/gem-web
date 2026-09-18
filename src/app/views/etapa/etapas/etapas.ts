import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { Etapa } from '@core/interfaces/etapa';
import { EtapaPage, EtapaService } from '@core/services/etapa';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EtapaCrud } from '../etapa-crud/etapa-crud';
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
import { CommonModule } from '@angular/common';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-etapas',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    CommonModule,
    BooleanLabelPipe,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    FiltroPresetsComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './etapas.html',
  styleUrl: './etapas.scss'
})
export class Etapas extends TrabajarCon<Etapa> {
  readonly pantalla = 'etapas';
  private etapaService = inject(EtapaService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  etapas!:Etapa[];
  totalEtapas = 0; globalFilter = ''; sortField: 'id' | 'nombre' | 'rolPreferido' | 'categoriaSugeridaCodigo' | 'activo' | undefined; sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.ETAPA;
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
    this.etapaService.getAll(this.filtroActivo, { globalSearch: this.globalFilter.trim(), nombre: this.getColumnFilter('nombre'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as EtapaPage; this.etapas = page.data; this.totalEtapas = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar las etapas.')
    });
  }

  alta(etapa: Etapa): void {
    if (!this.beginAction()) return;
    delete etapa.id;
    etapa.requisitos?.map(req => {
      delete req.id
      return req;
    });
    this.etapaService.create(etapa).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Etapa creada correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear la etapa.')
    });
  }

  editar(etapa: Etapa): void {
    if (!this.beginAction()) return;
    let etapaId = etapa.id ?? '';
    this.etapaService.update(etapaId, etapa).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Etapa actualizada correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar la etapa.')
    });
  }

  eliminarDirecto(etapa: Etapa): void {
    if (!this.beginAction()) return;
    let etapaId = etapa.id ?? '';
    this.etapaService.delete(etapaId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Etapa eliminada correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar la Etapa.')
    });
  }

  mostrarModalCrud(etapa: Etapa | null, modo: 'A' | 'M') {
    const data = { item: etapa, modo };
    const header = modo === 'A' ? 'Nueva Etapa' : 'Modificar Etapa';

    this.ref = this.dialogService.open(EtapaCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Etapa actualizada correctamente.' : 'Etapa creada correctamente.');
    });
  }

  descargarPlantilla() {
    this.etapaService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_etapas.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.etapaService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_etapas_${getTimestamp()}.xlsx`;
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
    this.etapaService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Etapas importadas correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar etapas.')
    });
  }
}
