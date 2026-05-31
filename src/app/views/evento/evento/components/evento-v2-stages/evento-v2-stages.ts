import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { TipoEventoTimelineEtapa } from '@core/interfaces/tipo-evento';

@Component({
  selector: 'app-evento-v2-stages',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './evento-v2-stages.html',
  styleUrl: './evento-v2-stages.scss',
})
export class EventoV2StagesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) etapas!: TipoEventoTimelineEtapa[];
  @Input() etapaActualSecuencia?: number;
  @ViewChild('stagesTrack') stagesTrack?: ElementRef<HTMLDivElement>;

  private centerStageTimeoutId?: number;

  /**
   * Obtiene las etapas en secuencia normal (secuencia > 0 y secuencia < 99)
   */
  get etapasNormales(): TipoEventoTimelineEtapa[] {
    return this.etapas.filter(e => e.secuencia > 0 && e.secuencia < 99);
  }

  /**
   * Obtiene las etapas finales (secuencia = 99)
   */
  get etapasFinal(): TipoEventoTimelineEtapa[] {
    return this.etapas.filter(e => e.secuencia === 99);
  }

  /**
   * Obtiene los rollbacks especiales (secuencia negativa)
   */
  get rollbacksEspeciales(): TipoEventoTimelineEtapa[] {
    return this.etapas.filter(e => e.secuencia < 0);
  }

  isCurrentStage(secuencia: number): boolean {
    return this.etapaActualSecuencia === secuencia;
  }

  /**
   * Determina el estado visual de una etapa basado en su secuencia
   */
  getEstadoEtapa(secuencia: number): 'completada' | 'activa' | 'pendiente' {
    if (!this.etapaActualSecuencia) return 'pendiente';
    
    if (secuencia < this.etapaActualSecuencia) return 'completada';
    if (secuencia === this.etapaActualSecuencia) return 'activa';
    return 'pendiente';
  }

  /**
   * Obtiene la etiqueta del rollback si existe para esta etapa
   */
  getRollbackLabel(etapa: TipoEventoTimelineEtapa): string | null {
    return etapa.rollback?.nombre || null;
  }

  /**
   * Determina si hay conexión visual a la siguiente etapa
   */
  shouldConnectToNext(indice: number): boolean {
    // Conecta solo dentro de la secuencia normal
    return indice < this.etapasNormales.length - 1;
  }

  ngAfterViewInit(): void {
    this.scheduleCenterActiveStage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['etapaActualSecuencia'] || changes['etapas']) {
      this.scheduleCenterActiveStage();
    }
  }

  ngOnDestroy(): void {
    if (this.centerStageTimeoutId) {
      window.clearTimeout(this.centerStageTimeoutId);
    }
  }

  private scheduleCenterActiveStage(): void {
    if (this.centerStageTimeoutId) {
      window.clearTimeout(this.centerStageTimeoutId);
    }

    this.centerStageTimeoutId = window.setTimeout(() => {
      this.centerActiveStage();
    }, 0);
  }

  private centerActiveStage(): void {
    if (!this.stagesTrack?.nativeElement || this.etapaActualSecuencia === undefined) {
      return;
    }

    const trackEl = this.stagesTrack.nativeElement;
    const activeStage = trackEl.querySelector<HTMLElement>(
      `.stage-item[data-secuencia="${this.etapaActualSecuencia}"]`
    );

    if (!activeStage) {
      return;
    }

    const targetLeft =
      activeStage.offsetLeft - trackEl.clientWidth / 2 + activeStage.clientWidth / 2;
    const maxScrollLeft = trackEl.scrollWidth - trackEl.clientWidth;
    const nextScrollLeft = Math.max(0, Math.min(targetLeft, maxScrollLeft));

    trackEl.scrollTo({
      left: nextScrollLeft,
      behavior: 'smooth',
    });
  }
}
