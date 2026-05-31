import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { DrawerService } from '@core/services/drawer.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EventoDrawerComponent } from '@views/evento/evento-drawer/evento-drawer';
import { UsuarioDrawerComponent } from '@views/usuario/usuario-drawer/usuario-drawer';

@Component({
  selector: 'app-drawer-container',
  templateUrl: './drawer-container.html',
  standalone: true,
  imports: [
    EventoDrawerComponent,
    UsuarioDrawerComponent
  ]
})
export class DrawerContainerComponent implements OnInit, OnDestroy {

  private crf = inject(ChangeDetectorRef);

  showEventoDrawer = false;
  eventoSeleccionadoId: string | null = null;
  eventoSeleccionadoTargetId: string | null = null;

  showUsuarioDrawer = false;
  usuarioSeleccionadoId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private drawerService: DrawerService) { }

  ngOnInit(): void {
    this.drawerService.eventoDrawer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.showEventoDrawer = state.visible;
        this.eventoSeleccionadoId = state.id;
        this.eventoSeleccionadoTargetId = state.targetId || null;
        this.crf.detectChanges();
      });

    this.drawerService.usuarioDrawer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.showUsuarioDrawer = state.visible;
        this.usuarioSeleccionadoId = state.id;
        this.crf.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cerrarEventoDrawer(): void {
    this.drawerService.cerrarEventoDrawer();
  }

  cerrarUsuarioDrawer(): void {
    this.drawerService.cerrarUsuarioDrawer();
  }
}
