import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { BadgeClickComponent, LoadingSpinnerComponent } from '@app/components/index';
import { SelectBase } from '@app/components/select-base/select-base';
import { Evento, EventoCompleto, formatEventoNumero } from '@core/interfaces/evento';
import { EventoService } from '@core/services/evento';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { DrawerService } from '@core/services/drawer.service';
import { PadZeroPipe } from '@core/pipes/pad-zero.pipe';
import { NgIcon } from '@ng-icons/core';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewportService } from '@core/services/viewport.service';
import { InputTextModule } from 'primeng/inputtext';
import { UserStorageService } from '@core/services/user-storage';

@Component({
    selector: 'app-evento-select',
    templateUrl: './evento-select.html',
    styleUrl: './evento-select.scss',
    providers: [MessageService],
    imports: [
        LoadingSpinnerComponent,
        TableModule,
        BadgeClickComponent,
        NgIcon,
        TooltipModule,
        NgbTooltipModule,
        InputTextModule,
    ]
})
export class EventoSelect extends SelectBase<Evento> {
    private eventoService = inject(EventoService);
    protected config = inject(DynamicDialogConfig);
    private drawerService = inject(DrawerService);
    private viewportService = inject(ViewportService);
    private userStorageService = inject(UserStorageService);

    filtroEvento: FiltroActivo = FiltroActivo.ALL;
    soloMisEventos = false;
    readonly usuarioActualId = this.userStorageService.getUsuario()?.id;

    eventos: EventoCompleto[] = [];
    eventoSeleccionado!: Evento;
    modalVisible: boolean = false;
    readonly isMobile = this.viewportService.isMobile;
    readonly mobilePageSize = 10;
    readonly mobileSearch = signal('');
    readonly mobilePage = signal(0);

    constructor() {
        super(
            inject(ChangeDetectorRef),
            inject(MessageService),
            inject(ConfirmationService)
        );
    }

    override ngOnInit(): void {
        const data = this.config.data.filtroEvento;
        if (data) {
            this.filtroEvento = data;
        }
        super.ngOnInit();
    }

    abrirEventoDrawer(evento: EventoCompleto) {
        if (evento.id) {
            this.drawerService.abrirEventoDrawer(evento.id);
        }
    }

    loadItems() {
        this.loadingSelect = true;
        const eventos$ = this.soloMisEventos
            ? this.eventoService.getAllCompleteByUsuario(this.usuarioActualId ?? '')
            : this.eventoService.getAllComplete(this.filtroEvento);

        eventos$.pipe(
            finalize(() => {
                this.loadingSelect = false
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: EventoCompleto[]) => {
                // console.log(res);
                // this.eventos = res;
                this.eventos = res.map(evento => ({
                    ...evento,
                    evento: formatEventoNumero(evento.tipo.codigo, evento.numero)
                }));
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los eventos' });
            }
        });
    }

    onSoloMisEventosChange(checked: boolean): void {
        this.soloMisEventos = checked;
        this.mobilePage.set(0);
        this.loadItems();
    }

    select(evento:Evento) {
        this.eventoSeleccionado = evento;
        this.submit()
    }

    get eventosFiltradosMobile(): EventoCompleto[] {
        const search = this.mobileSearch().trim().toLocaleLowerCase();
        if (!search) return this.eventos;

        return this.eventos.filter((evento) => [
            evento.evento,
            evento.titulo,
            evento.cliente?.sigla,
            evento.cliente?.nombre,
            evento.producto?.sigla,
            evento.producto?.nombre,
            evento.producto?.entornoCodigo,
            evento.modulo?.codigo,
            evento.modulo?.nombre,
        ].some((value) => value?.toLocaleLowerCase().includes(search)));
    }

    get eventosMobilePagina(): EventoCompleto[] {
        const start = this.mobilePage() * this.mobilePageSize;
        return this.eventosFiltradosMobile.slice(start, start + this.mobilePageSize);
    }

    get mobileTotalPages(): number {
        return Math.ceil(this.eventosFiltradosMobile.length / this.mobilePageSize);
    }

    onMobileSearch(value: string): void {
        this.mobileSearch.set(value);
        this.mobilePage.set(0);
    }

    goToMobilePage(page: number): void {
        const lastPage = Math.max(this.mobileTotalPages - 1, 0);
        this.mobilePage.set(Math.min(Math.max(page, 0), lastPage));
    }

    get mobileFirstItem(): number {
        return this.eventosFiltradosMobile.length === 0 ? 0 : this.mobilePage() * this.mobilePageSize + 1;
    }

    get mobileLastItem(): number {
        return Math.min((this.mobilePage() + 1) * this.mobilePageSize, this.eventosFiltradosMobile.length);
    }

    toModel(): Evento {
        let evento:Evento = this.eventoSeleccionado;
        return evento;
    }

}
