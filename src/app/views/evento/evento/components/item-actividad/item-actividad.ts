import {
  ACCIONES,
  ACCIONES_NO_MOSTRAR,
} from '@/app/constants/actividad_acciones';
import { Component, inject, Input } from '@angular/core';
import { VidaEvento } from '@core/interfaces/evento';
import { NgIcon } from '@ng-icons/core';
import {
  getIconNameAccion,
  getTitleAccion,
  getDescripcionAccion,
} from '@/app/constants/actividad_acciones';
import { ComentarioTextoComponent } from '../comentario-texto/comentario-texto';
import { DrawerService } from '@core/services/drawer.service';
import { TimeAgoComponent } from '@app/components/time-ago/time-ago';

@Component({
  selector: 'app-item-actividad',
  standalone: true,
  imports: [NgIcon, ComentarioTextoComponent, TimeAgoComponent],
  templateUrl: './item-actividad.html',
  styleUrl: './item-actividad.scss',
})
export class ItemActividadComponent {
  @Input() actividad!: VidaEvento;
  @Input() last: boolean = false;
  ACCIONES = ACCIONES;
  ACCIONES_NO_MOSTRAR = ACCIONES_NO_MOSTRAR;

  private drawerService = inject(DrawerService);

  getIconNameAccion() {
    return getIconNameAccion(this.actividad.accion);
  }
  getTitleAccion() {
    return getTitleAccion(this.actividad);
  }
  getDescripcionAccion() {
    return getDescripcionAccion(this.actividad);
  }
  abrirUsuarioDrawer(usuarioId: string) {
    this.drawerService.abrirUsuarioDrawer(usuarioId);
  }
}
