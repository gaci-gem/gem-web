import { getRandomColor } from '@/app/utils/color-utils';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CrudFormModal } from '@app/components/crud-form-modal/crud-form-modal';
import { Preferencia, Usuario } from '@core/interfaces/usuario';
import { RolService } from '@core/services/rol';
import { NgIcon } from '@ng-icons/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { Rol } from '@core/interfaces/rol';
import { MultiSelectModule } from 'primeng/multiselect';
import { UsuarioService } from '@core/services/usuario';
import { PermisosService } from '@core/services/permisos';
import { UsuarioPreferencias } from '@/app/constants/preferencias_usuario';
import { of, switchMap } from 'rxjs';

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
  private usuarioService = inject(UsuarioService);
  private permisosService = inject(PermisosService);
  private cdr = inject(ChangeDetectorRef);
  showPassword: boolean = false

  listaRoles: Rol[] = [];
  cargandoRoles:boolean=true;

  override ngOnInit(): void {
    super.ngOnInit();

    this.rolService.getAll().subscribe({
      next: (res:any) => {
        this.listaRoles = res;
        this.cargandoRoles = false;
        this.cdr.detectChanges();
      },
      error: () => this.showError('Error', 'Error al cargar los roles.')
    })

    const usuario = this.config.data.item as Usuario | null;
    if (usuario?.id) {
      this.usuarioService.getPreferencias(usuario.id).subscribe({
        next: preferencias => {
          const preferenciaHoras = preferencias.find(
            item => item.clave.trim() === UsuarioPreferencias.RECORDATORIO_HORAS
          );

          this.form.get('recordatorioHoras')?.setValue(Boolean(preferenciaHoras), { emitEvent: false });
          usuario.preferencias = preferencias;
          this.cdr.detectChanges();
        },
        error: () => this.showError('Error', 'Error al cargar las preferencias del usuario.')
      });
    }
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
      roles: new FormControl([]),
      recordatorioHoras: new FormControl(false)
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
      roles: data.roles?.map(rol => rol.rolCodigo) ?? [],
      recordatorioHoras: this.preferenciaActiva(data, UsuarioPreferencias.RECORDATORIO_HORAS)
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
      roles: this.get('roles')?.value || [],
      preferencias: (this.config.data.item?.preferencias ?? [])
        .filter((item: Preferencia) => item.clave !== UsuarioPreferencias.RECORDATORIO_HORAS)
    };
    if (fechaNacimiento) {
      usuario.fechaNacimiento = fechaNacimiento;
    }
    return usuario;
  }

  protected override save(model: Usuario) {
    if (this.modo === 'M') {
      const { password: _password, preferencias: _preferencias, ...payload } = model;
      const preferencias = this.preferenciasActualizadas(model);
      return this.usuarioService.update(model.id ?? '', payload).pipe(
        switchMap(result => preferencias
          ? this.usuarioService.setPreferencias(model.id ?? '', preferencias).pipe(switchMap(() => of(result)))
          : of(result))
      );
    }
    const { id, ...payload } = model;
    return this.usuarioService.create(payload);
  }

  get puedeModificarPreferenciasAdministradas(): boolean {
    return this.permisosService.can('USR.MODIFICAR');
  }

  private preferenciaActiva(usuario: Usuario, clave: string): boolean {
        return Boolean(usuario.preferencias?.some(item => item.clave.trim() === clave));
  }

  private preferenciasActualizadas(model: Usuario): any[] | null {
    if (!this.puedeModificarPreferenciasAdministradas || !model.id) return null;
    const preferencias = (model.preferencias ?? []).map(item => ({ ...item, clave: item.clave.trim() })).filter(item => item.clave !== UsuarioPreferencias.RECORDATORIO_HORAS);
    if (this.get('recordatorioHoras')?.value) {
      preferencias.push({
        usuarioId: model.id,
        clave: UsuarioPreferencias.RECORDATORIO_HORAS,
        descripcion: ''
      });
    }
    return preferencias;
  }

  accion(event: Event) {
    event.preventDefault();
    this.submit();
  }
  togglePassword(): void {
    this.showPassword = !this.showPassword
  }
}
