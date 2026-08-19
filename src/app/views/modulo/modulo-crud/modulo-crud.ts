import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Modulo } from '@core/interfaces/modulo';
import { ModuloService } from '@core/services/modulo';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-modulo-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './modulo-crud.html',
  styleUrl: './modulo-crud.scss'
})
export class ModuloCrud extends CrudFormModal<Modulo> implements OnInit{
  private moduloService = inject(ModuloService);

  modulos!:Modulo[];

  override ngOnInit(): void {
    super.ngOnInit();

    this.moduloService.getAll().subscribe({
      next: (res:any) => {
        this.modulos = res;
      },
      error: () => this.showError('Error', 'Error al cargar los roles.')
    })
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      codigo: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      padreCodigo: new FormControl('', ),
      activo: new FormControl(true, []),
    });
  }

  protected populateForm(data: Modulo): void {
    this.form.patchValue({
      codigo: data.codigo,
      nombre: data.nombre,
      padreCodigo: data.padreCodigo,
      activo: data.activo
    });
  }

  protected override setupEditMode(): void {
  }

  protected toModel(): Modulo {
    const padreCodigo = this.get('padreCodigo')?.value;
    return {
      codigo: this.get('codigo')?.value,
      nombre: this.get('nombre')?.value,
      padreCodigo: padreCodigo === '' ? null : padreCodigo,
      activo: this.get('activo')?.value,
    };
  }

  protected override save(model: Modulo) {
    return this.modo === 'M'
      ? this.moduloService.update(model.codigo, model)
      : this.moduloService.create(model);
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}

