import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'
import { NgIcon } from '@ng-icons/core'
import { DashboardKpis } from './components/dashboard-kpis'
import { EventosPorCliente } from './components/eventos-por-cliente'
import { TendenciaEventos } from './components/tendencia-eventos'
import { EventosPorTipo } from './components/eventos-por-tipo'
import { EventosPorEtapa } from './components/eventos-por-etapas'
import { ActividadReciente } from './components/actividad-reciente'
import { NovedadWidget } from './components/novedad-widget'
import { NovedadService } from '@core/services/novedad'
import { Novedad } from '@core/interfaces/novedad'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIcon,
    DashboardKpis,
    TendenciaEventos,
    EventosPorTipo,
    EventosPorEtapa,
    ActividadReciente,
    NovedadWidget,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private novedadService = inject(NovedadService);

  urgentes: Novedad[] = [];
  urgentBannerDismissed = false;

  ngOnInit(): void {
    this.loadUrgentes();

    setTimeout(() => {
      this.reloadActividad();
    }, 500);
  }
  actividadLoading = false

  loadUrgentes() {
    this.novedadService.getDashboard().subscribe({
      next: (data) => {
        this.urgentes = data.urgentBanner;
        this.cdr.markForCheck();
      },
    });
  }

  dismissUrgentBanner() {
    this.urgentBannerDismissed = true;
  }

  reloadActividad() {
    this.actividadLoading = true
    setTimeout(() => {
      this.actividadLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 800)
  }
}
