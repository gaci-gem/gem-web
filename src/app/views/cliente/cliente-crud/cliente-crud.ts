import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Cliente } from '@core/interfaces/cliente';
import { Proyecto } from '@core/interfaces/proyecto';
import { ProyectoService } from '@core/services/proyecto';
import { ClienteService } from '@core/services/cliente';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cliente-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    MultiSelectModule,
    CommonModule
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './cliente-crud.html',
  styleUrl: './cliente-crud.scss'
})
export class ClienteCrud extends CrudFormModal<Cliente> {
  private proyectoService = inject(ProyectoService);
  private clienteService = inject(ClienteService);
  private cdr = inject(ChangeDetectorRef);

  proyectos: Proyecto[] = [];
  
  private dataLoadedCount = 0;
  private totalDataToLoad = 1;

  override ngOnInit(): void {
    super.ngOnInit();

    this.proyectoService.getAll().subscribe({
      next: (res: any) => {
        this.proyectos = res;
        this.cdr.detectChanges();
        this.checkAndSetupEditMode();
      }
    });
  }

  private checkAndSetupEditMode() {
    this.dataLoadedCount++;
    if (this.dataLoadedCount === this.totalDataToLoad && this.modo === 'M') {
      this.setupEditMode();
      this.cdr.detectChanges();
    }
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(''),
      sigla: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required]),
      activo: new FormControl(true),
      proyectoIds: new FormControl([]),
    });
  }

  protected populateForm(data: Cliente): void {
    console.log('Populating form with data:', data);
    
    // Extraer los IDs de los proyectos desde la relación muchos a muchos
    let proyectoIds: number[] = [];
    if (data.proyectoIds && data.proyectoIds.length > 0) {
      // Si viene proyectoIds directamente
      proyectoIds = data.proyectoIds;
    } else if (data.proyectos && data.proyectos.length > 0) {
      // Si viene el array de relaciones, extraer los proyectoId
      proyectoIds = data.proyectos.map(p => p.proyectoId);
    }
    
    console.log('Proyecto IDs extracted:', proyectoIds);
    
    this.form.patchValue({
      id: data.id,
      sigla: data.sigla,
      nombre: data.nombre,
      activo: data.activo,
      proyectoIds: proyectoIds,
    });
  }

  protected override setupEditMode(): void {
  }

  protected toModel(): Cliente {
    return {
      id: this.get('id')?.value,
      sigla: this.get('sigla')?.value,
      nombre: this.get('nombre')?.value,
      activo: this.get('activo')?.value,
      proyectoIds: this.get('proyectoIds')?.value || [],
    };
  }

  protected override save(model: Cliente) {
    return this.modo === 'M'
      ? this.clienteService.update(model.id ?? 0, model)
      : this.clienteService.create(({ ...model, id: undefined }));
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
}


