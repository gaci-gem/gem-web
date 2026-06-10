import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { PermisoClave, Rol } from '@core/interfaces/rol';
import { RolService } from '@core/services/rol';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RolCrud } from '../rol-crud/rol-crud';
import { modalConfig } from '@/app/types/modals';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { TableModule } from 'primeng/table';
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
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    CommonModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
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
  private rolService = inject(RolService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  roles!:Rol[];
  primaryColor: string = getColor('primary');

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.ROL;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.rolService.getAll(this.filtroActivo).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.roles = res;
        if (this.filtroActivo !== FiltroActivo.ALL){
          this.roles = this.roles.filter((rol) => {
            let aux = this.filtroActivo === FiltroActivo.TRUE;
            return rol.activo === aux;
          });
        }
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los roles.')
    });
  }

  alta(rol: Rol): void {
    this.rolService.create(rol).subscribe({
      next: () => this.afterChange('Rol creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el rol.')
    });
  }

  editar(rol: Rol): void {
    let rolCodigo = rol.codigo ?? '';
    this.rolService.update(rolCodigo, rol).subscribe({
      next: () => this.afterChange('Rol actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el rol.')
    });
  }

  eliminarDirecto(rol: Rol): void {
    let rolCodigo = rol.codigo ?? '';
    this.rolService.delete(rolCodigo).subscribe({
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

    this.ref.onClose.subscribe((rolCrud: Rol) => {
      if (!rolCrud) return;
      modo === 'M' ? this.editar(rolCrud) : this.alta(rolCrud);
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
