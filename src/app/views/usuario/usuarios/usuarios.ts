import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { Usuario } from '@core/interfaces/usuario';
import { UsuarioService } from '@core/services/usuario';
import { NgIcon } from '@ng-icons/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { UsuarioCrud } from '../usuario-crud/usuario-crud';
import { modalConfig } from '@/app/types/modals';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { SHORTCUTS } from 'src/app/constants/shortcut';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { DrawerService } from '@core/services/drawer.service';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { RolService } from '@core/services/rol';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-usuarios',
  imports: [
    UiCard,
    TableModule,
    DatePipe,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
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
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private drawerService = inject(DrawerService);

  usuarios!:Usuario[];
  roles: any[] = [];
  rolSeleccionado: string | null = null;

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
    this.loadItems();
  }

  protected loadItems(): void {
    this.loadingService.show();
    
    const request$ = this.rolSeleccionado 
      ? this.usuarioService.getByRol(this.rolSeleccionado)
      : this.usuarioService.getAll(this.filtroActivo);

    request$.pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.usuarios = res;
        if (this.filtroActivo !== FiltroActivo.ALL){
          this.usuarios = this.usuarios.filter((usuario) => {
            let aux = this.filtroActivo === FiltroActivo.TRUE;
            return usuario.activo === aux;
          });
        }
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los usuarios.')
    });
  }

  alta(usuario: Usuario): void {
    delete usuario.id;
    this.usuarioService.create(usuario).subscribe({
      next: () => this.afterChange('Usuario creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el usuario.')
    });
  }

  editar(usuario: Usuario): void {
    delete usuario.password;
    let usuarioId = usuario.id ?? '';
    this.usuarioService.update(usuarioId, usuario).subscribe({
      next: () => this.afterChange('Usuario actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el usuario.')
    });
  }

  eliminarDirecto(usuario: Usuario): void {
    let usuarioId = usuario.id ?? '';
    this.usuarioService.delete(usuarioId).subscribe({
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
