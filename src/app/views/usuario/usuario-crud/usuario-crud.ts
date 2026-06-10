import { getRandomColor } from '@/app/utils/color-utils';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Usuario } from '@core/interfaces/usuario';
import { RolService } from '@core/services/rol';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { Rol } from '@core/interfaces/rol';
import { MultiSelectModule } from 'primeng/multiselect';

export const passwordMatchValidator: ValidatorFn = (form: AbstractControl): ValidationErrors | null => {
  const password = form.get('password')?.value;
  const confirmPass = form.get('confirmPass')?.value;
  return password === confirmPass ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-usuario-crud',
  imports: [
    ReactiveFormsModule,
    ToastModule,
    NgIcon,
    MultiSelectModule,
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './usuario-crud.html',
  styleUrl: './usuario-crud.scss'
})
export class UsuarioCrud extends CrudFormModal<Usuario> implements OnInit {
  private rolService = inject(RolService);
  showPassword: boolean = false

  listaRoles!:Rol[];
  cargandoRoles:boolean=true;

  override ngOnInit(): void {
    super.ngOnInit();

    this.rolService.getAll().subscribe({
      next: (res:any) => {
        this.listaRoles = res;
        this.cargandoRoles = false;
      },
      error: () => this.showError('Error', 'Error al cargar los roles.')
    })
  }

  protected buildForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(''),
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      usuario: new FormControl('', [Validators.required]),
      fechaNacimiento: new FormControl(''),
      color: new FormControl(getRandomColor(), [Validators.required]),
      password: new FormControl('', [Validators.required]),
      confirmPass: new FormControl('', [Validators.required]),
      roles: new FormControl([])
    }, { validators: passwordMatchValidator });
  }

  protected populateForm(data: Usuario): void {
    this.form.patchValue({
      id: data.id,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      usuario: data.usuario,
      fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento).toISOString().split('T')[0] : '',
      color: data.color,
      password: '',
      confirmPass: '',
      roles: data.roles?.map(rol => rol.rolCodigo)
    });
  }

  protected override setupEditMode(): void {
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.form.get('confirmPass')?.clearValidators();
    this.form.get('confirmPass')?.updateValueAndValidity();
  }

  protected toModel(): Usuario {
    const fechaNacimiento = this.get('fechaNacimiento')?.value;
    let usuario: any = {
      id: this.get('id')?.value ?? undefined,
      nombre: this.get('nombre')?.value,
      apellido: this.get('apellido')?.value,
      email: this.get('email')?.value,
      usuario: this.get('usuario')?.value,
      color: this.get('color')?.value,
      password: this.get('password')?.value || undefined,
      roles: this.get('roles')?.value || []
    };
    if (fechaNacimiento) {
      usuario.fechaNacimiento = fechaNacimiento;
    }
    console.log(usuario)
    return usuario;
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
  togglePassword(): void {
    this.showPassword = !this.showPassword
  }
}