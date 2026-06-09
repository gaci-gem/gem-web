import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPopover,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgIcon } from '@ng-icons/core';
import {
  EstadosNotificacion,
  NotificacionService,
} from '@core/services/notificacion';
import {
  UserStorageService,
  UsuarioLogeado,
} from '@core/services/user-storage';
import { showError } from '@/app/utils/message-utils';
import { MessageService } from 'primeng/api';
import { Notificacion } from '@core/interfaces/notificacion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getIconNameAccion } from '@/app/constants/actividad_acciones';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { DrawerService } from '@core/services/drawer.service';
import { SseService } from '@core/services/sse.service';
import { TimeAgoComponent } from '@app/components/time-ago/time-ago';
import { DialogService } from 'primeng/dynamicdialog';
import { NovedadService } from '@core/services/novedad';
import { NovedadViewModal } from '@views/novedad/components/novedad-view-modal';
import { modalConfig } from '@/app/types/modals';

@Component({
  selector: 'app-notification-dropdown',
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    SimplebarAngularModule,
    NgbDropdownMenu,
    NgIcon,
    CommonModule,
    FormsModule,
    NgbPopover,
    TimeAgoComponent,
  ],
  providers: [DialogService],
  templateUrl: './notification-dropdown.html',
  styleUrls: ['./notificacion-dropdown.scss'],
})
export class NotificationDropdown implements OnInit {
  private sseService = inject(SseService);
  private notificacionService = inject(NotificacionService);
  private userStorageService = inject(UserStorageService);
  private messageService = inject(MessageService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  private drawerService = inject(DrawerService);
  private dialogService = inject(DialogService);
  private novedadService = inject(NovedadService);

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();
  notifications: Notificacion[] = [];

  verSoloNoLeidas = false;

  getIconNameAccion = getIconNameAccion;

  constructor() {
    effect(() => {
      const sseNotifs = this.sseService.notifications();
      if (sseNotifs.length === 0) return;

      let changed = false;
      const existingIds = new Set(this.notifications.map((n) => n.id));
      for (const notif of sseNotifs) {
        if (notif.id !== undefined && !existingIds.has(notif.id)) {
          this.notifications.unshift(notif);
          existingIds.add(notif.id);
          changed = true;
        }
      }
      if (changed) {
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.sseService.connect();
  }

  loadNotifications(): void {
    let filtro = this.verSoloNoLeidas
      ? EstadosNotificacion.NoLeidas
      : EstadosNotificacion.Todas;

    this.notificacionService
      .getByUsuario(this.usuarioActivo?.id || '', 10, filtro)
      .subscribe({
        next: (data) => {
          const sseNotifs = this.sseService.notifications();
          const apiIds = new Set(data.map((n) => n.id));
          const sseToMerge = sseNotifs.filter(
            (n) => n.id !== undefined && !apiIds.has(n.id),
          );
          this.notifications = [...sseToMerge, ...data].slice(0, 50);
          this.cdr.detectChanges();
        },
        error: (error) => {
          showError(
            this.messageService,
            'Error',
            'No se pudieron cargar las notificaciones',
          );
          console.error('Error loading notifications:', error);
        },
      });
  }

  toggleLida(notificacion: Notificacion) {
    this.notificacionService
      .toggleLeida(notificacion.id?.toString() || '')
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (error) => {
          showError(
            this.messageService,
            'Error',
            'No se pudo cambiar el estado de la notificación',
          );
          console.error('Error toggling notification read status:', error);
        },
      });
  }

  getCantidadNoLeidas(): number {
    return this.notifications.filter((n) => !n.leida).length;
  }

  markAllAsRead() {
    this.notifications.forEach((notification) => {
      if (!notification.leida) {
        this.toggleLida(notification);
      }
    });
  }

  onToggleNoLeidas(event: Event) {
    setTimeout(() => {
      this.verSoloNoLeidas = (event.target as HTMLInputElement).checked;
      this.loadNotifications();
    });
  }

  navigateToTarget(notificacion: Notificacion) {
    // console.log(notificacion);
    if (!notificacion.targetType || !notificacion.targetId) {
      return;
    }

    if (!notificacion.leida) {
      this.toggleLida(notificacion);
    }

    switch (notificacion.targetType) {
      case 'EVENTO':
        // this.router.navigate(['/evento/evento', notificacion.targetId]);

        if (notificacion.targetId) {
          this.drawerService.abrirEventoDrawer(notificacion.targetId);
        }
        break;
      case 'EVENTO_ADICION':
        if (notificacion.payload?.['eventoId'] && notificacion.targetId) {
          this.drawerService.abrirEventoDrawer(
            notificacion.payload['eventoId'],
            notificacion.targetId,
          );
        }
        break;
      case 'NOTA':
        this.drawerService.abrirNotaDrawer(notificacion.targetId);
        break;
      case 'NOVEDAD':
        if (notificacion.targetId) {
          const id = Number(notificacion.targetId);
          if (!isNaN(id)) {
            this.novedadService.getById(id).subscribe({
              next: (novedad) => {
                this.dialogService.open(NovedadViewModal, {
                  ...modalConfig,
                  width: '50%',
                  data: { novedad },
                });
              },
            });
          }
        }
        break;
    }
  }

  onCheckmarkHover(event: MouseEvent, leida: boolean) {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.style.backgroundColor = leida
        ? 'rgba(34, 197, 94, 0.2)'
        : 'rgba(156, 163, 175, 0.1)';
    }
  }

  onCheckmarkLeave(event: MouseEvent, leida: boolean) {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.style.backgroundColor = leida
        ? 'rgba(34, 197, 94, 0.1)'
        : 'transparent';
    }
  }
}
