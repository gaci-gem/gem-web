import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoEventoTimeline, TipoEventoTimelineEtapa } from '@core/interfaces/tipo-evento';
import { NgIcon } from '@ng-icons/core';
import panzoom from 'panzoom';

@Component({
  selector: 'app-timeline-etapas',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './timeline-etapas.html',
  styleUrl: './timeline-etapas.scss'
})
export class TimelineEtapasComponent implements OnInit, AfterViewInit {
  @Input() timeline!: TipoEventoTimeline;
  @Input() etapaActual?: number; // ID de la etapa actual para resaltar
  @ViewChild('timelineSvg') svgElement?: ElementRef<SVGElement>;

  etapasOrdenadas: TipoEventoTimelineEtapa[] = [];
  etapasRollback: Map<number, { etapa: TipoEventoTimelineEtapa; targetId: number }> = new Map();
  private panzoomInstance: any;

  ngOnInit() {
    if (this.timeline?.etapas) {
      this.etapasOrdenadas = [...this.timeline.etapas].sort((a, b) => a.secuencia - b.secuencia);
      this.procesarRollbacks();
    }
  }

  ngAfterViewInit() {
    if (this.svgElement?.nativeElement) {
      // Inicializar panzoom
      this.panzoomInstance = panzoom(this.svgElement.nativeElement, {
        minZoom: 0.5,
        maxZoom: 3,
        smoothScroll: false,
        beforeWheel: (e: WheelEvent) => {
          // Permitir zoom solo con Ctrl
          return !!(e.ctrlKey || e.metaKey);
        }
      });

      // Agregar listener de wheel personalizado para Ctrl+Scroll
      this.svgElement.nativeElement.addEventListener(
        'wheel',
        (e: WheelEvent) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    }
  }

  private procesarRollbacks() {
    this.etapasRollback.clear();
    this.etapasOrdenadas.forEach((etapa) => {
      if (etapa.rollback) {
        // Si secuencia es negativa, es el ID de la etapa target
        const targetId = etapa.rollback.secuencia < 0 ? Math.abs(etapa.rollback.secuencia) : null;
        const etapaIndex = this.getEtapaIndex(etapa);
        
        if (targetId) {
          this.etapasRollback.set(etapaIndex, {
            etapa,
            targetId
          });
        }
      }
    });
  }

  getEtapaClase(etapa: TipoEventoTimelineEtapa): string {
    let clases = 'etapa-nodo';
    if (this.etapaActual === etapa.id) {
      clases += ' etapa-actual';
    }
    if (etapa.deAutoriza) {
      clases += ' etapa-autoriza';
    }
    if (etapa.deArchivo) {
      clases += ' etapa-archivo';
    }
    return clases;
  }

  hasRollback(etapa: TipoEventoTimelineEtapa): boolean {
    return !!etapa.rollback;
  }

  getRollbackInfo(etapa: TipoEventoTimelineEtapa): string {
    if (etapa.rollback) {
      return `${etapa.rollback.nombre}`;
    }
    return '';
  }

  getRollbackTargetIndex(etapa: TipoEventoTimelineEtapa): number | null {
    if (etapa.rollback && etapa.rollback.secuencia < 0) {
      const targetId = Math.abs(etapa.rollback.secuencia);
      const targetEtapa = this.etapasOrdenadas.find(e => e.id === targetId);
      if (targetEtapa) {
        return this.getEtapaIndex(targetEtapa);
      }
      // Si no encuentra la etapa pero hay rollback negativo, retorna -1 para indicar que existe
      console.log(`Rollback sin etapa target visible: ID ${targetId} para ${etapa.nombre}`);
      return -1;
    }
    return null;
  }

  shouldShowRollback(etapa: TipoEventoTimelineEtapa, i: number): boolean {
    if (!this.hasRollback(etapa)) return false;
    if (etapa.rollback!.secuencia < 0) {
      // Mostrar rollback negativo siempre (incluso sin etapa target)
      return true;
    }
    return this.getRollbackTargetIndex(etapa) !== null;
  }

  getEtapaIndex(etapa: TipoEventoTimelineEtapa): number {
    return this.etapasOrdenadas.indexOf(etapa);
  }

  isLastEtapa(etapa: TipoEventoTimelineEtapa): boolean {
    return this.getEtapaIndex(etapa) === this.etapasOrdenadas.length - 1;
  }

  resetZoom() {
    if (this.panzoomInstance) {
      // Resetear a zoom 1 y posición (0, 0)
      this.panzoomInstance.zoomTo(0, 0, 1);
      this.panzoomInstance.moveTo(0, 0);
    }
  }
}

