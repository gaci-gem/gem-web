import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'
import { UiCard } from '@app/components/ui-card'
import { NovedadService } from '@core/services/novedad'
import { NgIcon } from '@ng-icons/core'
import { DialogService } from 'primeng/dynamicdialog'
import { finalize } from 'rxjs'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TimeAgoComponent } from '@app/components/time-ago/time-ago'
import { Novedad, NovedadTipo, DashboardResponse } from '@core/interfaces/novedad'
import { NovedadViewModal } from '@views/novedad/components/novedad-view-modal'
import { modalConfig } from '@/app/types/modals'
import { getTipoIcon } from '@common/novedad-utils'

@Component({
  selector: 'app-novedad-widget',
  standalone: true,
  imports: [
    NgIcon,
    UiCard,
    CommonModule,
    RouterLink,
    TimeAgoComponent,
  ],
  providers: [DialogService],
  template: `
    <app-ui-card
      title="Novedades"
      [isReloadable]="true"
      [reloading]="loading"
      (reloadCard)="loadDashboard()"
    >
      <div card-body>

        @if (loading) {

          <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>

        } @else if (error) {

          <div class="text-center py-3">
            <p class="text-danger mb-2">Error al cargar las novedades</p>
            <button class="btn btn-sm btn-outline-danger" (click)="loadDashboard()">
              <ng-icon name="lucideRefreshCw" class="me-1" />
              Reintentar
            </button>
          </div>

        } @else {

          @if (items.length === 0) {
            <p class="text-muted text-center py-3 mb-0">No hay novedades activas</p>
          }

          <ul class="list-unstyled mb-0">
            @for (item of items; track item.id) {
              <li class="d-flex align-items-center mb-3 novedad-item" (click)="abrirNovedad(item)">
                <ng-icon
                  [name]="getTipoIcon(item.tipo)"
                  class="me-2"
                  [ngClass]="getTipoColor(item.tipo)"
                  style="width: 24px; height: 24px;"
                />
                <div>
                  <div class="fw-semibold small">{{ item.titulo }}</div>
                  <small class="text-muted"><app-time-ago [fecha]="item.createdAt" /></small>
                </div>
              </li>
            }
          </ul>

          <div class="text-center mt-2">
            <a routerLink="/novedad/historial" class="btn btn-sm btn-link text-decoration-none">
              <ng-icon name="lucideHistory" class="me-1" />
              Ver historial
            </a>
          </div>

        }

      </div>
    </app-ui-card>
  `,
  styles: [`
    :host { display: block; }
    .novedad-item {
      cursor: pointer;
      transition: background 0.15s;
      padding: 4px 6px;
      border-radius: 6px;
      margin-left: -6px;
      margin-right: -6px;
    }
    .novedad-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  `],
})
export class NovedadWidget implements OnInit {
  private novedadService = inject(NovedadService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);

  items: Novedad[] = [];
  urgentBanner: Novedad[] = [];
  loading = false;
  error = false;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = false;
    this.novedadService.getDashboard()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data: DashboardResponse) => {
          this.items = data.items;
          this.urgentBanner = [];
        },
        error: () => {
          this.error = true;
        },
      });
  }

  abrirNovedad(item: Novedad): void {
    this.dialogService.open(NovedadViewModal, {
      ...modalConfig,
      width: '50%',
      data: { novedad: item },
    });
  }

  readonly getTipoIcon = getTipoIcon;

  getTipoColor(tipo: NovedadTipo): string {
    switch (tipo) {
      case NovedadTipo.COMUN: return 'text-secondary';
      case NovedadTipo.AVISO: return 'text-warning';
      case NovedadTipo.URGENCIA: return 'text-danger';
      default: return 'text-secondary';
    }
  }
}
