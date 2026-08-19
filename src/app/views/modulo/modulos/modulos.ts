import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Modulo } from '@core/interfaces/modulo';
import { ModuloService } from '@core/services/modulo';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ModuloCrud } from '../modulo-crud/modulo-crud';
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

@Component({
  selector: 'app-modulos',
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
  templateUrl: './modulos.html',
  styleUrl: './modulos.scss'
})
export class Modulos extends TrabajarCon<Modulo> {
  private moduloService = inject(ModuloService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  modulos!:Modulo[];

 constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.MODULO;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.moduloService.getAll(this.filtroActivo).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.modulos = res;
        if (this.filtroActivo !== FiltroActivo.ALL){
          this.modulos = this.modulos.filter((modulo) => {
            let aux = this.filtroActivo === FiltroActivo.TRUE;
            return modulo.activo === aux;
          });
        }
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los modulos.')
    });
  }

  alta(modulo: Modulo): void {
    this.moduloService.create(modulo).subscribe({
      next: () => this.afterChange('Modulo creado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al crear el modulo.')
    });
  }

  editar(modulo: Modulo): void {
    let moduloCodigo = modulo.codigo ?? '';
    this.moduloService.update(moduloCodigo, modulo).subscribe({
      next: () => this.afterChange('Modulo actualizado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al modificar el modulo.')
    });
  }

  eliminarDirecto(modulo: Modulo): void {
    let moduloCodigo = modulo.codigo ?? '';
    this.moduloService.delete(moduloCodigo).subscribe({
      next: () => this.afterChange('Modulo eliminado correctamente.'),
      error: (err) => this.showError(err.error.message ||'Error al eliminar el Modulo.')
    });
  }

  mostrarModalCrud(modulo: Modulo | null, modo: 'A' | 'M') {
    const data = { item: modulo, modo };
    const header = modo === 'A' ? 'Nuevo Modulo' : 'Modificar Modulo';

    this.ref = this.dialogService.open(ModuloCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'Modulo actualizado correctamente.' : 'Modulo creado correctamente.');
    });
  }

  descargarPlantilla() {
    this.moduloService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_modulos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.moduloService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_modulos_${getTimestamp()}.xlsx`;
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
    this.moduloService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Modulos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar modulos.')
    });
  }
}
