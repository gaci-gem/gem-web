import { FiltroActivo, FiltroActivoOptions, FiltroCerradoOptions } from '@/app/constants/filtros_activo';
import { SHORTCUTS } from '@/app/constants/shortcut';
import { PermisoAccion } from '@/app/types/permisos';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { Component, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectorRef } from '@angular/core';
import { PermisoClave } from '@core/interfaces/rol';
import { LoadingService } from '@core/services/loading.service';
import { PermisosService } from '@core/services/permisos';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { FiltroPreset, FiltroState, TablaFilterState } from '@core/interfaces/filtro-preset';
import { FiltroPresetService } from '@core/services/filtro-preset';
import { UserStorageService } from '@core/services/user-storage';
import { ShortcutService } from '@core/services/shortcut';
import { FiltroPresetsComponent } from '@app/components/filtro-presets/filtro-presets';

export type CrudViewAction<T> = (item: T) => void;

@Component({
  selector: 'app-trabajar-con',
  imports: [],
  templateUrl: './trabajar-con.html',
  styleUrl: './trabajar-con.scss'
})
export abstract class TrabajarCon<T> {
  @ViewChild(FiltroPresetsComponent) private presetsComponent?: FiltroPresetsComponent;
  protected permisosService = inject(PermisosService);
  protected permisoClave!: PermisoClave;
  protected loadingService = inject(LoadingService);
  actionInProgress = false;
  private readonly filtroPresetService = inject(FiltroPresetService);
  private readonly sessionUserStorage = inject(UserStorageService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);
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
  readonly presets = signal<FiltroPreset[]>([]);
  selectedPresetId = '';
  abstract readonly pantalla: string;

  constructor(
    protected cdr: ChangeDetectorRef,
    protected messageService: MessageService,
    protected confirmationService: ConfirmationService
  ) {
    this.shortcutService.onShortcut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(combo => {
        if (!this.isVisible(this.host.nativeElement) || this.hasActiveDialog()) return;
        if (this.matchesShortcut(combo, SHORTCUTS.REFRESCAR)) this.loadItems();
        if (combo === SHORTCUTS.EXPORTAR.combo) this.exportarExcel();
        if (combo === SHORTCUTS.LIMPIAR_FILTROS.combo) this.clickExistingControl('button[title*="Limpiar" i], button[aria-label*="Limpiar" i]');
        if (this.matchesShortcut(combo, SHORTCUTS.PRESETS)) this.applyDefaultPresetOrOpenMenu();
        if (combo === SHORTCUTS.BUSCAR.combo) this.focusSearchInput();
      });
  }

  ngOnInit(): void {
    const restored = this.restoreFilterSession();
    if (restored) this.restoreFilterState(restored);
    this.loadPresets();
    this.loadItems();
  }

  protected captureFilterState(): FiltroState {
    return { filtroActivo: this.filtroActivo, globalFilter: this.searchValue() };
  }

  protected restoreFilterState(state: FiltroState): void {
    if (typeof state['filtroActivo'] === 'string') this.filtroActivo = state['filtroActivo'] as FiltroActivo;
    if (typeof state['globalFilter'] === 'string') this.searchValue.set(state['globalFilter'] as string);
  }

  protected clearFilterState(): void {
    this.searchValue.set('');
    this.filtroActivo = this.defaultFiltroActivo();
  }

  protected defaultFiltroActivo(): FiltroActivo {
    return FiltroActivo.TRUE;
  }

  protected captureTableState(table?: Table): TablaFilterState {
    const columnFilters = Object.entries(table?.filters ?? {}).reduce(
      (result, [field, value]: [string, any]) => {
        const filter = Array.isArray(value) ? value[0] : value;
        if (filter?.value !== null && filter?.value !== undefined && filter.value !== '') {
          result[field] = { value: String(filter.value), matchMode: filter.matchMode || 'contains' };
        }
        return result;
      },
      {} as TablaFilterState['columnFilters'],
    );

    return {
      globalFilter: this.searchValue(),
      columnFilters,
      sortField: table?.sortField ?? null,
      sortOrder: (table?.sortOrder as 1 | -1 | 0) || 0,
      first: table?.first ?? 0,
      rows: table?.rows ?? 10,
    };
  }

  protected restoreTableState(state: FiltroState, table?: Table): void {
    if (!table) return;
    const tableState = state as Partial<TablaFilterState>;
    table.clear();
    if (tableState.globalFilter) table.filterGlobal(tableState.globalFilter, 'contains');
    Object.entries(tableState.columnFilters ?? {}).forEach(([field, filter]) => {
      table.filter(filter.value, field, filter.matchMode);
    });
    if (typeof tableState.first === 'number') table.first = tableState.first;
    if (typeof tableState.rows === 'number') table.rows = tableState.rows;
    if (tableState.sortField) {
      table.sortField = tableState.sortField;
      table.sortOrder = tableState.sortOrder ?? 1;
      table.sortSingle();
    }
  }

  loadPresets(): void {
    this.filtroPresetService.list(this.pantalla).subscribe({ next: presets => this.presets.set(presets) });
  }

  savePreset(name: string): void {
    const filtros = this.captureFilterState();
    const request = this.selectedPresetId
      ? this.filtroPresetService.update(this.pantalla, this.selectedPresetId, name, filtros)
      : this.filtroPresetService.create(this.pantalla, name, filtros);
    request.subscribe({
      next: preset => {
        this.selectedPresetId = preset.id;
        this.presets.update(items => {
          const index = items.findIndex(item => item.id === preset.id);
          if (index < 0) return [...items, preset].sort((a, b) => Number(b.esDefault) - Number(a.esDefault) || a.nombre.localeCompare(b.nombre));
          const next = [...items];
          next[index] = preset;
          return next;
        });
        this.showSuccess('Preset guardado correctamente.');
      },
      error: err => this.showError(err?.error?.message || 'No se pudo guardar el preset.')
    });
  }

  applyPreset(id: string): void {
    const preset = this.presets().find(item => item.id === id);
    if (!preset) return;
    this.selectedPresetId = id;
    this.restoreFilterState(preset.filtros);
    this.saveFilterSession();
    this.loadItems();
  }

  removePreset(id: string): void {
    this.filtroPresetService.remove(this.pantalla, id).subscribe({
      next: () => {
        this.presets.update(items => items.filter(item => item.id !== id));
        if (this.selectedPresetId === id) this.selectedPresetId = '';
        this.showSuccess('Preset eliminado correctamente.');
      },
      error: err => this.showError(err?.error?.message || 'No se pudo eliminar el preset.')
    });
  }

  setPresetDefault(id: string): void {
    this.filtroPresetService.setDefault(this.pantalla, id).subscribe({
      next: preset => this.presets.update(items => items.map(item => ({ ...item, esDefault: item.id === preset.id }))),
      error: err => this.showError(err?.error?.message || 'No se pudo marcar el preset.')
    });
  }

  protected sessionKey(): string {
    const userId = this.sessionUserStorage.getUsuario()?.id ?? 'anonymous';
    return `gem:${userId}:${this.pantalla}:filters:v1`;
  }

  protected saveFilterSession(): void {
    try { sessionStorage.setItem(this.sessionKey(), JSON.stringify(this.captureFilterState())); } catch { /* storage may be unavailable */ }
  }

  protected restoreFilterSession(): FiltroState | null {
    try {
      const raw = sessionStorage.getItem(this.sessionKey());
      return raw ? JSON.parse(raw) as FiltroState : null;
    } catch { return null; }
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

  private hasActiveDialog(): boolean {
    return Array.from(document.querySelectorAll<HTMLElement>('.p-dialog-mask, .p-confirmdialog'))
      .some(element => this.isVisible(element));
  }

  private focusSearchInput(): void {
    const host = this.host.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>([
      'input[type="search"]',
      'input[role="searchbox"]',
      'input[aria-label*="buscar" i]',
      'input[aria-label*="search" i]',
      'input[aria-label*="filtrar" i]',
      'input[aria-label*="filter" i]',
      'input[placeholder*="buscar" i]',
      'input[placeholder*="search" i]',
      'input[placeholder*="filtrar" i]',
      'input[placeholder*="filter" i]',
    ].join(', '));
    if (!input) return;
    input.focus();
    input.select();
  }

  private openPresetMenu(): void {
    this.presetsComponent?.openMenu();
  }

  private applyDefaultPresetOrOpenMenu(): void {
    const defaultPreset = this.presets().find(preset => preset.esDefault);
    if (defaultPreset) {
      this.applyPreset(defaultPreset.id);
      return;
    }
    this.openPresetMenu();
  }

  private clickExistingControl(selector: string): void {
    const host = this.host.nativeElement as HTMLElement;
    const control = host.querySelector<HTMLElement>(selector);
    control?.click();
  }

  private matchesShortcut(combo: string, shortcut: { combo: string; combos?: readonly string[] }): boolean {
    return shortcut.combos?.includes(combo) ?? shortcut.combo === combo;
  }

  private isVisible(element: HTMLElement): boolean {
    if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

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

  protected beginAction(): boolean {
    if (this.actionInProgress) return false;
    this.actionInProgress = true;
    return true;
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
    table.sortField = null;
    table.sortOrder = 0;
    table.first = 0;
    this.searchValue.set('');
    this.clearFilterState();
    this.saveFilterSession();
    this.loadItems();
  }
}


