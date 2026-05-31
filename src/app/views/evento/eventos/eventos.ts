import { ChangeDetectorRef, Component, inject, OnInit, ViewChild, ViewContainerRef, ComponentRef, AfterViewInit } from '@angular/core';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { CircularEvento, Evento, EventoCompleto, formatEventoNumero } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { EventoCrud } from '../evento-crud/evento-crud';
import { modalConfig } from '@/app/types/modals';
import { ShortcutDirective } from '@core/directive/shortcut';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { NgIcon } from '@ng-icons/core';
import { TableModule } from 'primeng/table';
import { UiCard } from '@app/components/ui-card';
import { BadgeClickComponent } from "@app/components/badge-click";
import { CommonModule, DatePipe } from '@angular/common';

import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { DrawerService } from '@core/services/drawer.service';
import { PermisoClave } from '@core/interfaces/rol';
import { finalize } from 'rxjs';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { ModalSel } from '../eventos-usuario/components/modal-sel/modal-sel';
import { EventoAccionesService } from '@core/services/evento-acciones';
import { PrioridadIconComponent } from '@app/components/priority-icon';
import { TooltipModule } from 'primeng/tooltip';
import { FiltroRadioGroupComponent } from '@app/components/filtro-check';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { getTimestamp } from '@/app/utils/time-utils';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { PermisoAccion } from '@/app/types/permisos';

@Component({
  selector: 'app-eventos',
  imports: [
    UiCard,
    TableModule,
    NgIcon,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    BadgeClickComponent,
    DatePipe,
    CommonModule,
    PrioridadIconComponent,
    TooltipModule,
    FiltroRadioGroupComponent,
    ControlTrabajarCon,
    NgbTooltipModule,
    DatePickerModule,
    FormsModule,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss'
})
export class Eventos extends TrabajarCon<Evento> {
  private eventoService = inject(EventoService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private userStorageService = inject(UserStorageService);
  private eventoAccionesService = inject(EventoAccionesService);
  private drawerService = inject(DrawerService);

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos: EventoCompleto[] = [];
  selectedEventos: EventoCompleto[] = [];

  filtroFecha: Date[] | undefined;

  override ngOnInit(): void {
    this.filtroActivo = FiltroActivo.FALSE;
    this.inicializarFiltroFecha();
    this.loadItems();
  }

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.EVENTO;
  }

  private inicializarFiltroFecha(): void {
    const hoy = new Date();
    const hace3Meses = new Date();
    hace3Meses.setMonth(hoy.getMonth() - 3);
    this.filtroFecha = [hace3Meses, hoy];
  }

  private formatearFecha(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  onFechaChange(): void {
    if (this.filtroFecha && this.filtroFecha.length === 2 && this.filtroFecha[0] && this.filtroFecha[1]) {
      this.loadItems();
    }
  }

  onClearFecha(): void {
    this.filtroFecha = undefined;
    this.loadItems();
  }

  protected loadItems(): void {
    this.loadingService.show();
    
    let params: any = {};
    if (this.filtroFecha && this.filtroFecha.length === 2 && this.filtroFecha[0] && this.filtroFecha[1]) {
      params.desde = this.formatearFecha(this.filtroFecha[0]);
      params.hasta = this.formatearFecha(this.filtroFecha[1]);
    }

    this.eventoService.getAllComplete(this.filtroActivo, params).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res) => {
          this.eventos = res.map(e => ({
            ...e,
          evento: formatEventoNumero(e.tipo.codigo, e.numero),
          fechaInicio: (e as any).fechaInicio ? parseIsoAsLocal((e as any).fechaInicio) : null,
          fechaFinReal: (e as any).fechaFinReal ? parseIsoAsLocal((e as any).fechaFinReal) : null,
          fechaFinEst: (e as any).fechaFinEst ? parseIsoAsLocal((e as any).fechaFinEst) : null,
          fechaEntrega: (e as any).fechaEntrega ? parseIsoAsLocal((e as any).fechaEntrega) : null
        })) as unknown as EventoCompleto[];
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error al cargar los eventos.')
    });
  }

  abrirEventoDrawer(evento: EventoCompleto) {
    if (evento.id) {
      this.drawerService.abrirEventoDrawer(evento.id);
    }
  }
  
  abrirUsuarioDrawer(usuarioId: string | null | undefined) {
    if (usuarioId) {
      this.drawerService.abrirUsuarioDrawer(usuarioId);
    }
  }

  alta(evento: Evento): void {
    delete evento.id
    this.eventoService.create(evento).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al crear el evento.')
    });
  }

  editar(evento: Evento): void {
    let eventoCodigo = evento.id ?? '';
    this.eventoService.update(eventoCodigo, evento).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al modificar el evento.')
    });
  }

  eliminarDirecto(evento: Evento): void {
    let eventoCodigo = evento.id ?? '';
    this.eventoService.delete(eventoCodigo).subscribe({
      next: () => this.afterChange('Evento eliminado correctamente.'),
      error: (err) => this.showError(err.error.message || 'Error al eliminar el Evento.')
    });
  }

  mostrarModalCrud(evento: Evento | null, modo: 'A' | 'M') {
    const data = { item: evento, modo };
    const header = modo === 'A' ? 'Nuevo Evento' : 'Modificar Evento';

    this.ref = this.dialogService.open(EventoCrud, {
      ...modalConfig,
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result) return;
      this.loadingService.show();
      // Si es FormData, usar los métodos privados
      if (result instanceof FormData) {
        if (modo === 'M') {
          // Necesitas el id para editar, puedes obtenerlo del modal si lo agregas en el FormData
          const id = evento?.id ?? '';
          this.editarFormData(id, result);
        } else {
          console.log(result)
          this.altaFormData(result);
        }
      } else {
        // fallback por si alguna vez retorna un objeto plano
        modo === 'M' ? this.editar(result) : this.alta(result);
      }
    });
  }

  descargarPlantilla() {
    this.eventoService.descargarPlantilla().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_eventos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }
  
  exportarExcelImpl() {
    this.eventoService.exportarExcel(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_eventos_${getTimestamp()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  procesarExcel(file:File): void {
    const form = new FormData();
    form.append('file', file);

    this.loadingService.show();
    this.eventoService.importarExcel(form).pipe(
      finalize(() => {
        this.loadingService.hide();
      })
    ).subscribe({
      next: () => this.afterChange('Eventos importados correctamente.'),
      error: (err) => this.showError(err?.error?.message || 'Error al importar eventos.')
    });
  }

  // Métodos privados para manejar FormData
  private altaFormData(formData: FormData): void {
    this.eventoService.createAdicional(formData).subscribe({
      next: () => this.afterChange('Evento creado correctamente.'),
      error: () => this.showError('Error al crear el evento.')
    });
  }

  private editarFormData(id: string, formData: FormData): void {
    this.eventoService.updateAdicional(id, formData).subscribe({
      next: () => this.afterChange('Evento actualizado correctamente.'),
      error: () => this.showError('Error al modificar el evento.')
    });
  }

  mostrarModalCrudReasignar(evento: EventoCompleto) {

    let header = "Reasignar Evento";
    let mensaje = `Etapa: ${evento?.etapaActualData?.nombre ?? ''}`;
    let rol = evento?.etapaActualData?.rolPreferido;
    let reqComentario = false;

    const data = {
      reqComentario: reqComentario,
      comentario: "",
      mensaje: mensaje,
      rol
    }

    this.ref = this.dialogService.open(ModalSel, {
      ...modalConfig,
      width: '50%',
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result) return;

      console.log(result);
      if (evento) {
        const body: CircularEvento = {
          eventoId: evento.id || '',
          usuarioId: result.usuarioSeleccionado,
          comentario: result.comentario
        }

        this.eventoAccionesService.reasignar(body).subscribe({
          next: () => this.showSuccess('Evento reasignado correctamente.'),
          error: (err: any) => this.showError(err.error.message || 'Error al reasignar el evento.'),
          complete: () => {
            this.loadItems();
          },
        });
      }

    });

  }

}
