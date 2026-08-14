import { modalConfig } from '@/app/types/modals';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Proyecto } from '@core/interfaces/proyecto';
import { ProyectoService } from '@core/services/proyecto';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-proyecto-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    CommonModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './proyecto-crud.html',
  styleUrl: './proyecto-crud.scss'
})
export class ProyectoCrud extends CrudFormModal<Proyecto> {
  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(''),
      sigla: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      activo: new FormControl(true),
      critico: new FormControl(false),
    });
  }

  protected populateForm(data: Proyecto): void {
    this.form.patchValue({
      id: data.id,
      sigla: data.sigla,
      nombre: data.nombre,
      activo: data.activo,
      critico: data.critico,
    });
  }

  protected override setupEditMode(): void {
  }

  protected toModel(): Proyecto {
    return {
      id: this.get('id')?.value,
      sigla: this.get('sigla')?.value,
      nombre: this.get('nombre')?.value,
      activo: this.get('activo')?.value,
      critico: this.get('critico')?.value,
    };
  }

  private proyectoService = inject(ProyectoService);

  protected override save(model: Proyecto) {
    return this.modo === 'M'
      ? this.proyectoService.update(model.id ?? 0, model)
      : this.proyectoService.create(({ ...model, id: undefined }));
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}


