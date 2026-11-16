import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventoDocumentacion } from '@core/interfaces/evento';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-item-documentacion',
  imports: [
    NgIcon,
  ],
  templateUrl: './item-documentacion.html',
  styleUrl: './item-documentacion.scss',
})
export class ItemDocumentacion {
  @Input() documento!: EventoDocumentacion;
  @Input() puedeEliminar: boolean = false;
  @Output() eliminar = new EventEmitter<any>();
  @Output() togglePrincipal = new EventEmitter<any>();


  getIcon(): string {
    if (this.documento.esPrincipal) return 'lucideStar';
    return 'lucideFileText';
  }

  
  abrirAdjunto() {
    if (this.documento?.externalUrl) {
      const a = document.createElement('a');
      a.href = this.documento.externalUrl;
      a.download = this.documento.titulo;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  
  onEliminar() {
    this.eliminar.emit(this.documento);
  }
  onTogglePrincipal() {
    this.togglePrincipal.emit(this.documento);
  }

  getFecha(): string {
    return new Date(this.documento.createdAt).toLocaleDateString();
  }

  getTipo(): string {
    return this.documento.proveedor || 'Desconocido';
  }

}
