import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Evento } from '../evento/evento';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

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
            <span class="fw-semibold">Evento</span>
            <button
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text p-button-rounded p-button-sm"
              (click)="drawerRef.close($event)"
            ></button>
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
  imports: [DrawerModule, ButtonModule, Evento],
})
export class EventoDrawerComponent {
  @Input() visible: boolean = false;
  @Input() eventoId: string | null = null;
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }
}
