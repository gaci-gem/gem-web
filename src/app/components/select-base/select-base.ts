import { PermisoAccion } from '@/app/types/permisos';
import { EventoDrawerComponent } from '@/app/views/evento/evento-drawer/evento-drawer';
import { Component, HostListener, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { LoadingService } from '@core/services/loading.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-select-base',
  imports: [
  ],
  template: `
  `,
})
export abstract class SelectBase<T> {
  protected modalSel = inject(DynamicDialogRef);
  protected loadingService = inject(LoadingService);
  protected permisos: PermisoAccion[] = [];

  loadingSelect: boolean = false;

  constructor(
    protected cdr: ChangeDetectorRef,
    protected messageService: MessageService,
    protected confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  protected abstract loadItems(): void;
  protected abstract toModel(): any;
  protected abstract select(item: T): any;

  submit(): void {
    const model = this.toModel();
    this.modalSel.close(model);
  }

  @HostListener('keydown', ['$event'])
  protected onSelectorKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;

    // DynamicDialog's document handler must not close the CRUD dialog behind us.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.modalSel.close();
  }

  protected afterChange(mensaje: string = 'Cambios guardados correctamente.'): void {
    this.loadItems();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje
    });
  }

  protected showError(mensaje: string = 'Ocurrió un error inesperado.'): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje
    });
  }

  protected showSuccess(mensaje: string = 'Ocurrió un error inesperado.'): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje
    });
  }
  getEventValue($event:any) :string {
    return $event.target.value;
  } 

}


