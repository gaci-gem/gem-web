import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Parametro, TIPOS_PARAMETRO, AMBITOS_PARAMETRO } from '@core/interfaces/parametro';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ParametroService } from '@core/services/parametros';

@Component({
  selector: 'app-parametro-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './parametro-crud.html',
  styleUrl: './parametro-crud.scss'
})
export class ParametroCrud extends CrudFormModal<Parametro> {
  private parametroService = inject(ParametroService);

  tiposParametro = TIPOS_PARAMETRO;
  ambitosParametro = AMBITOS_PARAMETRO;

  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(null),
      clave: new FormControl('', [Validators.required]),
      valor: new FormControl('', [Validators.required]),
      tipo: new FormControl('', [Validators.required]),
      ambito: new FormControl('', [Validators.required]),
      descripcion: new FormControl(''),
      editable: new FormControl(true),
    });
  }

  protected populateForm(data: Parametro): void {
    this.form.patchValue({
      id: data.id,
      clave: data.clave,
      valor: data.valor,
      tipo: data.tipo,
      ambito: data.ambito,
      descripcion: data.descripcion,
      editable: data.editable,
    });
  }

  protected override setupEditMode(): void {
    // En modo edición, deshabilitar la clave para no modificarla
    this.get('clave')?.disable();
  }

  protected toModel(): Parametro {
    return {
      id: this.get('id')?.value,
      clave: this.get('clave')?.value,
      valor: this.get('valor')?.value,
      tipo: this.get('tipo')?.value,
      ambito: this.get('ambito')?.value,
      descripcion: this.get('descripcion')?.value,
      editable: this.get('editable')?.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  protected override save(model: Parametro) {
    const { id, createdAt, updatedAt, ...payload } = model;
    return this.modo === 'M'
      ? this.parametroService.update(id ?? '', payload)
      : this.parametroService.create(payload);
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}
