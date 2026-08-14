import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Categoria } from '@core/interfaces/registro-hora';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RegistroHoraService } from '@core/services/registro-hora';

@Component({
  selector: 'app-categoria-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './categoria-crud.html',
  styleUrl: './categoria-crud.scss'
})
export class CategoriaCrud extends CrudFormModal<Categoria> {
  private registroHoraService = inject(RegistroHoraService);

  protected buildForm(): FormGroup {
    return new FormGroup({
      codigo: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      descripcion: new FormControl('', [Validators.required]),
      color: new FormControl('#607D8B', [Validators.required]),
      activo: new FormControl(true),
    });
  }

  protected populateForm(data: Categoria): void {
    this.form.patchValue({
      codigo: data.codigo,
      descripcion: data.descripcion,
      color: data.color,
      activo: data.activo,
    });
  }

  protected override setupEditMode(): void {
    // En modo edición, el código no se puede cambiar (es la clave primaria)
    this.get('codigo')?.disable();
  }

  protected toModel(): Categoria {
    return {
      codigo: this.get('codigo')?.value,
      descripcion: this.get('descripcion')?.value,
      color: this.get('color')?.value,
      activo: this.get('activo')?.value,
    };
  }

  protected override save(model: Categoria) {
    return this.modo === 'M'
      ? this.registroHoraService.updateCategoria(model.codigo, model)
      : this.registroHoraService.createCategoria(model);
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}
