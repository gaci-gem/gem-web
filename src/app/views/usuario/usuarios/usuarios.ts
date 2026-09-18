import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { Usuario } from '@core/interfaces/usuario';
import { UsuarioPage, UsuarioService } from '@core/services/usuario';
import { NgIcon } from '@ng-icons/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { UsuarioCrud } from '../usuario-crud/usuario-crud';
import { modalConfig } from '@/app/types/modals';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SHORTCUTS } from 'src/app/constants/shortcut';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { TableFilterEvent, TablePageEvent } from 'primeng/table';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { DrawerService } from '@core/services/drawer.service';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { RolService } from '@core/services/rol';
import { PermisoAccion } from '@/app/types/permisos';

type TableSortEvent = { sortField?: string | null; sortOrder?: number | null };

@Component({
  selector: 'app-usuarios',
  imports: [
    UiCard,
    TableModule,
    InputTextModule,
    DatePipe,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    FiltroPresetsComponent,
    SelectModule,
    FormsModule,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios extends TrabajarCon<Usuario> {
  readonly pantalla = 'usuarios';
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private drawerService = inject(DrawerService);

  usuarios!:Usuario[];
  roles: any[] = [];
  rolSeleccionado: string | null = null;
  override actionInProgress = false;
  totalUsuarios = 0;
  globalFilter = '';
  sortField: 'id' | 'nombre' | 'apellido' | 'email' | 'usuario' | 'createdAt' | 'ultimo_login' | undefined;
  sortDirection: 'asc' | 'desc' | undefined;
  @ViewChild('dt') table?: Table;

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.USUARIO;
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.rolService.getAll().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los roles.')
    });
  }

  filtrarPorRol(): void {
    this.resetPaginator();
    this.loadItems();
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
    this.sortField = event.sortField as typeof this.sortField;
    this.sortDirection = event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined;
    this.resetPaginator();
    this.loadItems();
  }

  isFiltered(table: Table): boolean {
    return this.rolSeleccionado !== null || this.filtroActivo !== FiltroActivo.TRUE || this.hasTableFilters(table);
  }

  private hasTableFilters(table: Table): boolean {
    return Object.values(table.filters ?? {}).some(value => {
      const filter = Array.isArray(value) ? value[0] : value;
      return filter?.value !== null && filter?.value !== undefined && filter.value !== '';
    });
  }

  override clear(table: Table): void {
    this.rolSeleccionado = null;
    super.clear(table);
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
    const request$ = this.usuarioService.getAll(this.filtroActivo, {
      globalSearch: this.globalFilter.trim(),
      rol: this.rolSeleccionado ?? undefined,
      nombre: this.getColumnFilter('nombre'),
      apellido: this.getColumnFilter('apellido'),
      usuario: this.getColumnFilter('usuario'),
      page: Math.floor(first / rows) + 1,
      limit: rows,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
    });

    request$.pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        const page = res as UsuarioPage;
        this.usuarios = page.data;
        this.totalUsuarios = page.total;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los usuarios.')
    });
  }

  private getColumnFilter(field: string): string | undefined {
    const value = this.table?.filters?.[field];
    const filter = Array.isArray(value) ? value[0] : value;
    return typeof filter?.value === 'string' && filter.value.trim() ? filter.value.trim() : undefined;
  }

  alta(usuario: Usuario): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    delete usuario.id;
    this.usuarioService.create(usuario).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Usuario creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el usuario.')
    });
  }

  editar(usuario: Usuario): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    delete usuario.password;
    let usuarioId = usuario.id ?? '';
    this.usuarioService.update(usuarioId, usuario).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Usuario actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el usuario.')
    });
  }

  eliminarDirecto(usuario: Usuario): void {
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let usuarioId = usuario.id ?? '';
    this.usuarioService.delete(usuarioId).pipe(finalize(() => this.actionInProgress = false)).subscribe({
      next: () => this.afterChange('Usuario eliminado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar el usuario.')
    });
  }

  mostrarModalCrud(usuario: Usuario | null, modo: 'A' | 'M') {
    const data = { item: usuario, modo };
    const header = modo === 'A' ? 'Nuevo Usuario' : 'Modificar Usuario';

    this.ref = this.dialogService.open(UsuarioCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    });
  }

  abrirUsuarioDrawer(usuarioId: string) {
    this.drawerService.abrirUsuarioDrawer(usuarioId);
  }

  descargarPlantilla() {
    this.usuarioService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_usuarios.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.usuarioService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_usuarios_${getTimestamp()}.xlsx`;
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
    this.usuarioService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Usuarios importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar usuarios.')
    });
  }
  
}
