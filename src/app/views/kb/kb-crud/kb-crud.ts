import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { kb } from '@core/interfaces/kb';
import { KbService } from '@core/services/kb';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { CatalogoSelect } from '@app/components/catalogo-select/catalogo-select';
import { TipoCatalogo } from '@/app/constants/catalogo-config';

@Component({
  selector: 'app-kb-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    CommonModule,
    CatalogoSelect,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './kb-crud.html',
  styleUrl: './kb-crud.scss'
})
export class KbCrud extends CrudFormModal<kb> implements OnInit {
  private kbService = inject(KbService);
  private cdr = inject(ChangeDetectorRef);

  kbsDisponibles: kb[] = [];
  
  // Tipos de catálogo (para usar en el template)
  readonly TipoCatalogo = TipoCatalogo;

  override ngOnInit(): void {
    super.ngOnInit();
    this.cargarKbsDisponibles();
    this.setupMigradaListener();
  }

  cargarKbsDisponibles(): void {
    // Cargar KBs para el select de migración
    this.kbService.findAll({ activo: true }).subscribe({
      next: (res) => {
        this.kbsDisponibles = res;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error', 'Error al cargar las KBs.')
    });
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(null),
      nombre: new FormControl('', [Validators.required]),
      descripcion: new FormControl(''),
      plataforma: new FormControl('', [Validators.required]),
      tecnologia: new FormControl('', [Validators.required]),
      version_plataforma: new FormControl(''),
      compilador: new FormControl('', [Validators.required]),
      tipo: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      uso_actual: new FormControl('', [Validators.required]),
      migrada: new FormControl(false),
      migradaDesdeKbId: new FormControl(null),
      activo: new FormControl(true, [Validators.required])
    });
  }

  protected populateForm(data: kb): void {
    this.form.patchValue({
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      plataforma: data.plataforma,
      tecnologia: data.tecnologia,
      version_plataforma: data.version_plataforma,
      compilador: data.compilador,
      tipo: data.tipo,
      estado: data.estado,
      uso_actual: data.uso_actual,
      migrada: data.migrada,
      migradaDesdeKbId: data.migradaDesdeKbId,
      activo: data.activo
    });
  }

  protected override setupEditMode(): void {
    // Configuración adicional en modo edición si es necesaria
  }

  protected toModel(): kb {
    const formValue = this.form.value;
    const model: any = {
      nombre: formValue.nombre,
      descripcion: formValue.descripcion,
      plataforma: formValue.plataforma,
      tecnologia: formValue.tecnologia,
      version_plataforma: formValue.version_plataforma,
      compilador: formValue.compilador,
      tipo: formValue.tipo,
      estado: formValue.estado,
      uso_actual: formValue.uso_actual,
      migrada: formValue.migrada,
      migradaDesdeKbId: formValue.migrada ? Number(formValue.migradaDesdeKbId) : null,
      activo: formValue.activo
    };
    
    // Solo incluir id en modo alta (para que el componente padre pueda accederlo si es necesario)
    // En modo modificación, el id se pasa como parámetro separado al endpoint
    if (this.modo === 'A') {
      model.id = formValue.id;
    } else {
      // Guardar el id para que el componente padre pueda usarlo
      model.id = formValue.id;
    }
    
    return model;
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }

  /**
   * Configurar listener para habilitar/deshabilitar el campo migradaDesdeKbId
   */
  private setupMigradaListener(): void {
    const migradaControl = this.get('migrada');
    const migradaDesdeControl = this.get('migradaDesdeKbId');
    
    if (!migradaControl || !migradaDesdeControl) return;

    // Estado inicial
    if (!migradaControl.value) {
      migradaDesdeControl.disable();
    }

    // Listener para cambios
    migradaControl.valueChanges.subscribe(migrada => {
      if (migrada) {
        migradaDesdeControl.enable();
      } else {
        migradaDesdeControl.setValue(null);
        migradaDesdeControl.disable();
      }
    });
  }
}
