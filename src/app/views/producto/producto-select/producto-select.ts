import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { LoadingSpinnerComponent } from '@app/components/index';
import { SelectBase } from '@app/components/select-base/select-base';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { Producto } from '@core/interfaces/producto';
import { ProductoService } from '@core/services/producto';
import { CommonModule } from '@angular/common';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';

@Component({
    selector: 'app-evento-select',
    templateUrl: './producto-select.html',
    styleUrl: './producto-select.scss',
    providers: [MessageService, ConfirmationService],
    imports: [
        LoadingSpinnerComponent,
        TableModule,
        NgIcon,
        BooleanLabelPipe,
        CommonModule,
    ]
})
export class ProductoSelect extends SelectBase<Producto> {
    private productoService = inject(ProductoService);

    productos: Producto[] = [];
    productoSeleccionado!: Producto;

    constructor() {
        super(
            inject(ChangeDetectorRef),
            inject(MessageService),
            inject(ConfirmationService)
        );
    }

    loadItems() {
        this.loadingSelect = true;
        this.productoService.getAll().pipe(
            finalize(() => {
                this.loadingSelect = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: Producto[]) => {
                // console.log(res);
                this.productos = res;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
            }
        });
    }

    select(producto: Producto) {
        this.productoSeleccionado = producto;
        this.submit()
    }

    toModel(): Producto {
        return this.productoSeleccionado;
    }

}
