import { Component, inject } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { showSuccess, showError, showWarn, showInfo } from '../../utils/message-utils';
import { Observable, finalize } from 'rxjs';

@Component({
  selector: 'app-crud-form-modal',
  imports: [],
  templateUrl: './crud-form-modal.html',
  styleUrl: './crud-form-modal.scss'
})
export abstract class CrudFormModal<T> {
  protected ref = inject(DynamicDialogRef);
  protected config = inject(DynamicDialogConfig);
  protected messageService = inject(MessageService);

  showSuccess(summary: string, detail: string) {
    showSuccess(this.messageService, summary, detail);
  }

  showError(summary: string, detail: string) {
    showError(this.messageService, summary, detail);
  }

  showWarn(summary: string, detail: string) {
    showWarn(this.messageService, summary, detail);
  }

  showInfo(summary: string, detail: string) {
    showInfo(this.messageService, summary, detail);
  }

  form!: FormGroup;
  modo!: 'A' | 'M' | 'V';
  submitting = false;

  ngOnInit(): void {
    this.modo = this.config.data.modo;
    const data = this.config.data.item as T | null;

    this.form = this.buildForm();

    if (data) this.populateForm(data);

    if (this.modo === 'M') this.setupEditMode();
    if (this.modo === 'V') this.setupViewMode();
  }

  protected abstract buildForm(): FormGroup;
  protected abstract populateForm(data: T): void;
  protected abstract toModel(): any;

  /** Return the persistence request, or null to keep the legacy close-payload behavior. */
  protected save(_model: any): Observable<unknown> | null {
    return null;
  }

  protected successMessage(): { summary: string; detail: string } | null {
    return null;
  }

  protected setupEditMode(): void {
    // Por defecto nada, pero overrideable
  }

  protected setupViewMode(): void {
    // Por defecto deshabilita todos los campos
    this.form.disable();
  }

  submit(): void {
    if (this.modo === 'V') return;

    if (!this.form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor completá todos los campos requeridos correctamente'
      });
      return;
    }

    const model = this.toModel();
    const request = this.save(model);
    if (!request) {
      this.ref.close(model);
      return;
    }

    this.submitting = true;
    request.pipe(finalize(() => this.submitting = false)).subscribe({
      next: (result) => {
        const message = this.successMessage();
        if (message) this.showSuccess(message.summary, message.detail);
        this.ref.close({ changed: true, result });
      },
      error: (error) => {
        this.showError('Error', this.getRequestError(error));
      },
    });
  }

  protected getRequestError(error: any): string {
    const message = error?.error?.message ?? error?.message;
    return Array.isArray(message) ? message.join(', ') : message ||
      (this.modo === 'M' ? 'Error al modificar el registro.' : 'Error al crear el registro.');
  }

  cancel(): void {
    this.ref.close(null);
  }

  get(campo: string): AbstractControl | null {
    return this.form.get(campo);
  }

  onUppercaseInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const upperValue = input.value.toUpperCase();
    input.value = upperValue;
    this.get(controlName)?.setValue(upperValue, { emitEvent: false });
  }

  // Para mostrar mensajes, usar las funciones importadas:
  // showSuccess(this.messageService, summary, detail);
  // showError(this.messageService, summary, detail);
  // showWarn(this.messageService, summary, detail);
  // showInfo(this.messageService, summary, detail);

}
