import { FiltroActivo, FiltroActivoOptions, FiltroCerradoOptions } from '@/app/constants/filtros_activo';
import { SHORTCUTS } from '@/app/constants/shortcut';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { Component, inject, signal } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { PermisoClave } from '@core/interfaces/rol';
import { LoadingService } from '@core/services/loading.service';
import { PermisosService } from '@core/services/permisos';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';

export type CrudViewAction<T> = (item: T) => void;

@Component({
  selector: 'app-trabajar-con',
  imports: [],
  templateUrl: './trabajar-con.html',
  styleUrl: './trabajar-con.scss'
})
export abstract class TrabajarCon<T> {
  protected permisosService = inject(PermisosService);
  protected permisoClave!: PermisoClave;
  protected loadingService = inject(LoadingService);
  protected permisos: PermisoAccion[] = [];
  readonly SHORTCUTS = SHORTCUTS;
  readonly PermisoAccion = PermisoAccion;
  readonly FiltroActivo = FiltroActivo;
  FiltroActivoOptions = FiltroActivoOptions;
  FiltroCerradoOptions = FiltroCerradoOptions;

  /** Optional read-only action supplied by screens that expose entity viewing. */
  protected viewAction?: CrudViewAction<T>;

  filtroActivo: FiltroActivo = FiltroActivo.TRUE;
  searchValue = signal('');

  constructor(
    protected cdr: ChangeDetectorRef,
    protected messageService: MessageService,
    protected confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  protected abstract loadItems(): void;
  abstract alta(item: T): void;
  abstract editar(item: T): void;
  abstract eliminarDirecto(item: T): void;

  view(item: T): void {
    this.viewAction?.(item);
  }

  exportarExcel(): void {
    this.exportarExcelImpl();
  }

  importarExcel(event:any): void {
    console.log(event);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = ''; // permitir re-subida del mismo archivo
    this.procesarExcel(file);
  }

  getPlantilla(): void {
    this.descargarPlantilla();
  }



  // métodos que deben implementar las pantallas concretas
  protected abstract procesarExcel(file: File): void;
  protected abstract descargarPlantilla(): void;
  protected abstract exportarExcelImpl(): void;
  // ------------------------------------------------------------------

  delete(item: T, label: string = 'el registro'): void {
    this.confirmationService.confirm({
      message: `¿Seguro que querés eliminar ${label}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.eliminarDirecto(item);
      }
    });
  }

  protected afterChange(mensaje: string = 'Cambios guardados correctamente.'): void {
    this.loadItems();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje
    });
  }

  protected showError(mensaje: string = 'Ocurrió un error inesperado.'): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje
    });
  }

  protected showSuccess(mensaje: string = 'Ocurrió un error inesperado.'): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje
    });
  }

  can(accion: PermisoAccion): boolean {
    return this.permisosService.can(buildPermiso(this.permisoClave, accion));
  }

  getEventValue($event:any) :string {
    return $event.target.value;
  } 
  
  filtroCambio(event:any) {
    const selectedValue = event as FiltroActivo;
    this.filtroActivo = selectedValue;
    this.loadItems();
  }
  clear(table: Table) {
    table.clear();
    this.searchValue.set('');
  }
}


