import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectBase } from '@app/components/select-base/select-base';
import { LoadingSpinnerComponent } from '@app/components/index';
import { UsuarioService } from '@core/services/usuario';
import { Usuario } from '@core/interfaces/usuario';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { BadgeClickComponent } from '@app/components/badge-click';
import { DrawerService } from '@core/services/drawer.service';
@Component({ selector: 'app-usuario-select', templateUrl: './usuario-select.html', providers: [MessageService, ConfirmationService], imports: [CommonModule, LoadingSpinnerComponent, TableModule, InputTextModule, NgIcon, BadgeClickComponent] })
export class UsuarioSelect extends SelectBase<Usuario> {
  private readonly service = inject(UsuarioService); private readonly drawerService = inject(DrawerService); protected config = inject(DynamicDialogConfig); usuarios: Usuario[] = []; usuarioSeleccionado!: Usuario;
  constructor() { super(inject(ChangeDetectorRef), inject(MessageService), inject(ConfirmationService)); }
   loadItems() { this.loadingSelect = true; this.service.getAll(FiltroActivo.TRUE).pipe(finalize(() => { this.loadingSelect = false; this.cdr.detectChanges(); })).subscribe({ next: users => { this.usuarios = users as Usuario[]; }, error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios activos' }) }); }
  openUser(userId: string, event: Event): void { event.stopPropagation(); this.drawerService.abrirUsuarioDrawer(userId); }
  select(user: Usuario) { this.usuarioSeleccionado = user; this.submit(); } toModel() { return this.usuarioSeleccionado; }
}
