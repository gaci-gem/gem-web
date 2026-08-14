import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { LoadingSpinnerComponent } from '@app/components/index';
import { SelectBase } from '@app/components/select-base/select-base';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';
import { Proyecto } from '@core/interfaces/proyecto';
import { ProyectoService } from '@core/services/proyecto';
import { FiltroActivo } from '@/app/constants/filtros_activo';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
    selector: 'app-evento-select',
    templateUrl: './proyecto-select.html',
    styleUrl: './proyecto-select.scss',
    providers: [MessageService, ConfirmationService],
    imports: [
        LoadingSpinnerComponent,
        TableModule,
        NgIcon,
        BooleanLabelPipe,
        CommonModule,
    ]
})
export class ProyectoSelect extends SelectBase<Proyecto> {
    private proyectoService = inject(ProyectoService);
    protected config = inject(DynamicDialogConfig);

    proyectos: Proyecto[] = [];
    proyectoSeleccionado!: Proyecto;
    clienteId: number | null = null;

    constructor() {
        super(
            inject(ChangeDetectorRef),
            inject(MessageService),
            inject(ConfirmationService)
        );
    }

    override ngOnInit(): void {
        super.ngOnInit();
        
        // Obtener el clienteId si viene en la configuración
        this.clienteId = this.config?.data?.clienteId ?? null;
        
        // Siempre cargar items (el filtrado se hace localmente)
        this.loadItems();
    }

    loadItems() {
        this.loadingSelect = true;
        // Cargar todos los proyectos y filtrar localmente por clienteId
        this.proyectoService.getAll(FiltroActivo.TRUE).pipe(
            finalize(() => {
                this.loadingSelect = false
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: Proyecto[]) => {
                // Transformar la estructura si viene con la relación 'clientes' en lugar de 'clienteIds'
                const proyectosTransformados = res.map((p: any) => {
                    if (!p.clienteIds && p.clientes && Array.isArray(p.clientes)) {
                        // Extraer los clienteId desde el array de relaciones
                        return {
                            ...p,
                            clienteIds: p.clientes.map((c: any) => c.clienteId)
                        };
                    }
                    return p;
                });
                
                // Si hay clienteId, filtrar los proyectos que incluyen ese cliente
                if (this.clienteId !== null) {
                    this.proyectos = proyectosTransformados.filter(p => 
                        p.clienteIds && Array.isArray(p.clienteIds) && p.clienteIds.includes(this.clienteId!)
                    );
                } else {
                    this.proyectos = proyectosTransformados;
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proyectos' });
            }
        });
    }

    select(proyecto: Proyecto) {
        this.proyectoSeleccionado = proyecto;
        this.submit()
    }

    toModel(): Proyecto {
        return this.proyectoSeleccionado;
    }

}
