import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Entorno } from '@core/interfaces/entorno';
import { EntornoService } from '@core/services/entorno';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-entornos-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './entornos-crud.html',
  styleUrl: './entornos-crud.scss'
})
export class EntornosCrud extends CrudFormModal<Entorno> {
  private entornoService = inject(EntornoService);

  protected buildForm(): FormGroup {
    return new FormGroup({
      codigo: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      activo: new FormControl(true, []),
    });
  }

  protected populateForm(data: Entorno): void {
    this.form.patchValue({
      codigo: data.codigo,
      nombre: data.nombre,
      activo: data.activo
    });
  }

  protected override setupEditMode(): void {
  }

  protected toModel(): Entorno {
    return {
      codigo: this.get('codigo')?.value,
      nombre: this.get('nombre')?.value,
      activo: this.get('activo')?.value,
    };
  }

  protected override save(model: Entorno) {
    return this.modo === 'M'
      ? this.entornoService.update(model.codigo, model)
      : this.entornoService.create(model);
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}

