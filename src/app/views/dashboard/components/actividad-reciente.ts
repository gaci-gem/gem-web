import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'
import { UiCard } from '@app/components/ui-card'
import { DashboardService } from '@core/services/dashboard';
import { NgIcon } from '@ng-icons/core'
import { finalize } from 'rxjs';
import { ActividadReciente as AR } from '@core/interfaces/dashboard'
import { ACCIONES } from '@/app/constants/actividad_acciones';
import { CommonModule } from '@angular/common';
import { TimeAgoComponent } from '@app/components/time-ago/time-ago';
import { DrawerService } from '@core/services/drawer.service';


// (reload)="reload.emit()"
@Component({
  selector: 'app-actividad-reciente',
  standalone: true,
  imports: [
    NgIcon,
    UiCard,
    CommonModule,
    TimeAgoComponent,
  ],
  template: `
    <app-ui-card
      title="Actividad reciente"
      [isReloadable]="true"
      [reloading]="loading"
    >
      <div card-body>
        <ul class="list-unstyled mb-0">

          @for (ar of actividad ; track ar.id) {
            <li class="d-flex align-items-center mb-3">
              <ng-icon [name]="getIconoAccion(ar.accion).nombre" class="me-2" [ngClass]="getIconoAccion(ar.accion).colorClase" style="width: 24px;height: 24px;"/>
              <div>
                <div class="fw-semibold" (click)="navegarAEvento(ar.evento.id)" style="cursor: pointer;">{{ getTituloAccion(ar.accion, ar.evento) }}</div>
                <small class="text-muted">{{ar.evento.cliente.nombre}} · <app-time-ago [fecha]="ar.fecha" /></small>
              </div>
            </li>
          }

        </ul>
      </div>
    </app-ui-card>
  `,
})
export class ActividadReciente implements OnInit{
  // @Input() loading = false
  // @Output() reload = new EventEmitter<void>()

  private dashboardService = inject(DashboardService);
  private drawerService = inject(DrawerService);
  private cdr = inject(ChangeDetectorRef);

  actividad: AR[] = [];
  loading = false;

  ngOnInit(): void {
    this.reloadActividad(); 
  }

  reloadActividad() {
    this.loading = true
    this.dashboardService.getActividadReciente()
    .pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (data) => {
        this.actividad = data;
      },
      error: (error) => {
        console.error('Error al cargar la actividad reciente:', error);
      }
    });
  }

  navegarAEvento(eventoId: string) {
    console.log(eventoId)
    if (eventoId) {
      this.drawerService.abrirEventoDrawer(eventoId);
    }
  }

  getTituloAccion(accion: string, evento:any): string {

    let titulo = accion;

    switch (accion) {
      case ACCIONES.CREO:
        titulo = 'Evento creado | !evento!';
        break;
      case ACCIONES.COMPLETADO:
        titulo = 'Evento finalizado | !evento!';
        break;
      case ACCIONES.RECHAZO:
        titulo = 'Evento rechazado | !evento!';
        break;
      default:
        titulo = 'Acción desconocida';
    }
    return titulo.replaceAll('!evento!', `${evento.eventoSearch}`);
  }
  getIconoAccion(accion: string): { nombre: string; colorClase: string } {
    switch (accion) {
      case ACCIONES.CREO:
        return { nombre: 'lucideCirclePlus', colorClase: 'text-success' };
      case ACCIONES.COMPLETADO:
        return { nombre: 'lucideCircleCheck', colorClase: 'text-info' };
      case ACCIONES.RECHAZO:
        return { nombre: 'lucideCircleX', colorClase: 'text-danger' };
      default:
        return { nombre: 'lucideAlertCircle', colorClase: 'text-secondary' };
    }
  }

}
