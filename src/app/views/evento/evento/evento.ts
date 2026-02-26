import { EventoInfoCardComponent } from './components/evento-info-card/evento-info-card.component';
import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { UiCard } from '@app/components/ui-card';
import { ShortcutDirective } from '@core/directive/shortcut';
import { Evento_requisito, Evento_requisito_completo, EventoCompleto, EventoDocumentacion, formatEventoNumero, VidaEvento } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { NgbAccordionModule, NgbCollapse } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute } from '@angular/router';
import { ItemAdjuntoComponent } from './components/item-adjunto/item-adjunto';
import { ItemActividadComponent } from './components/item-actividad/item-actividad';
import { FileUploader } from '@app/components/file-uploader/file-uploader';
import { modalConfig } from '@/app/types/modals';
import { UserStorageService, UsuarioLogeado } from '@core/services/user-storage';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';
import { LoadingSpinnerComponent } from '@app/components/index';
import { Tipo_requisito } from '@core/interfaces/etapa';
import { showError, showSuccessToast } from '@/app/utils/message-utils';
import { PermisosService } from '@core/services/permisos';
import { PermisoAccion } from '@/app/types/permisos';
import { PermisoClave } from '@core/interfaces/rol';
import { buildPermiso } from '@/app/utils/permiso-utils';
import { getEstadoDescCorto } from '@/app/constants/evento_estados';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { ItemDocumentacion } from "./components/item-documentacion/item-documentacion";
import { PaginasLibresModal } from './components/paginas-libres-modal/paginas-libres-modal';
import { ParametroService } from '@core/services/parametros';


@Component({
  selector: 'app-evento',
  imports: [
    UiCard,
    TableModule,
    NgbAccordionModule,
    ToolbarModule,
    ConfirmDialogModule,
    ToastModule,
    EventoInfoCardComponent,
    ItemAdjuntoComponent,
    ItemActividadComponent,
    NgIcon,
    FormsModule,
    LoadingSpinnerComponent,
    ItemDocumentacion
],
  providers: [
    DialogService,
    MessageService,
    ConfirmationService
  ],
  templateUrl: './evento.html',
  styleUrl: './evento.scss'
})
export class Evento implements OnInit {
  @Input() eventoIdParam!: string;
  @Input() targetId?: string;
  private loadingService = inject(LoadingService);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);
  protected confirmationService = inject(ConfirmationService);
  protected permisosService = inject(PermisosService);
  ref!: DynamicDialogRef | null;
  private rutActiva = inject(ActivatedRoute);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private userStorageService = inject(UserStorageService);
  private parametroService = inject(ParametroService);

  readonly PermisoAccion = PermisoAccion;
  getEstadoDescCorto = getEstadoDescCorto;

  usuarioActivo: UsuarioLogeado | null = this.userStorageService.getUsuario();
  permisoClave = PermisoClave.EVENTO;

  private eventoService = inject(EventoService);
  evento!: EventoCompleto;
  cargandoEvento: boolean = false;

  // estado para observar/seguir el evento
  esObservador: boolean = false;
  togglingObservador: boolean = false;

  eventoId!: string;

  adjuntosReloading = false;
  adjuntos!: any[];

  documentacionReloading = false;
  documentacion!: EventoDocumentacion[];
  documentacionActiva: boolean = false;

  requisitosReloading = false;
  requisitos!: Evento_requisito_completo[];

  vidaEvento!: VidaEvento[];
  mostrarTodasLasActividades: boolean = false;
  nuevoComentario: string = '';

  get actividadesMostradas(): VidaEvento[] {
    if (!this.vidaEvento) return [];
    if (this.mostrarTodasLasActividades || this.vidaEvento.length <= 7) {
      return this.vidaEvento;
    }
    // Mostramos las últimas 7 (las más recientes al final)
    return this.vidaEvento.slice(-7);
  }

  onActualizarRequisito(req: any, event: any) {
    // Aquí puedes ajustar el payload según lo que espera tu backend
    let payload: any = {
      requisitoId: req.requisito.id,
      eventoId: this.eventoId,
      usuarioId: this.usuarioActivo?.id,
      valorTexto: null,
      valorNumero: null,
      valorBooleano: null,
      valorFecha: null,
      url: null
    };

    switch (req.requisito.tipo) {
      case Tipo_requisito.text:
        payload.valorTexto = event.target.value;
        break;
      case Tipo_requisito.date:
        payload.valorFecha = new Date(event.target.value);
        break;
      case Tipo_requisito.boolean:
        payload.valorBooleano = event.target.checked;
        break;
      case Tipo_requisito.numeric:
        payload.valorNumero = Number(event.target.value);
        break;
      case Tipo_requisito.file:
        payload.url = event.target.files[0];
        break;
    }
    if (req.cumplido) {
      this.eventoService.updateEventoRequisito(this.eventoId, req.requisito.id, payload).subscribe({
        next: (res) => {
          this.onReloadRequisitos();
          showSuccessToast(this.messageService, 'Requisito registrado', 'El requisito ha sido registrado exitosamente.');
        },
        error: (err) => {
          showError(this.messageService, 'Error al actualizar requisito:', err.error.message);
        }
      });
    } else {
      this.eventoService.registrarEventoRequisito(this.eventoId, payload).subscribe({
        next: (res) => {
          this.onReloadRequisitos();
          showSuccessToast(this.messageService, 'Requisito registrado', 'El requisito ha sido registrado exitosamente.');
        },
        error: (err) => {
          showError(this.messageService, 'Error al registrar requisito:', err.error.message);
        }
      });
    }
  }
  getType(req: any): string {
    switch (req.requisito.tipo) {
      case Tipo_requisito.text:
        return 'text';
      case Tipo_requisito.date:
        return 'date';
      case Tipo_requisito.boolean:
        return 'checkbox';
      case Tipo_requisito.numeric:
        return 'number';
      case Tipo_requisito.file:
        return 'text';
      default:
        return 'text';
    }

  }

  async ngOnInit() {
    if (this.eventoIdParam) {
      this.eventoId = this.eventoIdParam;
    } else {
      this.eventoId = this.rutActiva.snapshot.params['id'];
    }
    // console.log(this.eventoId)

    this.documentacionActiva = await this.getDocumentacionActiva();
    this.getEvento();
    this.onReloadAdjuntos();
    this.onReloadDocumentacion();
    this.onReloadRequisitos();
    this.getActividadEvento();
  }

  getEvento() {
    // this.loadingService.show();
    this.cargandoEvento = true;
    this.eventoService.getByIdCompleto(this.eventoId).pipe(
      finalize(() => this.cargandoEvento = false)
    ).subscribe(
      {
        next: (res: any) => {
          console.log(res);
          this.evento = {
            ...res,
            evento: formatEventoNumero(res.tipo.codigo, res.numero)
          };
          const usuarioId = this.usuarioActivo?.id;
          const observadores = this.evento.observadores;
          if (usuarioId && Array.isArray(observadores)) {
            this.esObservador = observadores.some((o: any) => o.usuarioId === usuarioId);
          } else {
            this.esObservador = false;
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching evento:', err);
        }
      }
    );
  }

  onToggleObservador() {
    if (!this.usuarioActivo) return;
    this.togglingObservador = true;
    this.eventoService.toggleObservador(this.eventoId, this.usuarioActivo.id)
    .pipe(finalize(() => {this.togglingObservador = false; this.cdr.detectChanges();}))
    .subscribe({
      next: (res: any) => {
        // alternar estado local
        this.esObservador = !this.esObservador;
        // recargar actividad/opciones si es necesario
        this.getActividadEvento();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.esObservador ? 'Ahora eres observador del evento' : 'Ya no eres observador del evento' });
      },
      error: (err: any) => {
        console.error('Error toggle observador:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'No se pudo alternar observador' });
      }
    });
  }

  onReloadAdjuntos() {
    this.adjuntosReloading = true;

    this.eventoService.getAdjuntos(this.eventoId).subscribe(
      {
        next: (res: any) => {
          // console.log(res)
          this.adjuntos = res;
          this.adjuntosReloading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching adjuntos:', err);
        }
      }
    );
  }

  onReloadDocumentacion() {
    this.documentacionReloading = true;

    this.eventoService.getDocumentacion(this.eventoId)
    .pipe(finalize(() => { this.documentacionReloading = false; this.cdr.detectChanges(); }))
    .subscribe(
      {
        next: (res: any) => {
          // console.log(res)
          this.documentacion = res.sort((a: EventoDocumentacion, b: EventoDocumentacion) => {
            // Ordenar primero por esPrincipal, luego por fecha descendente
            if (a.esPrincipal && !b.esPrincipal) return -1;
            if (!a.esPrincipal && b.esPrincipal) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        },
        error: (err: any) => {
          console.error('Error fetching docs:', err);
        }
      }
    );
  }

  onReloadRequisitos() {
    this.requisitosReloading = true;

    this.eventoService.getRequisitos(this.eventoId).subscribe(
      {
        next: (res: any) => {
          // console.log(res)
          // Inicializar cumplimiento si es null
          this.requisitos = res.map((req: any) => {
            if (!req.cumplimiento) {
              req.cumplimiento = { valor: '' };
            }
            return req;
          });
          this.requisitosReloading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error fetching requisitos:', err);
        }
      }
    );
  }

  getActividadEvento() {
    this.eventoService.getActividad(this.eventoId).subscribe(
      {
        next: (res: any) => {
          // console.log(res)
          this.vidaEvento = res;
          this.cdr.detectChanges();

          if (this.targetId) {
            this.mostrarTodasLasActividades = true;
            setTimeout(() => {
              this.scrollToTarget();
            }, 500);
          }
        },
        error: (err: any) => {
          console.error('Error fetching actividad evento:', err);
        }
      }
    );
  }

  scrollToTarget() {
    if (!this.targetId) return;
    const element = document.getElementById(`actividad-adicion-${this.targetId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('blink-target');
      setTimeout(() => {
        element.classList.remove('blink-target');
      }, 3000);
    }
  }

  onEliminarAdjunto(event: any) {
    console.log('Eliminar adjunto:', event);
    this.confirmationService.confirm({
      message: `¿Seguro que querés eliminar ${event.nameFile}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.eventoService.eliminarAdicional(this.eventoId, event.id).subscribe({
          next: (res) => {
            console.log('Adjunto eliminado:', res);
            this.onReloadAdjuntos();
          },
          error: (err) => {
            console.error('Error al eliminar adjunto:', err);
          }
        });
      }
    });
  }

  onEliminarDocumento(documento: any) {
    console.log('Eliminar documento:', documento);
    this.confirmationService.confirm({
      message: `¿Seguro que querés desasociar ${documento.title}?`,
      header: 'Confirmar desasociación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.eventoService.desasociarPaginaNotion(documento.id).subscribe({
          next: (res) => {
            console.log('Documento desasociado:', res);
            this.onReloadDocumentacion();
          },
          error: (err) => {
            console.error('Error al desasociar documento:', err);
          }
        });
      }
    });
  }
  onTogglePrincipalDocumento(documento: any) {
    this.eventoService.togglePaginaPrincipal(documento.id)
    .pipe(finalize(() => { this.cdr.detectChanges(); }))
    .subscribe({
      next: (res) => {
        console.log('Documento desasociado:', res);
        this.onReloadDocumentacion();
      },
      error: (err) => {
        console.error('Error al desasociar documento:', err);
      }
    });
  }

  onUploadAdjunto() {
    this.ref = this.dialogService.open(FileUploader, {
      ...modalConfig,
      header: "Subir Adjunto",
      data: {
        eventoId: this.eventoId,
        usuarioId: this.usuarioActivo?.id
      }
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result) return;
    });
  }

  onLinkDocumentacion() {
    // console.error('No desarrollado aún: subir documentación');
    this.ref = this.dialogService.open(PaginasLibresModal, {
      ...modalConfig,
      header: "Adjuntar Documentación",
      data: {
        eventoId: this.eventoId,
      }
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      this.onReloadDocumentacion();
      if (!result) return;
    });
  }

  onEnviarComentario() {
    if (!this.nuevoComentario.trim()) return;

    const formData = new FormData();
    formData.append('eventoId', this.eventoId);
    formData.append('usuarioId', this.usuarioActivo?.id || '');
    formData.append('tipo', "COMENTARIO");
    formData.append('comentario', JSON.stringify({ "texto": this.nuevoComentario }));
    this.eventoService.agregarAdicional(this.eventoId, formData).subscribe({
      next: (res) => {
        this.getActividadEvento();
      },
      error: (err) => {
        console.error('Error al guardar el comentario:', err);
      }
    });
    this.nuevoComentario = '';
  }

  can(accion: PermisoAccion): boolean {
    return this.permisosService.can(buildPermiso(this.permisoClave, accion));
  }

  canModificarRequisitos(): boolean {
    return this.can(PermisoAccion.REQ_MODIFICAR);
  }

  getRequerimientoDisabled(req: any): boolean {
    // console.log(this.evento.etapaActualData.id, req.etapa.id, this.evento.usuarioActual.id, this.usuarioActivo?.id);
    return (
      this.evento.etapaActualData.id < req.etapa.id ||
      this.evento.usuarioActual.id !== this.usuarioActivo?.id
    );
  }

  async getDocumentacionActiva(): Promise<boolean> {
    return await firstValueFrom(this.parametroService.getParametroActivo('NOTION_ENABLED'));
  }

  compartirEvento() {
    const baseUrl = window.location.origin;
    const eventoUrl = `${baseUrl}/evento/evento/${this.eventoId}`;
    
    navigator.clipboard.writeText(eventoUrl).then(() => {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'URL copiada', 
        detail: 'El enlace del evento se copió al portapapeles' 
      });
    }).catch((err) => {
      console.error('Error al copiar al portapapeles:', err);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'No se pudo copiar el enlace al portapapeles' 
      });
    });
  }
}
