import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiCard } from '@app/components/ui-card';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToolbarModule } from 'primeng/toolbar';
import { BadgeClickComponent } from '@app/components/badge-click';
import { DrawerService } from '@core/services/drawer.service';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { NovedadService } from '@core/services/novedad';
import {
  Novedad,
  NovedadTipo,
  NovedadEstado,
  QueryNovedadDto,
  PaginatedNovedadResponse,
} from '@core/interfaces/novedad';
import { modalConfig } from '@/app/types/modals';
import { getTipoBadge, getEstadoBadge } from '@common/novedad-utils';
import { NovedadCreateModal } from './components/novedad-create-modal';
import { NovedadViewModal } from './components/novedad-view-modal';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-novedad-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    UiCard,
    NgIcon,
    TableModule,
    SelectModule,
    DatePickerModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    FiltroRadioGroupComponent,
    BadgeClickComponent,
  ],
  providers: [DialogService, ConfirmationService, MessageService],
  templateUrl: './novedad-history.html',
})
export class NovedadHistory extends TrabajarCon<Novedad> {
  private novedadService = inject(NovedadService);
  private dialogService = inject(DialogService);
  private drawerService = inject(DrawerService);
  ref!: DynamicDialogRef | null;

  novedades: Novedad[] = [];
  total = 0;
  loading = false;
  page = 0;
  limit = 10;

  // Filters
  filterTipo = '';
  filterEstado = '';
  filterFecha: Date[] | undefined;

  // Dropdown options
  readonly getTipoBadge = getTipoBadge;
  readonly getEstadoBadge = getEstadoBadge;

  tipoOptions = [
    { label: 'Todas', value: '' },
    { label: 'Común', value: NovedadTipo.COMUN },
    { label: 'Aviso', value: NovedadTipo.AVISO },
    { label: 'Urgencia', value: NovedadTipo.URGENCIA },
  ];

  estadoFiltroOptions = [
    { value: '', label: 'Todos', icon: 'lucideAsterisk' },
    { value: 'Activo', label: 'Activos', icon: 'lucideCheckCircle' },
    { value: 'Archivado', label: 'Archivados', icon: 'lucideArchive' },
  ];

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.NOV;
  }

  override ngOnInit(): void {
    // Lazy table's onLazyLoad handles the initial fetch — do nothing here
  }

  protected loadItems(): void {
    const query: QueryNovedadDto = {
      page: this.page + 1,
      limit: this.limit,
    };

    if (this.filterTipo) query.tipo = this.filterTipo as NovedadTipo;
    if (this.filterEstado) query.estado = this.filterEstado as NovedadEstado;
    if (this.filterFecha && this.filterFecha.length === 2) {
      query.fechaDesde = this.filterFecha[0].toISOString();
      query.fechaHasta = this.filterFecha[1].toISOString();
    }

    this.loadingService.show();
    this.loading = true;
    this.novedadService.getAll(query)
    .pipe(finalize(() => {
      this.loading = false;
      this.loadingService.hide();
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res: PaginatedNovedadResponse) => {
        this.novedades = res.data;
        this.total = res.total;
      },
      error: () => {
        this.showError('No se pudieron cargar las novedades');
      },
    });
  }

  onTablePage(event: any): void {
    this.page = Math.floor((event.first ?? 0) / (event.rows ?? this.limit));
    this.limit = event.rows ?? this.limit;
    this.loadItems();
  }

  applyFilters(): void {
    this.page = 0;
    this.loadItems();
  }

  clearFilters(): void {
    this.filterTipo = '';
    this.filterEstado = '';
    this.filterFecha = undefined;
    this.page = 0;
    this.loadItems();
  }

  onClearFecha(): void {
    this.filterFecha = undefined;
  }

  archiveNovedad(novedad: Novedad): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro que querés archivar la novedad "${novedad.titulo}"?`,
      header: 'Confirmar archivado',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, archivar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.novedadService.archive(novedad.id).subscribe({
          next: () => {
            this.afterChange('Novedad archivada correctamente');
          },
          error: () => {
            this.showError('No se pudo archivar la novedad');
          },
        });
      },
    });
  }

  nuevaNovedad(): void {
    const data = { item: null, modo: 'A' };
    this.ref = this.dialogService.open(NovedadCreateModal, {
      ...modalConfig,
      width: '60%',
      header: 'Crear Novedad',
      data,
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (result) {
        setTimeout(() => this.applyFilters());
      }
    });
  }

  abrirUsuarioDrawer(usuarioId: string | null | undefined): void {
    if (usuarioId) {
      this.drawerService.abrirUsuarioDrawer(usuarioId);
    }
  }

  verNovedad(novedad: Novedad): void {
    this.dialogService.open(NovedadViewModal, {
      ...modalConfig,
      width: '50%',
      header: novedad.titulo,
      data: { novedad },
    });
  }

  // TrabajarCon abstract implementations
  alta(_item: Novedad): void {
    // Not used — creation is via modal
  }

  editar(_item: Novedad): void {
    // Not used — novedades cannot be edited
  }

  eliminarDirecto(item: Novedad): void {
    this.novedadService.archive(item.id).subscribe({
      next: () => this.afterChange('Novedad archivada correctamente'),
      error: () => this.showError('No se pudo archivar la novedad'),
    });
  }

  protected procesarExcel(_file: File): void {
    // Not applicable for novedades
  }

  protected descargarPlantilla(): void {
    // Not applicable for novedades
  }

  protected exportarExcelImpl(): void {
    // Not applicable for novedades
  }
}
