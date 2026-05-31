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
import { NgIcon } from '@ng-icons/core';
import { HorasPorCategoriaResponse } from '@core/interfaces/registro-hora';

export interface EventoV2Requisito {
  cumplido: boolean;
  requisito: string;
  etapa: string;
  valor: string;
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
  ],
  templateUrl: './evento-v2-details-files.html',
  styleUrl: './evento-v2-details-files.scss',
  providers: [DialogService],
})
export class EventoV2DetailsFilesComponent {
  private eventoService = inject(EventoService);
  private dialogService = inject(DialogService);
  private userStorageService = inject(UserStorageService);
  private usuarioActivo = this.userStorageService.getUsuario();

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
}
