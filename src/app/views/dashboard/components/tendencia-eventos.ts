import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core'
import { Chartjs } from '@app/components/chartjs'
import { ChartConfiguration } from 'chart.js'
import { getColor } from '@/app/utils/color-utils'
import { DashboardService } from '@core/services/dashboard'

@Component({
  selector: 'app-tendencia-eventos',
  standalone: true,
  imports: [Chartjs],
  template: `
    <div class="card">
      <div class="card-body">
        <h5 class="text-uppercase mb-3">Tendencia de eventos</h5>
        <app-chartjs #chartComp [getOptions]="chart" />
      </div>
    </div>
  `,
})
export class TendenciaEventos implements OnInit {
  private cdr = inject(ChangeDetectorRef)

  labels: string[] = []
  creados: number[] = []
  cerrados: number[] = []
  rechazados: number[] = []

  @ViewChild('chartComp') chartComp?: Chartjs

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe(res => {
      // console.log(res.tendenciaEventos)

      // Ordenar por periodo de más viejo a más nuevo
      const sorted = res.tendenciaEventos.sort((a, b) => a.periodo.localeCompare(b.periodo))

      this.labels = sorted.map(e => e.periodo)
      this.creados = sorted.map(e => e.creados)
      this.cerrados = sorted.map(e => e.cerrados)
      this.rechazados = sorted.map(e => e.rechazados)

      this.cdr.detectChanges()
      setTimeout(() => this.chartComp?.refresh(), 60)
    })
  }

  chart = (): ChartConfiguration => ({
    type: 'line',
    data: {
      labels: this.labels,
      datasets: [
        {
          label: 'Creados',
          data: this.creados,
          borderColor: getColor('chart-primary'),
          tension: 0.4,
        },
        {
          label: 'Finalizados',
          data: this.cerrados,
          borderColor: getColor('secondary'),
          tension: 0.4,
        },
        {
          label: 'Rechazados',
          data: this.rechazados,
          borderColor: getColor('danger'),
          tension: 0.4,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: true },
      },
    },
  })
}
