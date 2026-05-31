import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { UserStorageService } from '@core/services/user-storage';
import { EventoV2HeaderComponent } from './components/evento-v2-header/evento-v2-header';
import { EventoV2StagesComponent } from './components/evento-v2-stages/evento-v2-stages';
import {
  EstimacionDetalle,
  EventoV2DetailsFilesComponent,
  EventoV2Requisito,
} from './components/evento-v2-details-files/evento-v2-details-files';
import { EventoV2ActivityComponent } from './components/evento-v2-activity/evento-v2-activity';
import {
  EventoCompleto,
  EventoDocumentacion,
  EventoVistaResponse,
  Evento_requisito_completo,
  VidaEvento,
  actividadesMock,
  adjuntosMock,
  documentacionMock,
  eventoMock,
  requisitosMock,
} from '@core/interfaces/evento';
import {
  TipoEventoTimeline,
  TipoEventoTimelineEtapa,
} from '@core/interfaces/tipo-evento';
import { ACCIONES } from '@/app/constants/actividad_acciones';
import { EstadosEvento } from '@/app/constants/evento_estados';
import { EventoService } from '@core/services/evento';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { TipoEventoService } from '@core/services/tipo-evento';
import { RegistroHoraService } from '@core/services/registro-hora';
import { HorasPorCategoriaResponse } from '@core/interfaces/registro-hora';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { HoraCrud } from '../../registroHora/hora-crud/hora-crud';
import { modalConfig } from '@/app/types/modals';

@Component({
  selector: 'app-evento',
  standalone: true,
  imports: [
    EventoV2HeaderComponent,
    EventoV2StagesComponent,
    EventoV2DetailsFilesComponent,
    EventoV2ActivityComponent,
  ],
  templateUrl: './evento.html',
  styleUrl: './evento.scss',
})
export class Evento {
  private readonly eventoService = inject(EventoService);
  private readonly route = inject(ActivatedRoute);
  private readonly userStorageService = inject(UserStorageService);
  private readonly zone = inject(NgZone);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly registroHoraService = inject(RegistroHoraService);
  private readonly dialogService = inject(DialogService);
  private tipoEventoService = inject(TipoEventoService);
  private observer?: IntersectionObserver;

  @Input() eventoIdParam?: string;

  @ViewChild('detailsSection') detailsSection?: ElementRef<HTMLDivElement>;
  @ViewChild('activitySection') activitySection?: ElementRef<HTMLDivElement>;

  eventoId = '';
  evento: EventoCompleto | null = null;
  documentacion: EventoDocumentacion[] = [];
  adjuntos: any[] = [];
  requisitos: EventoV2Requisito[] = [];
  actividades: VidaEvento[] = [];
  estimacionDetalle: EstimacionDetalle | null = null;

  loadingEvento = false;
  loadingAdjuntos = false;
  loadingRequisitos = false;
  loadingActividad = false;

  errorEvento: string | null = null;
  errorAdjuntos: string | null = null;
  errorRequisitos: string | null = null;
  errorActividad: string | null = null;

  private adjuntosLoaded = false;
  private requisitosLoaded = false;
  private actividadLoaded = false;

  porCategoriaData: HorasPorCategoriaResponse | null = null;
  loadingPorCategoria = false;
  errorPorCategoria: string | null = null;
  private porCategoriaLoaded = false;

  private readonly usarFallbackLegacy = true;

  loadingMap: Record<
    'evento' | 'actividad' | 'adjuntos' | 'requisitos',
    boolean
  > = {
    evento: false,
    actividad: false,
    adjuntos: false,
    requisitos: false,
  };

  etapas: TipoEventoTimelineEtapa[] = [];

  etapaActualSecuencia = 1;

  ngOnInit(): void {
    this.eventoId = this.eventoIdParam || this.route.snapshot.params['id'];

    if (!this.eventoId) {
      this.applyLegacyMock();
      return;
    }

    this.loadEventoBase();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  ngAfterViewInit(): void {
    if (!('IntersectionObserver' in window)) {
      this.loadRequisitos();
      this.loadAdjuntos();
      this.loadPorCategoria();
      this.loadActividad();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          if (entry.target === this.detailsSection?.nativeElement) {
            this.loadRequisitos();
            this.loadAdjuntos();
            this.loadPorCategoria();
            this.observer?.unobserve(entry.target);
          }

          if (entry.target === this.activitySection?.nativeElement) {
            this.loadActividad();
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2 },
    );

    if (this.detailsSection?.nativeElement) {
      this.observer.observe(this.detailsSection.nativeElement);
    }
    if (this.activitySection?.nativeElement) {
      this.observer.observe(this.activitySection.nativeElement);
    }
  }

  loadEventoBase(force = false): void {
    if (!this.eventoId || (this.loadingEvento && !force)) return;

    this.loadingEvento = true;
    this.loadingMap.evento = true;
    this.errorEvento = null;

    this.eventoService
      .getEventoVista(this.eventoId)
      .pipe(finalize(() => this.finalizeBlockLoading('evento')))
      .subscribe({
        next: (res) => {
          this.applyVistaResponse(res);
        },
        error: () => {
          if (this.usarFallbackLegacy) {
            this.loadEventoBaseLegacy();
            return;
          }
          this.errorEvento = 'No se pudo cargar el evento.';
        },
      });
  }

  loadActividad(force = false): void {
    if (!this.eventoId || this.loadingActividad) return;
    if (!force && this.actividadLoaded) return;

    this.loadingActividad = true;
    this.loadingMap.actividad = true;
    this.errorActividad = null;

    this.eventoService
      .getEventoVista(this.eventoId, { incluirActividad: true })
      .pipe(finalize(() => this.finalizeBlockLoading('actividad')))
      .subscribe({
        next: (res) => {
          this.actividades = res.actividad ?? [];
          this.actividadLoaded = true;
        },
        error: () => {
          if (this.usarFallbackLegacy) {
            this.loadActividadLegacy(force);
            return;
          }
          this.errorActividad = 'No se pudo cargar la actividad.';
        },
      });
  }

  loadAdjuntos(force = false): void {
    if (!this.eventoId || this.loadingAdjuntos) return;
    if (!force && this.adjuntosLoaded) return;

    this.loadingAdjuntos = true;
    this.loadingMap.adjuntos = true;
    this.errorAdjuntos = null;

    this.eventoService
      .getEventoVista(this.eventoId, {
        incluirAdjuntos: true,
        adjuntosActivo: 'all',
      })
      .pipe(finalize(() => this.finalizeBlockLoading('adjuntos')))
      .subscribe({
        next: (res) => {
          this.adjuntos = res.adjuntos ?? [];
          this.adjuntosLoaded = true;
        },
        error: () => {
          if (this.usarFallbackLegacy) {
            this.loadAdjuntosLegacy(force);
            return;
          }
          this.errorAdjuntos = 'No se pudieron cargar los adjuntos.';
        },
      });
  }

  loadRequisitos(force = false): void {
    if (!this.eventoId || this.loadingRequisitos) return;
    if (!force && this.requisitosLoaded) return;

    this.loadingRequisitos = true;
    this.loadingMap.requisitos = true;
    this.errorRequisitos = null;

    this.eventoService
      .getEventoVista(this.eventoId, { incluirRequisitos: true })
      .pipe(finalize(() => this.finalizeBlockLoading('requisitos')))
      .subscribe({
        next: (res) => {
          this.requisitos = this.mapRequisitos(res.requisitos ?? []);
          this.requisitosLoaded = true;
        },
        error: () => {
          if (this.usarFallbackLegacy) {
            this.loadRequisitosLegacy(force);
            return;
          }
          this.errorRequisitos = 'No se pudieron cargar los requisitos.';
        },
      });
  }

  loadPorCategoria(force = false): void {
    if (!this.eventoId || this.loadingPorCategoria) return;
    if (!force && this.porCategoriaLoaded) return;

    this.loadingPorCategoria = true;
    this.errorPorCategoria = null;

    this.registroHoraService
      .getPorCategoria(this.eventoId)
      .pipe(
        finalize(() => {
          this.loadingPorCategoria = false;
          this.cdRef.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.porCategoriaData = res;
          this.porCategoriaLoaded = true;
        },
        error: () => {
          this.errorPorCategoria =
            'No se pudo cargar el desglose por categoría.';
        },
      });
  }

  onCargarHoras(): void {
    const ref = this.dialogService.open(HoraCrud, {
      ...modalConfig,
      header: 'Cargar Horas',
      data: {
        item: null,
        modo: 'A',
        categoriaSugerida: this.evento?.categoriaSugerida || null,
        eventoIdPreseleccionado: this.eventoId,
      },
    });

    if (!ref) return;
    ref.onClose.subscribe((result: any) => {
      if (result) {
        this.loadPorCategoria(true);
      }
    });
  }

  private finalizeBlockLoading(
    block: 'evento' | 'actividad' | 'adjuntos' | 'requisitos',
  ): void {
    this.zone.run(() => {
      this.loadingMap[block] = false;

      if (block === 'evento') this.loadingEvento = false;
      if (block === 'actividad') this.loadingActividad = false;
      if (block === 'adjuntos') this.loadingAdjuntos = false;
      if (block === 'requisitos') this.loadingRequisitos = false;

      this.cdRef.detectChanges();
    });
  }

  onRefreshActividad(): void {
    this.loadActividad(true);
  }

  onRefreshAdjuntos(): void {
    this.loadAdjuntos(true);
  }

  onRefreshRequisitos(): void {
    this.loadRequisitos(true);
  }

  onPublicarComentario(texto: string): void {
    if (!this.eventoId || !texto.trim()) return;

    const usuarioId = this.userStorageService.getUsuario()?.id ?? '';

    const formData = new FormData();
    formData.append('eventoId', this.eventoId);
    formData.append('usuarioId', usuarioId);
    formData.append('tipo', 'COMENTARIO');
    formData.append('comentario', JSON.stringify({ texto }));

    this.eventoService.agregarAdicional(this.eventoId, formData).subscribe({
      next: () => this.loadActividad(true),
      error: () => {
        this.errorActividad = 'No se pudo publicar el comentario.';
      },
    });
  }

  private applyVistaResponse(res: EventoVistaResponse): void {
    this.evento = res.evento;
    this.documentacion = res.evento.documentacion ?? [];

    if (res.actividad !== undefined) {
      this.actividades = res.actividad;
      this.actividadLoaded = true;
    }
    if (res.adjuntos !== undefined) {
      this.adjuntos = res.adjuntos;
      this.adjuntosLoaded = true;
    }
    if (res.requisitos !== undefined) {
      this.requisitos = this.mapRequisitos(res.requisitos);
      this.requisitosLoaded = true;
    }
    if (res.estimacionDetalle) {
      this.estimacionDetalle = res.estimacionDetalle;
    }

    this.getEtapas(res.evento.tipoCodigo);
  }

  getEtapas(tipoEventoCodigo: string) {
    // this.cargandoTimeline = true;
    this.etapaActualSecuencia = this.evento?.etapaActual ?? 1;
    this.tipoEventoService
      .getTimeline(tipoEventoCodigo)
      .pipe(
        finalize(() => {
          // this.cargandoTimeline = false;
          this.cdRef.detectChanges();
        }),
      )
      .subscribe({
        next: (timeline: TipoEventoTimeline) => {
          this.etapas = timeline.etapas;
        },
        error: (err: any) => {
          console.error('Error fetching timeline:', err);
        },
      });
  }

  private mapRequisitos(
    requisitos: Evento_requisito_completo[],
  ): EventoV2Requisito[] {
    return requisitos.map((req) => ({
      cumplido: req.cumplido,
      requisito:
        req.requisito?.descripcion ??
        req.requisito?.codigo ??
        'Sin descripción',
      etapa: req.etapa?.nombre ?? '-',
      valor: this.resolveRequisitoValor(req),
    }));
  }

  private resolveRequisitoValor(req: Evento_requisito_completo): string {
    const cumplimiento = req.cumplimiento;
    if (!cumplimiento) return '';

    if (cumplimiento.valor !== undefined && cumplimiento.valor !== null)
      return String(cumplimiento.valor);
    if (
      cumplimiento.valorTexto !== undefined &&
      cumplimiento.valorTexto !== null
    )
      return String(cumplimiento.valorTexto);
    if (
      cumplimiento.valorNumero !== undefined &&
      cumplimiento.valorNumero !== null
    )
      return String(cumplimiento.valorNumero);
    if (cumplimiento.valorFecha) return String(cumplimiento.valorFecha);
    if (
      cumplimiento.valorBooleano !== undefined &&
      cumplimiento.valorBooleano !== null
    ) {
      return cumplimiento.valorBooleano ? 'Sí' : 'No';
    }

    return '';
  }

  private loadEventoBaseLegacy(): void {
    this.eventoService.getByIdCompleto(this.eventoId).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.documentacion = evento.documentacion ?? [];
        this.loadingEvento = false;
      },
      error: () => {
        this.loadingEvento = false;
        this.errorEvento = 'No se pudo cargar el evento (fallback legacy).';
        this.applyLegacyMock();
      },
    });
  }

  private loadActividadLegacy(force = false): void {
    if (!force && this.actividadLoaded) {
      this.loadingActividad = false;
      return;
    }

    this.eventoService.getActividad(this.eventoId).subscribe({
      next: (actividad) => {
        this.actividades = actividad;
        this.actividadLoaded = true;
        this.loadingActividad = false;
      },
      error: () => {
        this.loadingActividad = false;
        this.errorActividad =
          'No se pudo cargar la actividad (fallback legacy).';
      },
    });
  }

  private loadAdjuntosLegacy(force = false): void {
    if (!force && this.adjuntosLoaded) {
      this.loadingAdjuntos = false;
      return;
    }

    this.eventoService.getAdjuntos(this.eventoId).subscribe({
      next: (adjuntos) => {
        this.adjuntos = adjuntos;
        this.adjuntosLoaded = true;
        this.loadingAdjuntos = false;
      },
      error: () => {
        this.loadingAdjuntos = false;
        this.errorAdjuntos =
          'No se pudieron cargar los adjuntos (fallback legacy).';
      },
    });
  }

  private loadRequisitosLegacy(force = false): void {
    if (!force && this.requisitosLoaded) {
      this.loadingRequisitos = false;
      return;
    }

    this.eventoService.getRequisitos(this.eventoId).subscribe({
      next: (requisitos) => {
        this.requisitos = this.mapRequisitos(requisitos);
        this.requisitosLoaded = true;
        this.loadingRequisitos = false;
      },
      error: () => {
        this.loadingRequisitos = false;
        this.errorRequisitos =
          'No se pudieron cargar los requisitos (fallback legacy).';
      },
    });
  }

  private applyLegacyMock(): void {
    this.evento = eventoMock;
    this.documentacion = documentacionMock;
    this.adjuntos = adjuntosMock;
    this.requisitos = requisitosMock;
    this.actividades = actividadesMock;

    this.actividadLoaded = true;
    this.adjuntosLoaded = true;
    this.requisitosLoaded = true;
  }
}
