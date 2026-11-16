import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core'
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts'
import { ChartConfiguration } from 'chart.js'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { Subscription } from 'rxjs'
import { merge } from 'lodash-es'
import { getColor } from '@/app/utils/color-utils'

@Component({
  selector: 'app-chartjs',
  standalone: true,
  imports: [BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <canvas
      [height]="height"
      baseChart
      [data]="options.data"
      [options]="options.options"
      [type]="options.type"
      style="width:100%;display:block"
    ></canvas>
  `,
})
export class Chartjs implements OnInit, OnDestroy, AfterViewInit {
  @Input() getOptions!: () => ChartConfiguration
  @Input() height: number = 300

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.refresh()
      this.chart?.chart?.resize()
    }, 200)
  }

  @HostListener('window:resize')
  onWindowResize() {
    setTimeout(() => this.chart?.chart?.resize(), 200)
  }

  options!: ChartConfiguration
  private layoutSub!: Subscription
  private cdr = inject(ChangeDetectorRef)

  get bodyFont() {
    return getComputedStyle(document.body).fontFamily.trim()
  }

  defaultOptions = (): ChartConfiguration['options'] => ({
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: -10,
      },
    },
    scales: {
      x: {
        ticks: {
          font: { family: this.bodyFont },
          color: getColor('secondary-color'),
          display: true,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          font: { family: this.bodyFont },
          color: getColor('secondary-color'),
        },
        grid: {
          display: true,
          color: getColor('chart-border-color'),
          lineWidth: 1,
        },
        border: {
          display: false,
          dash: [5, 5],
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { family: this.bodyFont },
          color: getColor('secondary-color'),
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
        titleFont: { family: this.bodyFont },
        bodyFont: { family: this.bodyFont },
      },
    },
  })

  layout = inject(LayoutStoreService)

  ngOnInit(): void {
    this.setChartOptions()

    // Refresh chart on theme/skin change
    this.layoutSub = this.layout.layoutState$.subscribe(() => {
      this.setChartOptions()
    })
  }

  ngOnDestroy(): void {
    this.layoutSub?.unsubscribe()
  }

  private setChartOptions() {
    const userConfig = this.getOptions()
    userConfig.options = merge({}, this.defaultOptions(), userConfig.options)

    if (userConfig.options?.scales) {
      if (userConfig.options.scales['x']) {
        userConfig.options.scales['x'].type = 'category'
      }
      if (userConfig.options.scales['y']) {
        userConfig.options.scales['y'].type = 'linear'
      }
    }

    this.options = userConfig
    this.cdr.detectChanges()
    setTimeout(() => {
      this.chart?.update()
      this.chart?.chart?.resize()
    }, 0)
    setTimeout(() => this.chart?.chart?.resize(), 200)
    // If the chart already exists, update it so changes animate
    try {
      this.chart?.update()
    } catch (e) {
      // ignore errors during early lifecycle
    }
  }

  // Public helper: force re-read of options and update chart (useful when data changes)
  public refresh() {
    this.setChartOptions()
  }
}
