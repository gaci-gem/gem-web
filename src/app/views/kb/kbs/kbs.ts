import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { kb } from '@core/interfaces/kb';
import { KbService } from '@core/services/kb';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { KbCrud } from '../kb-crud/kb-crud';
import { KbDeploys } from '../kb-deploys/kb-deploys';
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
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { PermisoAccion } from '@/app/types/permisos';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { PanelModule } from 'primeng/panel';
import { CatalogoFiltrosComponent } from '@app/components/catalogo-filtros';
import { CatalogoFiltroItemConfig, CatalogoFiltroState } from '@core/interfaces/catalogo-filter';

@Component({
  selector: 'app-kbs',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    CommonModule,
    BooleanLabelPipe,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    PanelModule,
    CatalogoFiltrosComponent,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './kbs.html',
  styleUrl: './kbs.scss'
})
export class Kbs extends TrabajarCon<kb> {
  private kbService = inject(KbService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  refDeploys!: DynamicDialogRef | null;

  kbs: kb[] = [];

  // Configuración de filtros de catálogo
  filtrosConfig: CatalogoFiltroItemConfig[] = [
    {
      paramName: 'plataforma',
      tipoCatalogo: 'KB_PLATAFORMA',
      label: 'Plataforma',
      placeholder: 'Seleccione plataformas',
      multiple: true
    },
    {
      paramName: 'tecnologia',
      tipoCatalogo: 'KB_TECNOLOGIA',
      label: 'Tecnología',
      placeholder: 'Seleccione tecnologías',
      multiple: true
    },
    {
      paramName: 'compilador',
      tipoCatalogo: 'KB_COMPILADOR',
      label: 'Compilador',
      placeholder: 'Seleccione compiladores',
      multiple: true
    },
    {
      paramName: 'tipo',
      tipoCatalogo: 'KB_TIPO',
      label: 'Tipo',
      placeholder: 'Seleccione tipos',
      multiple: true
    },
    {
      paramName: 'estado',
      tipoCatalogo: 'KB_ESTADO',
      label: 'Estado',
      placeholder: 'Seleccione estados',
      multiple: true
    },
    {
      paramName: 'uso_actual',
      tipoCatalogo: 'KB_USO_ACTUAL',
      label: 'Uso Actual',
      placeholder: 'Seleccione uso actual',
      multiple: true
    }
  ];

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.KB;
  }

  protected loadItems(): void {
    this.cargarKbs();
  }

  /**
   * Carga las KBs con los filtros actuales
   */
  private cargarKbs(catalogos?: CatalogoFiltroState): void {
    this.loadingService.show();
    const activo = this.filtroActivo === FiltroActivo.ALL ? undefined : this.filtroActivo === FiltroActivo.TRUE;
    
    this.kbService.findAll({ activo, catalogos }).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
        this.kbs = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar las KBs.')
    });
  }

  /**
   * Aplica los filtros de catálogo seleccionados
   */
  aplicarFiltros(filtros: CatalogoFiltroState): void {
    this.cargarKbs(filtros);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.cargarKbs();
  }

  alta(kb: kb): void {
    const kbData = { ...kb };
    delete (kbData as any).id;
    this.kbService.create(kbData).subscribe({
      next: () => this.afterChange('KB creada correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear la KB.')
    });
  }

  editar(kb: kb): void {
    let kbId = kb.id ?? 0;
    // Extraer id del objeto para no enviarlo en el body
    const { id, ...kbData } = kb;
    this.kbService.update(kbId, kbData).subscribe({
      next: () => this.afterChange('KB actualizada correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar la KB.')
    });
  }

  eliminarDirecto(kb: kb): void {
    let kbId = kb.id ?? 0;
    this.kbService.remove(kbId).subscribe({
      next: () => this.afterChange('KB eliminada correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar la KB.')
    });
  }

  mostrarModalCrud(kb: kb | null, modo: 'A' | 'M') {
    const data = { item: kb, modo };
    const header = modo === 'A' ? 'Nueva KB' : 'Modificar KB';

    this.ref = this.dialogService.open(KbCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      this.afterChange(modo === 'M' ? 'KB actualizada correctamente.' : 'KB creada correctamente.');
    });
  }

  mostrarModalDeploys(kb: kb) {
    const data = { kbId: kb.id, kbNombre: kb.nombre };
    const header = `Deploys - ${kb.nombre}`;

    this.refDeploys = this.dialogService.open(KbDeploys, {
      ...modalConfig,
      width: '80vw',
      header,
      data
    });

    if (!this.refDeploys) return;

    this.refDeploys.onClose.subscribe(() => {
      this.loadItems();
    });
  }

  exportarExcelImpl() {
    // TODO: Implementar exportación Excel cuando esté disponible en el backend
    this.showError('Exportación no implementada aún');
  }

  descargarPlantilla(): void {
    // TODO: Implementar descarga de plantilla cuando esté disponible en el backend
    this.showError('Descarga de plantilla no implementada aún');
  }

  procesarExcel(file: File): void {
    // TODO: Implementar importación Excel cuando esté disponible en el backend
    this.showError('Importación no implementada aún');
  }

  // Métodos helper para contar deploys
  getDeploysActivos(kb: kb): number {
    return kb.deploys?.filter(d => d.activo)?.length || 0;
  }

  getDeploysInactivos(kb: kb): number {
    console.log(kb.deploys);
    return kb.deploys?.filter(d => !d.activo)?.length || 0;
  }

  getTotalDeploys(kb: kb): number {
    return kb.deploys?.length || 0;
  }
}
