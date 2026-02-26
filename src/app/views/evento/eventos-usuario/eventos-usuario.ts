import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ComponentRef, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeClickComponent } from '@app/components/badge-click';
import { EventoCronometroComponent } from '@app/components/evento-cronometro';
import { PrioridadIconComponent } from '@app/components/priority-icon';
import { ControlTrabajarCon } from '@app/components/trabajar-con/components/control-trabajar-con';
import { TrabajarCon } from '@app/components/trabajar-con/trabajar-con';
import { UiCard } from '@app/components/ui-card';
import { modalConfig } from '@/app/types/modals';
import { parseIsoAsLocal } from '@/app/utils/datetime-utils';
import { getTimestamp } from '@/app/utils/time-utils';
import { ShortcutDirective } from '@core/directive/shortcut';
import { CircularEvento, Evento, EventoCompleto, formatEventoNumero } from '@core/interfaces/evento';
import { PermisoClave } from '@core/interfaces/rol';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { DrawerService } from '@core/services/drawer.service';
import { EventoAccionesService } from '@core/services/evento-acciones';
import { EventoTrabajoService } from '@core/services/evento-trabajo.service';
import { EventoService } from '@core/services/evento';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { EventoCrud } from '../evento-crud/evento-crud';
import { ModalSel } from './components/modal-sel/modal-sel';
import { SelEventoPropio } from './components/sel-evento-propio/sel-evento-propio';

@Component({
  selector: 'app-eventos-usuario',
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
    NgbPopoverModule,
    TooltipModule,
    PrioridadIconComponent,
    NgbTooltipModule,
    DatePickerModule,
    FormsModule,
    ControlTrabajarCon,
  ],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './eventos-usuario.html',
  styleUrl: './eventos-usuario.scss'
})
export class EventosUsuario extends TrabajarCon<Evento> {
  private eventoService = inject(EventoService);
  private eventoAccionesService = inject(EventoAccionesService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef | null;
  private userStorageService = inject(UserStorageService);
  private eventoTrabajoService = inject(EventoTrabajoService);
  private drawerService = inject(DrawerService);
  @ViewChild('dt') table!: Table;
  private selecionarEventoPropio!: DynamicDialogRef | null;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();

  eventos: EventoCompleto[] = [];
  
  filtroFecha: Date[] | undefined;
  
  // Simplificar las propiedades del evento en trabajo
  eventoEnTrabajo: EventoCompleto | null = null;
  tiempoInicioTrabajo: Date | null = null;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService)
    );
    this.permisoClave = PermisoClave.EVENTO;
  }

  override ngOnInit(): void {
    setTimeout(() => {
      this.inicializarFiltroFecha();
      this.verificarEventoEnTrabajo();
      this.loadItems();
    });

    // Suscribirse a cambios en el evento en trabajo
    this.eventoTrabajoService.eventoEnTrabajo$.subscribe(evento => {
      this.eventoEnTrabajo = evento;
      this.cdr.detectChanges();
    });

    this.eventoTrabajoService.tiempoInicio$.subscribe(tiempo => {
      this.tiempoInicioTrabajo = tiempo;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
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

    this.eventoService.getAllCompleteByUsuario(this.usuarioActivo?.id ?? '', params)
    .pipe(finalize(() => {
      this.loadingService.hide();
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res) => {
        console.log(res);
        setTimeout(() => {
          this.eventos = res.map(e => ({
            ...e,
            evento: formatEventoNumero(e.tipo.codigo, e.numero),
            fechaInicio: (e as any).fechaInicio ? parseIsoAsLocal((e as any).fechaInicio) : null,
            fechaFinReal: (e as any).fechaFinReal ? parseIsoAsLocal((e as any).fechaFinReal) : null,
            fechaFinEst: (e as any).fechaFinEst ? parseIsoAsLocal((e as any).fechaFinEst) : null,
            fechaEntrega: (e as any).fechaEntrega ? parseIsoAsLocal((e as any).fechaEntrega) : null
          })) as unknown as EventoCompleto[];
          if (this.table) {
            this.table.reset();
          }
        });
      },
      error: () => {
        this.showError('Error al cargar los eventos.');
      }
    });
  }

  protected override exportarExcelImpl(): void {
    this.eventoService.exportarExcel().subscribe({
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

  protected override procesarExcel(file: File): void {
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

  protected override descargarPlantilla(): void {
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

  mostrarModalCrud(evento: EventoCompleto | null, modo: 'A' | 'M' | 'AVZ' | 'RTO' | 'RAS' | 'AUT' | 'REC') {
    // Si es modo de Alta o Modificación, abrir el modal de EventoCrud
    if (modo === 'A' || modo === 'M') {
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
      return;
    }

    // Modo original para acciones de evento (AVZ, RTO, RAS, AUT, REC)
    let header: string;
    let data = {
      reqComentario: false,
      comentario: '',
      mensaje: '',
      modo: modo,
      etapaActual: '',
      proximaEtapa: '',
      rol: '',
      requisitos: [] as any[],
      eventoId: evento?.id ?? '',
      usuarioId: this.usuarioActivo?.id ?? ''
    };

    switch (modo) {
      case 'AVZ':
        header = "Avanzar Evento";
        // data.reqComentario = evento?.etapaSiguiente?.requiereComentario || false;
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaSiguiente?.rolPreferido ?? '';
        break;
      case 'RTO':
        header = "Retroceder Evento";
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaAnterior?.rolPreferido ?? '';
        break;
      case 'RAS':
        header = "Reasignar Evento";
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.rol = evento?.etapaActualData?.rolPreferido ?? '';
        break;
      case 'AUT':
        header = "Autorizar Evento";
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.requisitos = evento?.etapaActualData?.requisitos ?? [];
        data.proximaEtapa = evento?.etapaSiguiente?.nombre ?? '';
        data.rol = evento?.etapaSiguiente?.rolPreferido ?? '';
        break;
      case 'REC':
        header = "Rechazar Evento";
        data.etapaActual = evento?.etapaActualData?.nombre ?? '';
        data.proximaEtapa = evento?.etapaAnterior?.nombre ?? '';
        // data.rol = evento?.etapaActualData?.rolPreferido ?? '';
        break;
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
        
        // Verificar si el evento a procesar es el mismo que está en trabajo
        const eventoEnTrabajoId = this.eventoEnTrabajo?.id;
        const eventoActualId = evento.id;
        const debeLiberar = eventoEnTrabajoId === eventoActualId && (modo === 'AVZ' || modo === 'RTO' || modo === 'RAS');
        
        this.loadingService.show();

        // Si debe liberar, primero liberar el evento
        if (debeLiberar) {
          this.eventoAccionesService.liberar(eventoEnTrabajoId || '', 'Liberado automáticamente por acción de usuario').subscribe({
            next: () => {
              // Limpiar el evento en trabajo
              this.eventoTrabajoService.limpiarEvento();
              this.showSuccess('Evento liberado automáticamente.');
              
              // Continuar con la acción original
              this.ejecutarAccionEvento(modo, body);
            },
            error: (err: any) => {
              this.showError(err.error.message || 'Error al liberar el evento automáticamente.');
              this.loadingService.hide();
            }
          });
        } else {
          // Ejecutar la acción directamente
          this.ejecutarAccionEvento(modo, body);
        }
      }
    });

  }

  private ejecutarAccionEvento(modo: 'AVZ' | 'RTO' | 'RAS' | 'AUT' | 'REC', body: CircularEvento): void {
    if (modo === 'AVZ') {
      this.eventoAccionesService.avanzar(body).subscribe({
        next: () => this.showSuccess('Evento avanzado correctamente.'),
        error: (err: any) => { this.showError(err.error.message || 'Error al avanzar el evento.') },
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'RTO') {
      this.eventoAccionesService.retroceder(body).subscribe({
        next: () => this.showSuccess('Evento retrocedido correctamente.'),
        error: (err: any) => this.showError(err.error.message || 'Error al retroceder el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'RAS') {
      this.eventoAccionesService.reasignar(body).subscribe({
        next: () => this.showSuccess('Evento reasignado correctamente.'),
        error: (err: any) => this.showError(err.error.message || 'Error al reasignar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'AUT') {
      this.eventoAccionesService.autorizar(body).subscribe({
        next: () => this.showSuccess('Evento autorizado correctamente.'),
        error: (err: any) => this.showError(err.error.message || 'Error al autorizar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    } else if (modo === 'REC') {
      delete body.usuarioId; // no se usa en rechazar
      this.eventoAccionesService.rechazar(body).subscribe({
        next: () => this.showSuccess('Evento rechazado correctamente.'),
        error: (err: any) => this.showError(err.error.message || 'Error al rechazar el evento.'),
        complete: () => {
          this.loadItems();
        },
      });
    }
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

  abrirUsuarioDrawer(usuarioId: string | null | undefined) {
    if (usuarioId) {
      this.drawerService.abrirUsuarioDrawer(usuarioId);
    }
  }

  getRequisitosFaltantes(evento: EventoCompleto): string {
    // console.log(evento.etapaActualData?.requisitosFaltantes);
    if (evento.etapaActualData?.requisitosFaltantes?.length === 0) return '';
    let req = '';
    evento.etapaActualData?.requisitosFaltantes?.forEach((r) => {
      req += `- ${r.descripcion}\n`;
    });
    // console.log(req);
    return req;
  }

  // Nuevos métodos para manejar eventos en trabajo
  tomarEvento(evento: EventoCompleto): void {
    if (this.eventoEnTrabajo) {
      this.showError('Ya tienes un evento en trabajo. Libera el evento actual antes de tomar otro.');
      return;
    }

    this.loadingService.show();
    this.eventoAccionesService.tomar(evento.id || '').subscribe({
      next: () => {
        const tiempoInicio = new Date();
        
        // Actualizar a través del servicio
        this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);
        
        this.showSuccess(`Evento ${evento.tipo.codigo}-${evento.numero?.toString().padStart(3, '0')} tomado.`);
        this.loadItems();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.showError(err.error.message || 'Error al tomar el evento.');
      },
      complete: () => {
        this.loadingService.hide();
      }
    });
  }

  onEventoLiberado(): void {
    // Ya no es necesario limpiar aquí porque el servicio lo maneja
    this.loadItems(); // Solo recargar la lista
  }

  private verificarEventoEnTrabajo(): void {
    // Solo verificar para el estado local, el servicio maneja la verificación global
    this.eventoAccionesService.obtenerEventoEnTrabajo(this.usuarioActivo?.id ?? '').subscribe({
      next: (evento: any) => {
        if (evento && evento.registroTiempo) {
          const fechaInicio = new Date(evento.registroTiempo.inicio);
          const ahora = new Date();
          
          const tiempoInicio = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate(),
            fechaInicio.getHours(),
            fechaInicio.getMinutes(),
            fechaInicio.getSeconds()
          );
          
          if (tiempoInicio.getTime() > ahora.getTime()) {
            tiempoInicio.setDate(tiempoInicio.getDate() - 1);
          }
          
          // Actualizar a través del servicio
          this.eventoTrabajoService.setEventoEnTrabajo(evento, tiempoInicio);
        }
      },
      error: () => {
        // Si no hay evento en trabajo o hay error, no hacer nada
      }
    });
  }

  abrirEventoDrawer(evento: EventoCompleto) {
    if (evento.id) {
      this.drawerService.abrirEventoDrawer(evento.id);
    }
  }

  abrirSelectorEventoPropio(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.selecionarEventoPropio = this.dialogService.open(SelEventoPropio, {
      ...modalConfig,
      header: "Seleccionar Evento Propio a tomar",
      focusOnShow: false
    });

    if (!this.selecionarEventoPropio) return;

    this.selecionarEventoPropio.onClose.subscribe((result: any) => {
      if (result) {
        this.tomarEvento(result);
      }
    });
  }

}
