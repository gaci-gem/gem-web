import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { EventoService } from '@core/services/evento';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-item-adjunto',
  templateUrl: './item-adjunto.html',
  styleUrls: ['./item-adjunto.scss'],
  imports: [
    NgIcon
  ]
})
export class ItemAdjuntoComponent {
  private eventoService = inject(EventoService);
  @Input() adjunto: any;
  @Input() puedeEliminar: boolean = false;
  @Output() eliminar = new EventEmitter<any>();

  // Mapeo de tipos a iconos Lucide
  iconosTipo: Record<string, string> = {
    pdf: 'lucideFile-text',
    png: 'lucideImage',
    svg: 'lucideImage',
    jpg: 'lucideImage',
    jpeg: 'lucideImage',
    xlsx: 'lucideFile-spreadsheet',
    doc: 'lucideFile-text',
    docx: 'lucideFile-text',
    txt: 'lucideFile-text',
    default: 'lucideFile'
  };

  getIcon(): string {
    const mime = this.adjunto?.archivo.mimeType || '';
    if (mime.includes('pdf')) return this.iconosTipo['pdf'];
    // if (mime.includes('png')) return this.iconosTipo['png'];
    // if (mime.includes('jpg')) return this.iconosTipo['jpg'];
    // if (mime.includes('svg')) return this.iconosTipo['svg'];
    // if (mime.includes('jpeg')) return this.iconosTipo['jpeg'];
    if (mime.includes('image')) return this.iconosTipo['png'];
    if (mime.includes('xlsx')) return this.iconosTipo['xlsx'];
    if (mime.includes('xls')) return this.iconosTipo['xlsx'];
    if (mime.includes('ods')) return this.iconosTipo['xlsx'];
    if (mime.includes('docx')) return this.iconosTipo['docx'];
    if (mime.includes('doc')) return this.iconosTipo['doc'];
    if (mime.includes('odt')) return this.iconosTipo['doc'];
    if (mime.includes('txt')) return this.iconosTipo['txt'];
    return this.iconosTipo['default'];
  }

  abrirAdjunto() {
    if (this.adjunto?.archivo.path) {
      this.eventoService.getAdjuntoBlob(this.adjunto.id).subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const mime = this.adjunto?.archivo.mimeType || '';
        // Archivos visualizables: pdf, imágenes, txt
        if (
          mime.includes('pdf') ||
          mime.includes('png') ||
          mime.includes('svg') ||
          mime.includes('jpg') ||
          mime.includes('jpeg') ||
          mime.includes('gif') ||
          mime.includes('bmp') ||
          mime.includes('webp') ||
          mime.includes('txt')
        ) {
          const win = window.open(url, '_blank');
          if (win) {
            win.onload = () => {
              win.document.title = this.adjunto.archivo.name;
            };
          }
        } else {
          // Descargar con nombre correcto
          const a = document.createElement('a');
          a.href = url;
          a.download = this.adjunto.archivo.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        // Liberar el objeto URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }
  }

  onEliminar() {
    this.eliminar.emit(this.adjunto);
  }

  getFecha(): string {
    let fecha = '';
    if (this.adjunto?.auditorias[0].fecha) {
      fecha = new Date(this.adjunto.auditorias[0].fecha).toLocaleDateString();
    }
    return fecha;
  }

  getTipo(): string {
    // Extrae el tipo del mimeType
    return this.adjunto?.mimeType?.split('/')[1]?.toUpperCase() || '';
  }
}
