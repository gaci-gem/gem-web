import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { PermisoClave, Rol } from '@core/interfaces/rol';
import { RolPage, RolService } from '@core/services/rol';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RolCrud } from '../rol-crud/rol-crud';
import { modalConfig } from '@/app/types/modals';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { Table, TableFilterEvent, TableModule, TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { UiCard } from '@app/components/ui-card';
import { BadgeClickComponent } from '@app/components/badge-click';
import { ShortcutDirective } from '@core/directive/shortcut';
import { finalize } from 'rxjs';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';
import { getColor } from '@/app/utils/color-utils';

@Component({
  selector: 'app-roles',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
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
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles extends TrabajarCon<Rol> {
  readonly pantalla = 'roles';
  private rolService = inject(RolService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  roles!:Rol[];
  primaryColor: string = getColor('primary');
  totalRoles = 0; globalFilter = ''; sortField: 'codigo' | 'descripcion' | 'color' | 'activo' | undefined; sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.ROL;
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
    this.rolService.getAll(this.filtroActivo, { globalSearch: this.globalFilter.trim(), codigo: this.getColumnFilter('codigo'), descripcion: this.getColumnFilter('descripcion'), page: Math.floor(first / rows) + 1, limit: rows, sortField: this.sortField, sortDirection: this.sortDirection }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as RolPage; this.roles = page.data; this.totalRoles = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los roles.')
    });
  }

  alta(rol: Rol): void {
    if (!this.beginAction()) return;
    this.rolService.create(rol).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Rol creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el rol.')
    });
  }

  editar(rol: Rol): void {
    if (!this.beginAction()) return;
    let rolCodigo = rol.codigo ?? '';
    this.rolService.update(rolCodigo, rol).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Rol actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el rol.')
    });
  }

  eliminarDirecto(rol: Rol): void {
    if (!this.beginAction()) return;
    let rolCodigo = rol.codigo ?? '';
    this.rolService.delete(rolCodigo).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Rol eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Rol.')
    });
  }

  mostrarModalCrud(rol: Rol | null, modo: 'A' | 'M') {
    const data = { item: rol, modo };
    const header = modo === 'A' ? 'Nuevo Rol' : 'Modificar Rol';

    this.ref = this.dialogService.open(RolCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.rolService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_roles.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.rolService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_roles_${getTimestamp()}.xlsx`;
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
    this.rolService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Roles importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar roles.')
    });
  }
}
