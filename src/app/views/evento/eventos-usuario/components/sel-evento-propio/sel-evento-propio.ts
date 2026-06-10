import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  BadgeClickComponent,
  LoadingSpinnerComponent,
} from '@app/components/index';
import { NgIcon } from '@ng-icons/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { SelectBase } from '@app/components/select-base/select-base';
import { EventoService } from '@core/services/evento';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { DrawerService } from '@core/services/drawer.service';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { EventoCompleto, formatEventoNumero } from '@core/interfaces/evento';
import { finalize } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-sel-evento-propio',
  templateUrl: './sel-evento-propio.html',
  styleUrl: './sel-evento-propio.scss',
  providers: [MessageService],
  imports: [
    LoadingSpinnerComponent,
    TableModule,
    BadgeClickComponent,
    NgIcon,
    TooltipModule,
    NgbTooltipModule,
  ],
})
export class SelEventoPropio extends SelectBase<EventoCompleto> {
  private eventoService = inject(EventoService);
  protected config = inject(DynamicDialogConfig);
  private drawerService = inject(DrawerService);

  filtroEvento: FiltroActivo = FiltroActivo.FALSE;

  eventos: EventoCompleto[] = [];
  eventoSeleccionado!: EventoCompleto;
  modalVisible: boolean = false;

  constructor() {
    super(
      inject(ChangeDetectorRef),
      inject(MessageService),
      inject(ConfirmationService),
    );
  }

  override ngOnInit(): void {
    // const data = this.config.data.filtroEvento;
    // if (data) {
    //   this.filtroEvento = data;
    // }
    super.ngOnInit();
  }

  abrirEventoDrawer(evento: EventoCompleto) {
    if (evento.id) {
      this.drawerService.abrirEventoDrawer(evento.id);
    }
  }

  loadItems() {
    this.loadingSelect = true;
    this.eventoService
      .getAllComplete(this.filtroEvento, { propio: true })
      .pipe(
        finalize(() => {
          this.loadingSelect = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res: EventoCompleto[]) => {
          // console.log(res);
          // this.eventos = res;
          this.eventos = res.map((evento) => ({
            ...evento,
            evento: formatEventoNumero(evento.tipo.codigo, evento.numero),
          }));
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los eventos',
          });
        },
      });
  }

  select(evento: EventoCompleto) {
    this.eventoSeleccionado = evento;
    this.submit();
  }

  toModel(): EventoCompleto {
    let evento: EventoCompleto = this.eventoSeleccionado;
    return evento;
  }
}
