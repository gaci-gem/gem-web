import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/index';
import { Nota, NotaTipo } from '@core/interfaces/nota';
import { MilkdownEditorComponent } from '@app/components/milkdown-editor/milkdown-editor.component';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NotaService } from '@core/services/nota';

@Component({
  selector: 'app-nota-editor',
  imports: [CommonModule, ReactiveFormsModule, MilkdownEditorComponent, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="form-group mb-3">
        <label for="titulo" class="form-label">Título</label>
        <input 
          id="titulo"
          type="text" 
          formControlName="titulo" 
          class="form-control"
          placeholder="Ingresa el título de la nota">
        @if (form.get('titulo')?.invalid && form.get('titulo')?.touched && modo !== 'V') {
          <div class="text-danger mt-1">
            <small>El título es requerido</small>
          </div>
        }
      </div>
      
      <div class="form-group mb-3">
        <label class="form-label">Contenido</label>
        <milkdown-editor
        class="form-control"
          formControlName="descripcion"
          [config]="editorConfig"
          [showControls]="false"
          [showStatus]="false"
        >
        </milkdown-editor>
        @if (form.get('descripcion')?.invalid && form.get('descripcion')?.touched && modo !== 'V') {
          <div class="text-danger mt-1">
            <small>El contenido es requerido</small>
          </div>
        }
      </div>
      
      <div class="form-actions d-flex gap-2 justify-content-end">
        @if (modo === 'V') {
          <button type="button" (click)="cancel()" class="btn btn-secondary">
            Cerrar
          </button>
        } @else {
          <button type="button" (click)="cancel()" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" [disabled]="form.invalid" class="btn btn-primary">
            {{ modo === 'A' ? 'Crear Nota' : 'Guardar Cambios' }}
          </button>
        }
      </div>
    </form>
  `,
  styleUrl: './nota-editor.scss'
})
export class NotaEditor extends CrudFormModal<Nota> implements OnInit {
  private notaService = inject(NotaService);
  editorConfig = {
    placeholder: 'Escribe el contenido de tu nota aquí...',
    editable: true,
    height: '300px'
  };

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Configurar editor según el modo
    if (this.modo === 'V') {
      this.editorConfig = {
        ...this.editorConfig,
        editable: false
      };
    }
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      titulo: new FormControl('', [Validators.required, Validators.minLength(3)]),
      descripcion: new FormControl('', [Validators.required])
    });
  }

  protected populateForm(data: Nota): void {
    this.form.patchValue({
      titulo: data.titulo,
      descripcion: data.descripcion
    });
  }

  protected toModel(): Nota {
    const formValue = this.form.value;
    
    const nota: any = {
      titulo: formValue.titulo,
      descripcion: formValue.descripcion
    };

    // Solo incluir tipo al crear
    if (this.modo === 'A') {
      nota.tipo = NotaTipo.NOTA;
    }

    // Guardar el id para usarlo en el componente padre, pero no se envía en el body
    if (this.modo === 'M' && this.config.data.item?.id) {
      nota.id = this.config.data.item.id;
    }

    return nota;
  }

  protected override save(model: Nota) {
    return this.modo === 'M'
      ? this.notaService.update(model.id!, model)
      : this.notaService.create(model);
  }
}
