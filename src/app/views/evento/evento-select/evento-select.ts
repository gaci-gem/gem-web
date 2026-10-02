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
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-evento-select',
    templateUrl: './evento-select.html',
    styleUrl: './evento-select.scss',
    providers: [MessageService, ConfirmationService],
    imports: [
        LoadingSpinnerComponent,
        TableModule,
        BadgeClickComponent,
        NgIcon,
        TooltipModule,
        NgbTooltipModule,
        InputTextModule,
        FormsModule,
        CheckboxModule,
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
    readonly multiple = !!this.config.data?.multiple;
    selectedEventIds = new Set<string>();

    constructor() {
        super(
            inject(ChangeDetectorRef),
            inject(MessageService),
            inject(ConfirmationService)
        );
    }

    override ngOnInit(): void {
        const data = this.config.data ?? {};
        this.selectedEventIds = new Set(data.initialSelectedEventIds ?? data.selectedEventIds ?? []);
        const filtro = data.filtroEvento;
        if (filtro) {
            this.filtroEvento = filtro;
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
            next: (res: EventoCompleto[] | { data: EventoCompleto[] }) => {
                const items = Array.isArray(res) ? res : res.data;
                const clienteId = this.config.data?.clienteId;
                const excluded = new Set<string>(this.config.data?.excludedEventIds ?? []);
                // console.log(res);
                // this.eventos = res;
                this.eventos = items.filter(evento =>
                    (clienteId === undefined || evento.clienteId === clienteId) &&
                    (this.multiple ? true : !excluded.has(evento.id ?? ''))
                ).map(evento => ({
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
        if (this.multiple) { this.toggleSelection(evento.id); return; }
        this.eventoSeleccionado = evento;
        this.submit()
    }

    toggleSelection(eventId: string | null | undefined): void {
        if (!eventId) return;
        this.selectedEventIds.has(eventId) ? this.selectedEventIds.delete(eventId) : this.selectedEventIds.add(eventId);
    }
    isSelected(eventId: string | null | undefined): boolean { return !!eventId && this.selectedEventIds.has(eventId); }
    confirmMultiple(): void { this.modalSel.close(this.eventos.filter(evento => this.selectedEventIds.has(evento.id ?? ''))); }
    cancelMultiple(): void { this.modalSel.close(); }

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

    toModel(): Evento | EventoCompleto[] {
        if (this.multiple) return this.eventos.filter(evento => this.selectedEventIds.has(evento.id ?? ''));
        let evento:Evento = this.eventoSeleccionado;
        return evento;
    }

}
