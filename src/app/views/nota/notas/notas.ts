import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Nota, NotaComplete, NotaPermiso } from '@core/interfaces/nota';
import { getTimeAgo } from '../../../utils/datetime-utils';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NotaEditor } from '../nota-editor/nota-editor';
import { NotaCompartirModal } from '../nota-compartir-modal/nota-compartir-modal';
import { modalConfig } from '@/app/types/modals';
import { NotaService } from '@core/services/nota';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-notas',
  imports: [CommonModule, NgIcon, ConfirmDialogModule, ToastModule],
  templateUrl: './notas.html',
  styleUrl: './notas.scss',
  providers: [ConfirmationService, MessageService, DialogService]
})
export class Notas implements OnInit {
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private notaService = inject(NotaService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  @Input() targetId?: string;
  private ref?: DynamicDialogRef | null;

  notas: NotaComplete[] = [];
  loading = false;

  constructor() {
    // Configurar marked para usar marked.parse en lugar de marked()
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  ngOnInit(): void {
    this.cargarNotas();
  }

  cargarNotas(): void {
    this.loading = true;
    this.notaService.getAllComplete().subscribe({
      next: (notas) => {
        this.notas = notas;
        this.loading = false;
        this.cdr.markForCheck();

        if (this.targetId) {
          setTimeout(() => {
            this.scrollToTarget();
          }, 300);
        }
      },
      error: (error) => {
        console.error('Error al cargar las notas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las notas'
        });
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  esCompartida(nota: NotaComplete): boolean {
    return nota.tipoRelacion === 'C';
  }

  puedeEditar(nota: NotaComplete): boolean {
    // Si es propia, puede editar
    if (nota.tipoRelacion === 'P') return true;

    // Si es compartida, solo puede editar si tiene permiso de EDITAR
    if (nota.tipoRelacion === 'C') {
      return nota.permiso === NotaPermiso.EDITAR;
    }

    return false;
  }

  getRelativeTime(fecha: Date): string {
    return getTimeAgo(fecha);
  }

  renderMarkdown(markdown: string): SafeHtml {
    if (!markdown) return '';
    try {
      const html = marked.parse(markdown) as string;
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return markdown;
    }
  }

  editarNota(nota: NotaComplete): void {
    this.mostrarModalCrud(nota, 'M');
  }

  abrirNota(nota: NotaComplete): void {
    // Si es compartida y no tiene permiso de editar, abrir en modo visualizar
    if (this.esCompartida(nota) && !this.puedeEditar(nota)) {
      this.mostrarModalCrud(nota, 'V');
    } else {
      // Si es propia o tiene permiso de editar, abrir en modo editar
      this.mostrarModalCrud(nota, 'M');
    }
  }

  eliminarNota(nota: NotaComplete): void {
    // No permitir eliminar notas compartidas
    if (this.esCompartida(nota)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No puedes eliminar una nota compartida'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Estás seguro que querés eliminar la nota "${nota.titulo}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (!nota.id) return;

        this.notaService.delete(nota.id).subscribe({
          next: () => {
            this.notas = this.notas.filter(n => n.id !== nota.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Nota eliminada correctamente'
            });
          },
          error: (error) => {
            console.error('Error al eliminar la nota:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la nota'
            });
          }
        });
      }
    });
  }

  compartirNota(nota: NotaComplete): void {
    // No permitir compartir notas que ya son compartidas
    if (this.esCompartida(nota)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Esta nota ya está compartida contigo'
      });
      return;
    }

    const data = { nota };
    this.ref = this.dialogService.open(NotaCompartirModal, {
      ...modalConfig,
      width: '60%',
      header: `Compartir Nota: ${nota.titulo}`,
      data
    });

    this.ref?.onClose.subscribe((result) => {
      if (result) {
        // Recargar notas si se hicieron cambios
        this.cargarNotas();
      }
    });
  }

  nuevaNota(): void {
    this.mostrarModalCrud(null, 'A');
  }

  mostrarModalCrud(nota: NotaComplete | null, modo: 'A' | 'M' | 'V') {
    // Si es compartida y no tiene permiso de editar, solo permitir ver
    if (nota && this.esCompartida(nota) && modo === 'M' && !this.puedeEditar(nota)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No tienes permiso para editar esta nota compartida'
      });
      return;
    }

    const data = { item: nota, modo };
    const header = modo === 'A' ? 'Nueva Nota' : modo === 'M' ? 'Editar Nota' : 'Ver Nota';

    this.ref = this.dialogService.open(NotaEditor, {
      ...modalConfig,
      width: '40%',
      header,
      data
    });

    if (!this.ref) return;

    this.ref.onClose.subscribe((result: any) => {
      if (!result?.changed) return;
      const notaEditada = result.result as Nota;

      if (modo === 'M') {
        // Actualizar nota existente
        if (!notaEditada.id) return;

        const index = this.notas.findIndex(n => n.id === notaEditada.id);
        if (index !== -1) {
          this.notas[index] = { ...notaEditada, tipoRelacion: this.notas[index].tipoRelacion };
        }
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nota actualizada correctamente' });
      } else if (modo === 'A') {
        this.notas = [{ ...notaEditada, tipoRelacion: 'P' }, ...this.notas];
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nota creada correctamente' });
      }
    });
  }

  scrollToTarget() {
    if (!this.targetId) return;
    const element = document.getElementById(`nota-item-${this.targetId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('blink-target');
      setTimeout(() => {
        element.classList.remove('blink-target');
      }, 3000);
    }
  }
}
