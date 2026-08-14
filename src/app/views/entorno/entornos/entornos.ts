import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { Entorno } from '@core/interfaces/entorno';
import { EntornoService } from '@core/services/entorno';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EntornosCrud } from '../entornos-crud/entornos-crud';
import { modalConfig } from '@/app/types/modals';
import { UiCard } from '@app/components/ui-card';
import { TableModule } from 'primeng/table';
import { NgIcon } from '@ng-icons/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ShortcutDirective } from '@core/directive/shortcut';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-entornos',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    FiltroRadioGroupComponent,
    BooleanLabelPipe,
    CommonModule,
    ControlTrabajarCon,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './entornos.html',
  styleUrl: './entornos.scss'
})
export class Entornos extends TrabajarCon<Entorno> {
  private entornoService = inject(EntornoService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  entornos!:Entorno[];

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.ENTORNO;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.entornoService.getAll(this.filtroActivo).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.entornos = res;
        if (this.filtroActivo !== FiltroActivo.ALL){
          this.entornos = this.entornos.filter((entorno) => {
            let aux = this.filtroActivo === FiltroActivo.TRUE;
            return entorno.activo === aux;
          });
        }
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los entornos.')
    });
  }

  alta(entorno: Entorno): void {
    this.entornoService.create(entorno).subscribe({
      next: () => this.afterChange('Entorno creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el entorno.')
    });
  }

  editar(entorno: Entorno): void {
    let entornoCodigo = entorno.codigo ?? '';
    this.entornoService.update(entornoCodigo, entorno).subscribe({
      next: () => this.afterChange('Entorno actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el entorno.')
    });
  }

  eliminarDirecto(entorno: Entorno): void {
    let entornoCodigo = entorno.codigo ?? '';
    this.entornoService.delete(entornoCodigo).subscribe({
      next: () => this.afterChange('Entorno eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Entorno.')
    });
  }

  mostrarModalCrud(entorno: Entorno | null, modo: 'A' | 'M') {
    const data = { item: entorno, modo };
    const header = modo === 'A' ? 'Nuevo Entorno' : 'Modificar Entorno';

    this.ref = this.dialogService.open(EntornosCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Entorno actualizado correctamente.' : 'Entorno creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.entornoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_entornos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.entornoService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_entornos_${getTimestamp()}.xlsx`;
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
    this.entornoService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Entornos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar entornos.')
    });
  }
}
