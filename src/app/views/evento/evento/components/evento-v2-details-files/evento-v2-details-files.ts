import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UiCard } from '@app/components/ui-card';
import { ItemDocumentacion } from '../item-documentacion/item-documentacion';
import { ItemAdjuntoComponent } from '../item-adjunto/item-adjunto';
import { EventoDocumentacion } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileUploader } from '@app/components/file-uploader/file-uploader';
import { PaginasLibresModal } from '../paginas-libres-modal/paginas-libres-modal';
import { modalConfig } from '@/app/types/modals';
import { UserStorageService } from '@core/services/user-storage';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy, lucidePencil, lucideX } from '@ng-icons/lucide';
import { HorasPorCategoriaResponse } from '@core/interfaces/registro-hora';
import { PermisosService } from '@core/services/permisos';
import { Tipo_requisito } from '@core/interfaces/etapa';
import { FormsModule } from '@angular/forms';

export interface EventoV2Requisito {
  requisitoId?: number;
  tipo?: Tipo_requisito;
  cumplido: boolean;
  requisito: string;
  etapa: string;
  valor: string;
  valorTexto?: string;
  valorNumero?: number;
  valorFecha?: Date | string;
  valorBooleano?: boolean;
  url?: string;
}

export interface EstimacionDetalle {
  eventoId: string;
  totalEstimacion: number;
  cantidadRequisitosEstimacion: number;
  requisitos: [
    {
      requisitoId: number;
      codigo: string;
      descripcion: string;
      tipo: string;
      obligatorio: boolean;
      etapaId: number;
      valorNumero: number;
      valorTexto: string;
      valorFecha: Date;
      valorBooleano: boolean;
      url: string;
      updatedAt: Date;
    },
  ];
}

@Component({
  selector: 'app-evento-v2-details-files',
  standalone: true,
  imports: [
    ButtonModule,
    UiCard,
    ItemDocumentacion,
    ItemAdjuntoComponent,
    NgIcon,
    FormsModule,
  ],
  templateUrl: './evento-v2-details-files.html',
  styleUrl: './evento-v2-details-files.scss',
  providers: [
    DialogService,
    provideIcons({ lucideCheck, lucideCopy, lucidePencil, lucideX }),
  ],
})
export class EventoV2DetailsFilesComponent {
  private eventoService = inject(EventoService);
  private dialogService = inject(DialogService);
  private userStorageService = inject(UserStorageService);
  private permisosService = inject(PermisosService);
  private usuarioActivo = this.userStorageService.getUsuario();
  readonly puedeEditarRequisitos = this.permisosService.getPermisos().includes('SYS.ADMIN');
  requisitoEditando: number | null = null;
  valorEdicion: string | boolean | number = '';
  guardandoRequisito = false;

  @Input({ required: true }) requisitos!: EventoV2Requisito[];
  @Input({ required: true }) documentacion!: EventoDocumentacion[];
  @Input({ required: true }) adjuntos!: any[];
  @Input() eventoId: string = '';
  @Input() loadingRequisitos = false;
  @Input() loadingAdjuntos = false;
  @Input() errorRequisitos: string | null = null;
  @Input() errorAdjuntos: string | null = null;

  @Output() refreshAdjuntos = new EventEmitter<void>();
  @Output() refreshRequisitos = new EventEmitter<void>();
  @Output() refreshDocumentacion = new EventEmitter<void>();

  onEliminarAdjunto(event: any) {
    const nombre = event?.archivo?.name || event?.nameFile || 'este adjunto';
    if (!window.confirm(`¿Seguro que querés eliminar "${nombre}"?`)) return;
    this.eventoService.eliminarAdicional(this.eventoId, event.id).subscribe({
      next: () => this.refreshAdjuntos.emit(),
      error: (err) => console.error('Error al eliminar adjunto:', err),
    });
  }

  onEliminarDocumento(documento: EventoDocumentacion) {
    const titulo = documento?.titulo || 'este documento';
    if (!window.confirm(`¿Seguro que querés desasociar "${titulo}"?`)) return;
    this.eventoService.desasociarPaginaNotion(documento.id).subscribe({
      next: () => this.refreshDocumentacion.emit(),
      error: (err) => console.error('Error al desasociar documento:', err),
    });
  }

  onTogglePrincipalDocumento(documento: EventoDocumentacion) {
    this.eventoService.togglePaginaPrincipal(documento.id).subscribe({
      next: () => this.refreshDocumentacion.emit(),
      error: (err) =>
        console.error('Error al cambiar documento principal:', err),
    });
  }

  onUploadAdjunto() {
    const ref = this.dialogService.open(FileUploader, {
      ...modalConfig,
      header: 'Subir Adjunto',
      data: {
        eventoId: this.eventoId,
        usuarioId: this.usuarioActivo?.id,
      },
    });
    if (!ref) return;
    ref.onClose.subscribe((result: any) => {
      if (!result) return;
      this.refreshAdjuntos.emit();
    });
  }

  onLinkDocumentacion() {
    const ref = this.dialogService.open(PaginasLibresModal, {
      ...modalConfig,
      header: 'Adjuntar Documentación',
      data: {
        eventoId: this.eventoId,
      },
    });
    if (!ref) return;
    ref.onClose.subscribe(() => {
      this.refreshDocumentacion.emit();
    });
  }

  getColorForCodigo(codigo: string): string {
    const map: Record<string, string> = {
      DEV: '#2196F3',
      TEST: '#4CAF50',
      ANAL: '#FF9800',
      REV: '#9C27B0',
      DESIGN: '#E91E63',
      ADMIN: '#607D8B',
      MEET: '#795548',
      OTHER: '#9E9E9E',
    };
    return map[codigo] || '#9E9E9E';
  }

  copiarValor(valor: string): void {
    if (!valor || !navigator.clipboard) return;
    void navigator.clipboard.writeText(valor);
  }

  editarRequisito(req: EventoV2Requisito): void {
    if (!this.puedeEditarRequisitos) return;
    if (req.requisitoId === undefined) return;
    this.requisitoEditando = req.requisitoId;
    this.valorEdicion = this.valorOriginal(req);
  }

  cancelarEdicion(): void {
    this.requisitoEditando = null;
  }

  guardarRequisito(req: EventoV2Requisito): void {
    if (!this.puedeEditarRequisitos || !this.eventoId || this.guardandoRequisito || req.requisitoId === undefined || !req.tipo) return;
    const dto = this.valorDto(req);
    this.guardandoRequisito = true;
    this.eventoService.updateEventoRequisito(this.eventoId, String(req.requisitoId), dto).subscribe({
      next: () => {
        this.guardandoRequisito = false;
        this.requisitoEditando = null;
        this.refreshRequisitos.emit();
      },
      error: (err) => {
        this.guardandoRequisito = false;
        console.error('Error al actualizar requisito:', err);
      },
    });
  }

  private valorOriginal(req: EventoV2Requisito): string | boolean | number {
    if (req.tipo === Tipo_requisito.boolean) return req.valorBooleano ?? false;
    if (req.tipo === Tipo_requisito.numeric) return req.valorNumero ?? '';
    if (req.tipo === Tipo_requisito.date && req.valorFecha) {
      return String(req.valorFecha).slice(0, 10);
    }
    return req.valorTexto ?? '';
  }

  private valorDto(req: EventoV2Requisito): Record<string, unknown> {
    if (req.tipo === Tipo_requisito.boolean) return { valorBooleano: Boolean(this.valorEdicion) };
    if (req.tipo === Tipo_requisito.numeric) return { valorNumero: Number(this.valorEdicion) };
    if (req.tipo === Tipo_requisito.date) return { valorFecha: String(this.valorEdicion) };
    return { valorTexto: String(this.valorEdicion) };
  }
}
