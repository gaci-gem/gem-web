import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { NovedadService } from '@core/services/novedad';
import { RolService } from '@core/services/rol';
import { UsuarioService } from '@core/services/usuario';
import { Novedad, NovedadTipo, CreateNovedadDto, RecipientGroup } from '@core/interfaces/novedad';
import { NgIcon } from '@ng-icons/core';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-novedad-create-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Título -->
      <div class="form-group mb-3">
        <label for="titulo" class="form-label">Título</label>
        <input
          id="titulo"
          type="text"
          formControlName="titulo"
          class="form-control"
          maxlength="255"
          placeholder="Ingresá el título de la novedad"
        />
        @if (form.get('titulo')?.invalid && form.get('titulo')?.touched) {
          <div class="text-danger mt-1">
            <small>El título es requerido</small>
          </div>
        }
      </div>

      <!-- Contenido -->
      <div class="form-group mb-3">
        <label for="contenido" class="form-label">Contenido</label>
        <textarea
          id="contenido"
          formControlName="contenido"
          class="form-control"
          rows="4"
          placeholder="Ingresá el contenido de la novedad"
        ></textarea>
        @if (form.get('contenido')?.invalid && form.get('contenido')?.touched) {
          <div class="text-danger mt-1">
            <small>El contenido es requerido</small>
          </div>
        }
      </div>

      <!-- Tipo -->
      <div class="form-group mb-3">
        <label class="form-label">Tipo</label>
        <p-select
          formControlName="tipo"
          [options]="tipoOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccioná un tipo"
          styleClass="w-100"
        />
        @if (form.get('tipo')?.invalid && form.get('tipo')?.touched) {
          <div class="text-danger mt-1">
            <small>El tipo es requerido</small>
          </div>
        }
      </div>

      <!-- Fecha de validez -->
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="validezDesde" class="form-label">Validez desde</label>
          <p-datepicker
            formControlName="validezDesde"
            [iconDisplay]="'input'"
            [showIcon]="true"
            inputId="validezDesde"
            placeholder="Desde"
            styleClass="w-100"
          />
        </div>
        <div class="col-md-6">
          <label for="validezHasta" class="form-label">Validez hasta</label>
          <p-datepicker
            formControlName="validezHasta"
            [iconDisplay]="'input'"
            [showIcon]="true"
            inputId="validezHasta"
            placeholder="Hasta"
            styleClass="w-100"
          />
        </div>
      </div>

      <!-- Destinatarios -->
      <div class="mb-3">
        <label class="form-label">Destinatarios</label>
        <div class="d-flex gap-3 mb-2">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              formControlName="recipientType"
              id="recipientAll"
              value="ALL"
            />
            <label class="form-check-label" for="recipientAll">Todos los usuarios</label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              formControlName="recipientType"
              id="recipientRole"
              value="BY_ROLE"
            />
            <label class="form-check-label" for="recipientRole">Por rol</label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              formControlName="recipientType"
              id="recipientUser"
              value="BY_USER"
            />
            <label class="form-check-label" for="recipientUser">Por usuario</label>
          </div>
        </div>

        @if (form.get('recipientType')?.value === 'BY_ROLE') {
          <p-multiSelect
            formControlName="selectedRoles"
            [options]="roles"
            optionLabel="descripcion"
            optionValue="codigo"
            placeholder="Seleccioná roles"
            styleClass="w-100"
            [showToggleAll]="true"
          />
        }

        @if (form.get('recipientType')?.value === 'BY_USER') {
          <p-multiSelect
            formControlName="selectedUsers"
            [options]="usuarios"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccioná usuarios"
            styleClass="w-100"
            [showToggleAll]="true"
          />
        }
      </div>

      <!-- Notificaciones -->
      <div class="mb-3">
        <label class="form-label">Notificaciones</label>
        <div class="d-flex gap-4">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              formControlName="enviarEmail"
              id="enviarEmail"
            />
            <label class="form-check-label" for="enviarEmail">Enviar email</label>
          </div>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              formControlName="enviarDiscord"
              id="enviarDiscord"
            />
            <label class="form-check-label" for="enviarDiscord">Enviar Discord</label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-2 justify-content-end">
        <button type="button" (click)="cancel()" class="btn btn-secondary">
          Cancelar
        </button>
        <button type="submit" [disabled]="form.invalid || submitting" class="btn btn-primary">
          @if (submitting) {
            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
          }
          Crear Novedad
        </button>
      </div>
    </form>
  `,
})
export class NovedadCreateModal extends CrudFormModal<Novedad> implements OnInit {
  private novedadService = inject(NovedadService);
  private rolService = inject(RolService);
  private usuarioService = inject(UsuarioService);

  submitting = false;
  roles: any[] = [];
  usuarios: any[] = [];

  tipoOptions = [
    { label: 'Común', value: NovedadTipo.COMUN },
    { label: 'Aviso', value: NovedadTipo.AVISO },
    { label: 'Urgencia', value: NovedadTipo.URGENCIA },
  ];

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadRoles();
    this.loadUsuarios();
  }

  private loadRoles(): void {
    this.rolService.getAll().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: () => {
        this.showError('Error', 'No se pudieron cargar los roles');
      },
    });
  }

  private loadUsuarios(): void {
    this.usuarioService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: () => {
        this.showError('Error', 'No se pudieron cargar los usuarios');
      },
    });
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      titulo: new FormControl('', [Validators.required, Validators.maxLength(255)]),
      contenido: new FormControl('', [Validators.required]),
      tipo: new FormControl<NovedadTipo | null>(null, [Validators.required]),
      validezDesde: new FormControl<Date | null>(null),
      validezHasta: new FormControl<Date | null>(null),
      recipientType: new FormControl('ALL'),
      selectedRoles: new FormControl<string[]>([]),
      selectedUsers: new FormControl<string[]>([]),
      enviarEmail: new FormControl(false),
      enviarDiscord: new FormControl(false),
    });
  }

  protected populateForm(data: Novedad): void {
    this.form.patchValue({
      titulo: data.titulo,
      contenido: data.contenido,
      tipo: data.tipo,
      validezDesde: data.validezDesde ? new Date(data.validezDesde) : null,
      validezHasta: data.validezHasta ? new Date(data.validezHasta) : null,
      enviarEmail: data.enviarEmail,
      enviarDiscord: data.enviarDiscord,
    });
  }

  protected toModel(): CreateNovedadDto {
    const v = this.form.value;

    const recipients: RecipientGroup[] = [];

    if (v.recipientType === 'ALL') {
      recipients.push({ tipo: 'ALL' });
    } else if (v.recipientType === 'BY_ROLE') {
      recipients.push({ tipo: 'BY_ROLE', roles: v.selectedRoles || [] });
    } else if (v.recipientType === 'BY_USER') {
      recipients.push({ tipo: 'BY_USER', usuarios: v.selectedUsers || [] });
    }

    return {
      titulo: v.titulo,
      contenido: v.contenido,
      tipo: v.tipo,
      validezDesde: v.validezDesde ? (v.validezDesde as Date).toISOString() : undefined,
      validezHasta: v.validezHasta ? (v.validezHasta as Date).toISOString() : undefined,
      enviarEmail: v.enviarEmail ?? false,
      enviarDiscord: v.enviarDiscord ?? false,
      recipients,
    };
  }

  override submit(): void {
    if (!this.form.valid) {
      this.showError('Formulario inválido', 'Por favor completá todos los campos requeridos correctamente');
      return;
    }

    const dto = this.toModel();
    this.submitting = true;

    this.novedadService
      .create(dto)
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe({
        next: (created) => {
          this.showSuccess('Éxito', 'Novedad creada correctamente');
          this.ref.close(created);
        },
        error: (err) => {
          this.showError('Error', err?.error?.message || 'No se pudo crear la novedad');
        },
      });
  }
}
