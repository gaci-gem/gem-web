import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { Parametro } from '@core/interfaces/parametro';
import { ParametroService } from '@core/services/parametros';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ParametroCrud } from '../parametro-crud/parametro-crud';
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
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { CommonModule } from '@angular/common';
import { BadgeClickComponent } from '@app/components/badge-click';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-parametros',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    ShortcutDirective,
    CommonModule,
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

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.SISTEMA;
    this.viewAction = (parametro) => this.mostrarModalCrud(parametro, 'V');
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.parametroService.getAll().pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.parametros = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los parámetros.')
    });
  }

  alta(parametro: Parametro): void {
    delete parametro.id;
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.create(parametro).subscribe({
      next: () => this.afterChange('Parámetro creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el parámetro.')
    });
  }

  editar(parametro: Parametro): void {
    const parametroId = parametro.id ?? '';
    delete parametro.id;
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.update(parametroId, parametro).subscribe({
      next: () => this.afterChange('Parámetro actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el parámetro.')
    });
  }

  eliminarDirecto(parametro: Parametro): void {
    const parametroId = parametro.id ?? '';
    delete parametro.createdAt;
    delete parametro.updatedAt;
    this.parametroService.delete(parametroId).subscribe({
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
