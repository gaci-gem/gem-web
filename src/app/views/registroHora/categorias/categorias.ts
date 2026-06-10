import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { Categoria } from '@core/interfaces/registro-hora';
import { RegistroHoraService } from '@core/services/registro-hora';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CategoriaCrud } from '../categoria-crud/categoria-crud';
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
import { CommonModule } from '@angular/common';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-categorias',
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
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss'
})
export class Categorias extends TrabajarCon<Categoria> {
  protected override exportarExcelImpl(): void {
    // No aplica
  }
  protected override procesarExcel(file: File): void {
    // No aplica
  }
  protected override descargarPlantilla(): void {
    // No aplica
  }

  private registroHoraService = inject(RegistroHoraService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;

  categorias: Categoria[] = [];

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.TIPO_TRABAJO;
  }

  protected loadItems(): void {
    this.loadingService.show();
    this.registroHoraService.getCategorias().pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los tipos de trabajo.')
    });
  }

  alta(categoria: Categoria): void {
    this.registroHoraService.createCategoria(categoria).subscribe({
      next: () => this.afterChange('Tipo de trabajo creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el tipo de trabajo.')
    });
  }

  editar(categoria: Categoria): void {
    const codigo = categoria.codigo;
    this.registroHoraService.updateCategoria(codigo, categoria).subscribe({
      next: () => this.afterChange('Tipo de trabajo actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el tipo de trabajo.')
    });
  }

  eliminarDirecto(categoria: Categoria): void {
    this.registroHoraService.deleteCategoria(categoria.codigo).subscribe({
      next: () => this.afterChange('Tipo de trabajo eliminado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar el tipo de trabajo.')
    });
  }

  mostrarModalCrud(categoria: Categoria | null, modo: 'A' | 'M') {
    const data = { item: categoria, modo };
    const header = modo === 'A' ? 'Nuevo Tipo de Trabajo' : 'Modificar Tipo de Trabajo';

    this.ref = this.dialogService.open(CategoriaCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((categoriaCrud: Categoria) => {
      if (!categoriaCrud) return;
      modo === 'M' ? this.editar(categoriaCrud) : this.alta(categoriaCrud);
    });
  }
}
