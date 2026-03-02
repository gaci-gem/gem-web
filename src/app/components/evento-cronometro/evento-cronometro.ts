import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeClickComponent } from '@app/components/badge-click';
import { EventoCompleto } from '@core/interfaces/evento';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { NgIcon } from '@ng-icons/core';
import { EventoAccionesService } from '@core/services/evento-acciones';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TextareaModule } from 'primeng/textarea';
import { EventoDrawerComponent } from '@/app/views/evento/evento-drawer/evento-drawer';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { EventoTrabajoService } from '@core/services/evento-trabajo.service';

@Component({
  selector: 'app-evento-cronometro',
  imports: [
    CommonModule,
    FormsModule,
    BadgeClickComponent,
    NgIcon,
    PadZeroPipe,
    ToastModule,
    DrawerModule,
    DialogModule,
    ButtonModule,
    SplitButtonModule,
    TextareaModule,
    EventoDrawerComponent
  ],
  providers: [
    MessageService
  ],
  template: `
    <p-toast></p-toast>
    @if (eventoEnTrabajo) {
      <div class="evento-banner">
        <div class="banner-content">
          <!-- Contenido completo para desktop -->
          @if (!isMobile) {
            <div class="d-flex align-items-center justify-content-between w-100">
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center gap-2">
                  <ng-icon name="lucideTimer" class="text-warning"></ng-icon>
                  <span class="fw-bold text-dark">Trabajando en:</span>
                </div>
                <app-badge-click 
                  [backgroundColor]="eventoEnTrabajo.tipo.color"
                  (click)="abrirEventoDrawer()"
                  style="cursor:pointer"
                >
                  {{ eventoEnTrabajo.tipo.codigo }}-{{eventoEnTrabajo.numero | padZero:3}}
                </app-badge-click>
                <span class="fw-bold text-dark evento-title">{{ eventoEnTrabajo.titulo }}</span>
                @if (eventoEnTrabajo.etapaActualData) {
                  <span class="text-muted">{{ eventoEnTrabajo.etapaActualData.nombre }}</span>
                }
              </div>
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-5 fw-bold text-warning font-monospace">{{ tiempoTranscurrido }}</span>
                </div>
                <p-splitButton 
                  label="{{ loading ? 'Liberando...' : 'Liberar' }}"
                  icon="pi pi-stop"
                  severity="danger"
                  size="small"
                  [disabled]="loading"
                  (onClick)="liberarEvento()"
                  [model]="menuItems"
                  styleClass="p-button-outlined">
                </p-splitButton>
              </div>
            </div>
          }
          
          <!-- Contenido para móvil (siempre compacto) -->
          @if (isMobile) {
            <div class="d-flex align-items-center justify-content-between w-100">
              <div class="d-flex align-items-center gap-2">
                <ng-icon name="lucideTimer" class="text-warning" size="16"></ng-icon>
                <app-badge-click 
                  [backgroundColor]="eventoEnTrabajo.tipo.color"
                  (click)="abrirEventoDrawer()"
                  style="cursor:pointer"
                  class="mobile-badge"
                >
                  {{ eventoEnTrabajo.tipo.codigo }}-{{eventoEnTrabajo.numero | padZero:3}}
                </app-badge-click>
                <span class="fw-bold text-warning font-monospace mobile-timer">{{ tiempoTranscurrido }}</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <p-splitButton 
                  icon="pi pi-stop"
                  severity="danger"
                  size="small"
                  [disabled]="loading"
                  (onClick)="liberarEvento()"
                  [model]="menuItems"
                  styleClass="p-button-outlined mobile-split-button">
                </p-splitButton>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Modal para detalle de liberación -->
    <p-dialog 
      header="Liberar con detalle" 
      [(visible)]="showDetalleModal" 
      [modal]="true" 
      [style]="{width: '450px'}"
      [closable]="!loading">
      <div class="p-fluid">
        <div class="field">
          <label for="detalle">Detalle de liberación:</label>
          <textarea 
            id="detalle"
            pTextarea 
            [(ngModel)]="detalleLiberacion"
            rows="4" 
            cols="30"
            placeholder="Ingrese el detalle de por qué se libera el evento..."
            [disabled]="loading">
          </textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button 
          label="Cancelar" 
          severity="secondary" 
          (onClick)="cancelarDetalleModal()"
          [disabled]="loading">
        </p-button>
        <p-button 
          label="{{ loading ? 'Liberando...' : 'Liberar' }}" 
          severity="danger" 
          (onClick)="confirmarLiberacionConDetalle()"
          [disabled]="loading || !detalleLiberacion.trim()">
        </p-button>
      </ng-template>
    </p-dialog>

    <!-- Drawer para mostrar el detalle del evento -->
    <app-evento-drawer
        [visible]="showEventoDrawer"
        [eventoId]="eventoSeleccionadoId"
        (closed)="cerrarEventoDrawer()"
    ></app-evento-drawer>
  `,
  styles: [`
    .evento-banner {
      background: linear-gradient(135deg, #fff8e1 0%, #f3e5f5 100%);
      border: 2px solid #ffc107;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      padding: 12px 20px;
      margin-bottom: 20px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .banner-content {
      max-width: 100%;
    }

    .mobile-badge {
      font-size: 0.75rem !important;
      padding: 0.2rem 0.4rem !important;
    }

    .mobile-timer {
      font-size: 0.9rem !important;
    }

    .evento-title {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .evento-banner {
        padding: 8px 15px;
        margin-bottom: 15px;
      }
      
      .banner-content .d-flex {
        gap: 8px !important;
      }

      .evento-title {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .evento-banner {
        padding: 6px 10px;
      }
    }

    ::ng-deep .mobile-split-button .p-splitbutton-defaultbutton {
      padding: 0.25rem 0.5rem !important;
    }

    ::ng-deep .mobile-split-button .p-splitbutton-menubutton {
      padding: 0.25rem 0.35rem !important;
    }

    ::ng-deep .p-splitbutton.p-button-outlined .p-splitbutton-defaultbutton {
      border-right: none;
    }
  `]
})
export class EventoCronometroComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private eventoAccionesService = inject(EventoAccionesService);
  private userStorageService = inject(UserStorageService);
  private messageService = inject(MessageService);
  private eventoTrabajoService = inject(EventoTrabajoService);

  @Input() autoVerificar: boolean = true;
  @Output() eventoLiberado = new EventEmitter<void>();

  eventoEnTrabajo: EventoCompleto | null = null;
  tiempoInicioTrabajo: Date | null = null;
  cronometroInterval: any = null;
  tiempoTranscurrido: string = '00:00:00';
  loading: boolean = false;

  // Estado para el drawer
  showEventoDrawer = false;
  eventoSeleccionadoId: string | null = null;

  // Nuevas propiedades para el modal de detalle
  showDetalleModal = false;
  detalleLiberacion = '';
  menuItems: any[] = [];

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  ngOnInit(): void {
    // Suscribirse a cambios en el evento en trabajo
    this.eventoTrabajoService.eventoEnTrabajo$.subscribe(evento => {
      this.eventoEnTrabajo = evento;
      this.cdr.detectChanges();
    });

    this.eventoTrabajoService.tiempoInicio$.subscribe(tiempo => {
      this.tiempoInicioTrabajo = tiempo;
      this.detenerCronometro();
      if (this.tiempoInicioTrabajo) {
        this.iniciarCronometro();
      } else {
        this.tiempoTranscurrido = '00:00:00';
      }
      this.cdr.detectChanges();
    });

    // Configurar elementos del menú
    this.menuItems = [
      {
        label: 'Liberar con detalle',
        icon: 'pi pi-file-edit',
        command: () => this.abrirModalDetalle()
      }
    ];

    if (this.autoVerificar) {
      this.verificarEventoEnTrabajo();
    }
  }

  ngOnDestroy(): void {
    this.detenerCronometro();
  }

  abrirEventoDrawer(): void {
    if (this.eventoEnTrabajo) {
      this.eventoSeleccionadoId = this.eventoEnTrabajo.id || null;
      this.showEventoDrawer = true;
      this.cdr.detectChanges();
    }
  }

  cerrarEventoDrawer(): void {
    this.showEventoDrawer = false;
    this.eventoSeleccionadoId = null;
    this.cdr.detectChanges();
  }

  abrirModalDetalle(): void {
    this.detalleLiberacion = '';
    this.showDetalleModal = true;
    this.cdr.detectChanges();
  }

  cancelarDetalleModal(): void {
    this.showDetalleModal = false;
    this.detalleLiberacion = '';
    this.cdr.detectChanges();
  }

  confirmarLiberacionConDetalle(): void {
    if (!this.detalleLiberacion.trim()) {
      return;
    }
    
    this.liberarEventoConDetalle(this.detalleLiberacion.trim());
  }

  liberarEvento(): void {
    if (!this.eventoEnTrabajo || this.loading) return;

    this.loading = true;
    this.eventoAccionesService.liberar(this.eventoEnTrabajo.id || '', 'Trabajo finalizado').subscribe({
      next: () => {
        const eventoAnterior = this.eventoEnTrabajo!.tipo.codigo + '-' + this.eventoEnTrabajo!.numero?.toString().padStart(3, '0');
        this.detenerCronometro();
        
        // Limpiar a través del servicio
        this.eventoTrabajoService.limpiarEvento();
        
        this.tiempoTranscurrido = '00:00:00';
        this.showSuccess(`Evento ${eventoAnterior} liberado.`);
        this.eventoLiberado.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.showError(err.error.message || 'Error al liberar el evento.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  liberarEventoConDetalle(detalle: string): void {
    if (!this.eventoEnTrabajo || this.loading) return;

    this.loading = true;
    this.eventoAccionesService.liberar(this.eventoEnTrabajo.id || '', detalle).subscribe({
      next: () => {
        const eventoAnterior = this.eventoEnTrabajo!.tipo.codigo + '-' + this.eventoEnTrabajo!.numero?.toString().padStart(3, '0');
        this.detenerCronometro();
        
        // Limpiar a través del servicio
        this.eventoTrabajoService.limpiarEvento();
        
        this.tiempoTranscurrido = '00:00:00';
        this.showSuccess(`Evento ${eventoAnterior} liberado.`);
        this.eventoLiberado.emit();
        this.showDetalleModal = false;
        this.detalleLiberacion = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.showError(err.error.message || 'Error al liberar el evento.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  setEventoEnTrabajo(evento: EventoCompleto | null, tiempoInicio?: Date): void {
    this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);
  }

  private verificarEventoEnTrabajo(): void {
    this.eventoAccionesService.obtenerEventoEnTrabajo(this.usuarioActivo?.id ?? '').subscribe({
      next: (evento: any) => {
        if (evento && evento.registroTiempo) {
          const tiempoInicio = this.resolverTiempoInicio(evento.registroTiempo.inicio);
          this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);
          return;
        }

        this.eventoTrabajoService.limpiarEvento();
      },
      error: () => {
        this.eventoTrabajoService.limpiarEvento();
      }
    });
  }

  private resolverTiempoInicio(inicio: string | Date): Date {
    if (typeof inicio === 'string' && /^1970-01-01T/.test(inicio)) {
      const match = inicio.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const ahora = new Date();
        const tiempoInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10)
        );

        if (tiempoInicio.getTime() > ahora.getTime()) {
          tiempoInicio.setDate(tiempoInicio.getDate() - 1);
        }

        return tiempoInicio;
      }
    }

    return parseIsoAsLocal(inicio);
  }

  private iniciarCronometro(): void {
    this.cronometroInterval = setInterval(() => {
      if (this.tiempoInicioTrabajo) {
        const ahora = new Date();
        const diferencia = ahora.getTime() - this.tiempoInicioTrabajo.getTime();
        this.tiempoTranscurrido = this.formatearTiempo(diferencia);
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  private detenerCronometro(): void {
    if (this.cronometroInterval) {
      clearInterval(this.cronometroInterval);
      this.cronometroInterval = null;
    }
  }

  private formatearTiempo(milisegundos: number): string {
    const segundosTotales = Math.floor(milisegundos / 1000);
    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
}
