import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { NgIcon } from '@ng-icons/core';
import { CatalogoService } from '@core/services/catalogo';
import { Catalogo } from '@core/interfaces/catalogo';
import { CatalogoFiltroItemConfig, CatalogoFiltroState } from '@core/interfaces/catalogo-filter';
import { finalize } from 'rxjs';

/**
 * Componente genérico para filtros de catálogo
 * Permite filtrar por múltiples catálogos de forma reutilizable
 * 
 * @example Uso básico en KB
 * ```html
 * <app-catalogo-filtros
 *   [filtrosConfig]="filtrosKbConfig"
 *   (onFiltrosChange)="aplicarFiltros($event)"
 *   (onLimpiar)="limpiarFiltros()"
 * ></app-catalogo-filtros>
 * ```
 * 
 * @example Configuración en el componente
 * ```typescript
 * filtrosKbConfig: CatalogoFiltroItemConfig[] = [
 *   {
 *     paramName: 'plataforma',
 *     tipoCatalogo: 'KB_PLATAFORMA',
 *     label: 'Plataforma',
 *     placeholder: 'Seleccione plataformas',
 *     multiple: true
 *   },
 *   {
 *     paramName: 'estado',
 *     tipoCatalogo: 'KB_ESTADO',
 *     label: 'Estado',
 *     placeholder: 'Seleccione estado',
 *     multiple: false
 *   }
 * ];
 * 
 * aplicarFiltros(filtros: CatalogoFiltroState) {
 *   const params = buildCatalogoParams(filtros, CATALOGO_FILTROS_CONFIG.KB);
 *   // Hacer la búsqueda con params
 * }
 * ```
 */
@Component({
  selector: 'app-catalogo-filtros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    SelectModule,
    ButtonModule
  ],
  template: `
    <div class="catalogo-filtros">
      <div class="filtros-grid">
        @for (filtro of filtrosConfig; track filtro.paramName) {
          <div class="filtro-item">
            <label [for]="'filtro-' + filtro.paramName">{{ filtro.label }}</label>
            
            @if (filtro.multiple) {
              <p-multiselect
                [id]="'filtro-' + filtro.paramName"
                [options]="catalogosMap[filtro.paramName] || []"
                [(ngModel)]="filtrosState[filtro.paramName]"
                [optionLabel]="'codigo'"
                [optionValue]="'codigo'"
                [placeholder]="filtro.placeholder || 'Seleccionar'"
                [filter]="true"
                [showClear]="true"
                (onChange)="onFiltroChange()"
                [loading]="loadingMap[filtro.paramName]"
                [disabled]="loadingMap[filtro.paramName]"
                styleClass="w-full"
              >
                <ng-template let-value pTemplate="selectedItems">
                  @if (value && value.length > 0) {
                    <div class="selected-items">
                      {{ value.length }} seleccionado(s)
                    </div>
                  } @else {
                    <span>{{ filtro.placeholder || 'Seleccionar' }}</span>
                  }
                </ng-template>
              </p-multiselect>
            } @else {
              <p-select
                [id]="'filtro-' + filtro.paramName"
                [options]="catalogosMap[filtro.paramName] || []"
                [(ngModel)]="filtrosState[filtro.paramName][0]"
                [optionLabel]="'codigo'"
                [optionValue]="'codigo'"
                [placeholder]="filtro.placeholder || 'Seleccionar'"
                [filter]="true"
                [showClear]="true"
                (onChange)="onFiltroSingleChange(filtro.paramName, $event.value)"
                [loading]="loadingMap[filtro.paramName]"
                [disabled]="loadingMap[filtro.paramName]"
                styleClass="w-full"
              />
            }
          </div>
        }
      </div>

      <div class="filtros-acciones">
        <button 
          pButton 
          type="button"
          label="Limpiar filtros"
          icon="pi pi-filter-slash"
          (click)="limpiarFiltros()"
          [disabled]="!hayFiltrosActivos()"
          severity="secondary"
          outlined
        ></button>
        
        <button 
          pButton 
          type="button"
          label="Aplicar"
          icon="pi pi-check"
          (click)="aplicarFiltros()"
          [disabled]="!hayFiltrosActivos()"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .catalogo-filtros {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
    }

    .filtros-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .filtro-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filtro-item label {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-color);
    }

    .filtros-acciones {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .selected-items {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .filtros-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CatalogoFiltrosComponent implements OnInit, AfterViewInit {
  private catalogoService = inject(CatalogoService);
  private cdRef = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  /**
   * Configuración de los filtros a mostrar
   */
  @Input() filtrosConfig: CatalogoFiltroItemConfig[] = [];

  /**
   * Estado inicial de los filtros (opcional)
   */
  @Input() initialState?: CatalogoFiltroState;

  /**
   * Si se aplican automáticamente al cambiar (sin botón "Aplicar")
   */
  @Input() autoApply: boolean = false;

  /**
   * Evento emitido cuando cambian los filtros
   */
  @Output() onFiltrosChange = new EventEmitter<CatalogoFiltroState>();

  /**
   * Evento emitido cuando se limpian los filtros
   */
  @Output() onLimpiar = new EventEmitter<void>();

  /**
   * Estado actual de los filtros
   */
  filtrosState: CatalogoFiltroState = {};

  /**
   * Mapa de catálogos cargados por paramName
   */
  catalogosMap: Record<string, Catalogo[]> = {};

  /**
   * Mapa de estados de carga por paramName
   */
  loadingMap: Record<string, boolean> = {};

  ngOnInit(): void {
    this.inicializarEstado();
  }

  ngAfterViewInit(): void {
    // ejecutar la carga de catálogos después del primer chequeo de cambios
    setTimeout(() => this.cargarTodosCatalogos(), 0);
  }

  /**
   * Inicializa el estado de los filtros
   */
  private inicializarEstado(): void {
    this.filtrosConfig.forEach(filtro => {
      // Si hay estado inicial, usarlo
      if (this.initialState && this.initialState[filtro.paramName]) {
        this.filtrosState[filtro.paramName] = [...this.initialState[filtro.paramName]];
      } else {
        this.filtrosState[filtro.paramName] = [];
      }
      this.loadingMap[filtro.paramName] = false;
    });
  }

  /**
   * Carga todos los catálogos definidos en la configuración
   */
  private cargarTodosCatalogos(): void {
    this.filtrosConfig.forEach(filtro => {
      this.cargarCatalogo(filtro);
    });
  }

  /**
   * Carga un catálogo específico
   */
  private cargarCatalogo(filtro: CatalogoFiltroItemConfig): void {
    // actualizar estados dentro de NgZone y forzar detección inmediatamente después
    this.zone.run(() => {
      this.loadingMap[filtro.paramName] = true;
      this.cdRef.detectChanges();
    });

    this.catalogoService.findByTipo(filtro.tipoCatalogo, true)
      .pipe(finalize(() => {
        this.zone.run(() => {
          this.loadingMap[filtro.paramName] = false;
          this.cdRef.detectChanges();
        });
      }))
      .subscribe({
        next: (catalogos) => {
          this.zone.run(() => {
            this.catalogosMap[filtro.paramName] = catalogos;
            this.cdRef.detectChanges();
          });
        },
        error: (error) => {
          console.error(`Error al cargar catálogo ${filtro.tipoCatalogo}:`, error);
          this.zone.run(() => {
            this.catalogosMap[filtro.paramName] = [];
            this.cdRef.detectChanges();
          });
        }
      });
  }

  /**
   * Maneja el cambio de un filtro (para autoApply)
   */
  onFiltroChange(): void {
    if (this.autoApply) {
      this.aplicarFiltros();
    }
  }

  /**
   * Maneja el cambio de un filtro simple (no múltiple)
   */
  onFiltroSingleChange(paramName: string, value: string | null): void {
    if (value) {
      this.filtrosState[paramName] = [value];
    } else {
      this.filtrosState[paramName] = [];
    }
    
    if (this.autoApply) {
      this.aplicarFiltros();
    }
  }

  /**
   * Aplica los filtros actuales
   */
  aplicarFiltros(): void {
    // Filtrar solo los que tienen valores
    const filtrosActivos = Object.entries(this.filtrosState)
      .filter(([_, valores]) => valores && valores.length > 0)
      .reduce((acc, [key, valores]) => {
        acc[key] = valores;
        return acc;
      }, {} as CatalogoFiltroState);

    this.onFiltrosChange.emit(filtrosActivos);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    Object.keys(this.filtrosState).forEach(key => {
      this.filtrosState[key] = [];
    });
    
    this.onLimpiar.emit();
    
    if (this.autoApply) {
      this.onFiltrosChange.emit({});
    }
  }

  /**
   * Verifica si hay filtros activos
   */
  hayFiltrosActivos(): boolean {
    return Object.values(this.filtrosState).some(valores => valores && valores.length > 0);
  }

  /**
   * Obtiene el estado actual de los filtros
   */
  getEstadoFiltros(): CatalogoFiltroState {
    return { ...this.filtrosState };
  }

  /**
   * Establece el estado de los filtros externamente
   */
  setEstadoFiltros(estado: CatalogoFiltroState): void {
    this.filtrosState = { ...estado };
    
    if (this.autoApply) {
      this.aplicarFiltros();
    }
  }
}
