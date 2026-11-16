import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Evento } from '../evento/evento';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-evento-drawer',
  template: `
    <p-drawer
      #drawerRef
      [(visible)]="visible"
      position="right"
      [modal]="true"
      [style]="{ width: '60vw' }"
      (onHide)="onClose()"
    >
      <ng-template #headless>
        <div class="d-flex flex-column h-100">
          <div
            class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
          >
            <div class="d-flex align-items-center gap-2">
              <span class="fw-semibold">Evento</span>
              <!-- @if (eventoId) {
                <a
                  [href]="eventoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir evento en GEM"
                  title="Abrir evento en GEM"
                  class="btn btn-sm btn-outline-primary d-inline-flex align-items-center rounded-pill"
                >
                  <span class="visually-hidden">Abrir evento en GEM</span>
                  <i class="pi pi-external-link" aria-hidden="true"></i>
                </a>
              } -->
            </div>
            <button
              pButton
              type="button"
              class="p-button-text p-button-rounded p-button-sm"
              aria-label="Cerrar evento"
              title="Cerrar evento"
              (click)="drawerRef.close($event)"
            >
              <ng-icon name="lucideX" aria-hidden="true" />
            </button>
          </div>
          <div class="flex-grow-1 overflow-auto">
            @if (visible && eventoId) {
              <app-evento [eventoIdParam]="eventoId" />
            }
          </div>
        </div>
      </ng-template>
    </p-drawer>
  `,
  styles: `
    @media screen and (max-width: 960px) {
      ::ng-deep .p-drawer {
        width: 80vw !important;
      }
    }
    @media screen and (max-width: 640px) {
      ::ng-deep .p-drawer {
        width: 100vw !important;
      }
    }
  `,
  imports: [DrawerModule, ButtonModule, NgIcon, Evento],
})
export class EventoDrawerComponent {
  @Input() visible: boolean = false;
  @Input() eventoId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  get eventoUrl(): string {
    return `${window.location.origin}/evento/evento/${this.eventoId}`;
  }

  onClose() {
    this.closed.emit();
  }
}
