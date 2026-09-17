import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { LoadingSpinnerComponent } from '@app/components/index';
import { SelectBase } from '@app/components/select-base/select-base';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { Cliente } from '@core/interfaces/cliente';
import { ClienteService } from '@core/services/cliente';
import { CommonModule } from '@angular/common';
import { BooleanLabelPipe } from '@core/pipes/boolean-label.pipe';

@Component({
    selector: 'app-evento-select',
    templateUrl: './cliente-select.html',
    styleUrl: './cliente-select.scss',
    providers: [MessageService],
    imports: [
        LoadingSpinnerComponent,
        TableModule,
        InputTextModule,
        NgIcon,
        BooleanLabelPipe,
        CommonModule,
    ]
})
export class ClienteSelect extends SelectBase<Cliente> {
    private clienteService = inject(ClienteService);

    clientes: Cliente[] = [];
    clienteSeleccionado!: Cliente;

    constructor() {
        super(
            inject(ChangeDetectorRef),
            inject(MessageService),
            inject(ConfirmationService)
        );
    }

    loadItems() {
        this.loadingSelect = true;
        this.clienteService.getAll().pipe(
            finalize(() => {
                this.loadingSelect = false
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: Cliente[]) => {
                // console.log(res);
                this.clientes = res;
                this.cdr.detectChanges();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los clientes' });
            }
        });
    }

    select(cliente: Cliente) {
        this.clienteSeleccionado = cliente;
        this.submit()
    }

    toModel(): Cliente {
        return this.clienteSeleccionado;
    }

}
