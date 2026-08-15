import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Cliente } from '@core/interfaces/cliente';
import { ClienteService } from '@core/services/cliente';
import { LoadingService } from '@core/services/loading.service';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ClienteCrud } from '../cliente-crud/cliente-crud';
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
import { ClienteCredencial } from '../credencial/cliente-credencial';

@Component({
  selector: 'app-clientes',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    BooleanLabelPipe,
    CommonModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
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
  private clienteService = inject(ClienteService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  clientes!: Cliente[];

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
        this.permisoClave = PermisoClave.CLIENTE;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.clienteService.getAll(this.filtroActivo).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.clientes = res;
        if (this.filtroActivo !== FiltroActivo.ALL){
          this.clientes = this.clientes.filter((cliente) => {
            let aux = this.filtroActivo === FiltroActivo.TRUE;
            return cliente.activo === aux;
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.showError('Error al cargar los clientes.');
      }
    });
  }

  alta(cliente: Cliente): void {
    delete cliente.id
    this.clienteService.create(cliente).subscribe({
      next: () => this.afterChange('Cliente creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el cliente.')
    });
  }

  editar(cliente: Cliente): void {
    let clienteId = cliente.id ?? 0;
    this.clienteService.update(clienteId, cliente).subscribe({
      next: () => this.afterChange('Cliente actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el cliente.')
    });
  }

  eliminarDirecto(cliente: Cliente): void {
    let clienteId = cliente.id ?? 0;
    this.clienteService.delete(clienteId).subscribe({
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
