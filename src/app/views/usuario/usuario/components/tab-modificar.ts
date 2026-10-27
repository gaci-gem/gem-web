import { Component, EventEmitter, inject, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { FormsModule } from '@angular/forms';
import { UsuarioCompleto } from "@core/interfaces/usuario";
import { UsuarioPreferencias } from '@/app/constants/preferencias_usuario';
import { UsuarioService } from "@core/services/usuario";
import { PermisosService } from '@core/services/permisos';
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { UsuarioAdicionalClave } from "@/app/constants/adicionales_usuario";
import { finalize } from 'rxjs';

@Component({
    selector: 'app-tab-modificar',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        ConfirmDialogModule,
    ],
    template: `
        <form [formGroup]="formUsuario" (ngSubmit)="modificarUsuario($event)" id="formUsuario">
            <h5 class="mb-3">Información Personal</h5>
            <div class="row">
                <div class="col-md-6">
                    <label for="nombre" class="form-label">Nombre</label>
                    <input
                        id="nombre"
                        type="text"
                        formControlName="nombre"
                        class="form-control"
                        placeholder="nombre"
                        required
                    />
                    @if (get('nombre')?.invalid && get('nombre')?.touched) {
                        <div class="invalid-feedback">Debe ingresar un nombre.</div>
                    }
                </div>

                <div class="col-md-6">
                    <label for="apellido" class="form-label">Apellido</label>
                    <input
                        id="apellido"
                        type="text"
                        formControlName="apellido"
                        class="form-control"
                        placeholder="apellido"
                        required
                    />
                    @if (get('apellido')?.invalid && get('apellido')?.touched) {
                        <div class="invalid-feedback">Debe ingresar un apellido.</div>
                    }
                </div>

                <div class="col-md-6">
                    <label for="email" class="form-label">Email</label>
                    <input
                        id="email"
                        type="email"
                        formControlName="email"
                        class="form-control"
                        placeholder="email"
                        required
                    />
                    @if (get('email')?.invalid && get('email')?.touched) {
                        <div class="invalid-feedback">Debe ingresar un email válido.</div>
                    }
                </div>

                <div class="col-md-4">
                    <label for="fechaNacimiento" class="form-label">Fecha de nacimiento</label>
                    <input
                        id="fechaNacimiento"
                        type="date"
                        formControlName="fechaNacimiento"
                        class="form-control"
                    />
                </div>

                <div class="col-md-4">
                    <label for="color" class="form-label">Color</label>
                    <input
                        id="color"
                        type="color"
                        formControlName="color"
                        class="form-control form-control-color"
                        required
                    />
                    @if (get('color')?.invalid && get('color')?.touched) {
                        <div class="invalid-feedback">Debe ingresar un color válido.</div>
                    }
                </div>
            </div>
            <button class="btn btn-primary mt-3" type="submit" form="formUsuario" [disabled]="guardandoUsuario" [attr.aria-busy]="guardandoUsuario">
                {{ guardandoUsuario ? 'Guardando...' : 'Modificar Información' }}
            </button>
            @if (estadoUsuario) { <div class="small mt-2" [class.text-success]="estadoUsuario === 'guardado'" [class.text-danger]="estadoUsuario === 'error'" role="status">{{ estadoUsuario === 'guardado' ? 'Información personal guardada.' : 'No se pudo guardar la información personal.' }}</div> }
        </form>

        <hr class="my-4">

        @if (puedeModificarPreferenciasAdministradas) {
            <section aria-labelledby="preferenciasAdministradasTitulo" class="mb-4">
                <h5 id="preferenciasAdministradasTitulo" class="mb-3">Preferencias administradas</h5>
                <p class="text-muted small">Configurá los recordatorios que recibirá este usuario.</p>
                @for (preferencia of preferenciasAdministradas; track preferencia.clave) {
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" [id]="preferencia.clave" [checked]="preferenciaActiva(preferencia.clave)" (change)="cambiarPreferencia(preferencia.clave, $event)">
                        <label class="form-check-label" [for]="preferencia.clave">{{ preferencia.label }}</label>
                    </div>
                }
                @if (estadoPreferencias) { <div class="small mt-2" [class.text-success]="estadoPreferencias === 'guardado'" [class.text-danger]="estadoPreferencias === 'error'" role="status">{{ estadoPreferencias === 'guardado' ? 'Preferencias guardadas.' : 'No se pudieron guardar las preferencias.' }}</div> }
            </section>
        }

        <form [formGroup]="formAdicionales" (ngSubmit)="modificarAdicionales($event)" id="formAdicionales">
            <h5 class="mb-3">Información Adicional</h5>
            <div class="row">
                <div class="col-md-12">
                    <label for="urlDiscord" class="form-label">Discord</label>
                    <div class="input-group">
                        <span class="input-group-text">https://discordapp.com/users/</span>
                        <input
                            id="urlDiscord"
                            type="text"
                            formControlName="urlDiscord"
                            class="form-control"
                            placeholder="ID de Discord"
                        />
                        <button class="btn btn-primary" type="submit" [disabled]="guardandoAdicional" [attr.aria-busy]="guardandoAdicional">
                            {{ guardandoAdicional ? 'Actualizando...' : 'Actualizar' }}
                        </button>
                    </div>
                    <small class="form-text text-muted">
                        Ingresa tu ID de usuario de Discord
                    </small>
                    @if (estadoAdicional) { <div class="small mt-2" [class.text-success]="estadoAdicional === 'guardado'" [class.text-danger]="estadoAdicional === 'error'" role="status">{{ estadoAdicional === 'guardado' ? 'Discord actualizado.' : 'No se pudo actualizar el ID de Discord.' }}</div> }
                </div>
            </div>
        </form>
    `,
})
export class TabModificar implements OnInit {
    @Input() usuario!: UsuarioCompleto;
    @Output() usuarioModificado = new EventEmitter<void>()

    private fb = inject(FormBuilder);
    protected confirmationService = inject(ConfirmationService);
    private usuarioService = inject(UsuarioService);
    private permisosService = inject(PermisosService);
    protected messageService = inject(MessageService);
    guardandoUsuario = false;
    guardandoAdicional = false;
    estadoUsuario: 'guardado' | 'error' | null = null;
    estadoAdicional: 'guardado' | 'error' | null = null;
    estadoPreferencias: 'guardado' | 'error' | null = null;
    readonly preferenciasAdministradas = [
        { clave: UsuarioPreferencias.RECORDATORIO_HORAS, label: 'Recordatorio de carga de horas' },
    ] as const;

    get puedeModificarPreferenciasAdministradas(): boolean {
        return this.permisosService.can('USR.MODIFICAR');
    }
    
    formUsuario = this.fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        color: [''],
        fechaNacimiento: ['']
    });

    formAdicionales = this.fb.group({
        urlDiscord: ['']
    });
    
    ngOnInit(): void {
        if (this.usuario) {
            this.populateForm();
            this.populateAdicionales();
        }
    }
    
    private populateForm(): void {
        this.formUsuario.patchValue({
            nombre: this.usuario.nombre,
            apellido: this.usuario.apellido,
            email: this.usuario.email,
            color: this.usuario.color,
            fechaNacimiento: this.usuario.fechaNacimiento ? new Date(this.usuario.fechaNacimiento).toISOString().split('T')[0] : '',
        })
    }

    private populateAdicionales(): void {
        const urlDiscord = this.usuario.adicionales?.find(
            a => a.clave === UsuarioAdicionalClave.URL_DISCORD
        );
        
        if (urlDiscord && urlDiscord.valor) {
            this.formAdicionales.patchValue({
                urlDiscord: urlDiscord.valor
            });
        }
    }

    preferenciaActiva(clave: string): boolean {
        const preferencia = (this.usuario?.preferencias ?? []).find(preferencia => preferencia.clave === clave);
        if (clave === UsuarioPreferencias.RECORDATORIO_HORAS && !preferencia) return true;
        return Boolean(preferencia && preferencia.descripcion !== 'false');
    }

    cambiarPreferencia(clave: string, event: Event): void {
        if (!this.usuario?.id) return;
        const activa = (event.target as HTMLInputElement).checked;
        const preferencias = [...(this.usuario.preferencias ?? [])].filter(preferencia => preferencia.clave !== clave);
        if (activa || clave === UsuarioPreferencias.RECORDATORIO_HORAS) {
            preferencias.push({ usuarioId: this.usuario.id, clave, descripcion: activa ? '' : 'false' });
        }
        this.usuarioService.setPreferencias(this.usuario.id, preferencias).subscribe({
            next: guardadas => {
                this.usuario.preferencias = guardadas;
                this.estadoPreferencias = 'guardado';
            },
            error: () => this.estadoPreferencias = 'error',
        });
    }

    modificarUsuario(event: any) {
        event?.preventDefault();
        if (this.guardandoUsuario || this.formUsuario.invalid) {
            this.formUsuario.markAllAsTouched();
            return;
        }
        const fechaNacimiento = this.formUsuario.get('fechaNacimiento')?.value;
        let usuario: any = {
            id: this.usuario.id,
            nombre: this.formUsuario.get('nombre')?.value ?? this.usuario.nombre,
            apellido: this.formUsuario.get('apellido')?.value ?? this.usuario.apellido,
            email: this.formUsuario.get('email')?.value ?? this.usuario.email,
            color: this.formUsuario.get('color')?.value ?? this.usuario.color,
            usuario: this.usuario.usuario,
        };
        if (fechaNacimiento) {
            usuario.fechaNacimiento = fechaNacimiento;
        }
        this.confirmationService.confirm({
            message: '¿Está seguro que desea modificar los datos del usuario?',
            header: 'Confirmar modificación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.guardandoUsuario) return;
                this.guardandoUsuario = true;
                this.estadoUsuario = null;
                this.usuarioService.update(usuario.id!, usuario).pipe(finalize(() => this.guardandoUsuario = false)).subscribe({
                    next: () => {
                        this.estadoUsuario = 'guardado';
                        this.showSuccess('Usuario actualizado', 'Los datos se actualizaron correctamente');
                        this.usuarioModificado.emit();
                    },
                    error: () => {
                        this.estadoUsuario = 'error';
                        this.showError('Error', 'No se pudo modificar el usuario');
                    }
                });
            }
        });
    }

    modificarAdicionales(event: any) {
        event.preventDefault();
        if (this.guardandoAdicional) return;
        const discordId = this.formAdicionales.get('urlDiscord')?.value || '';

        this.guardandoAdicional = true;
        this.estadoAdicional = null;
        this.usuarioService.actualizarAdicional(
            this.usuario.id!,
            UsuarioAdicionalClave.URL_DISCORD,
            discordId
        ).pipe(finalize(() => this.guardandoAdicional = false)).subscribe({
            next: () => {
                this.estadoAdicional = 'guardado';
                this.showSuccess('Discord actualizado', 'El ID de Discord se actualizó correctamente');
                this.usuarioModificado.emit();
            },
            error: () => {
                this.estadoAdicional = 'error';
                this.showError('Error', 'No se pudo actualizar el ID de Discord');
            }
        });
    }
    
    get(campo: string) {
        return this.formUsuario.get(campo);
    }
    
    protected showSuccess(summary: string, detail: string) {
        this.messageService.add({ severity: 'success', summary, detail });
    }

    protected showError(summary: string, detail: string) {
        this.messageService.add({ severity: 'error', summary, detail });
    }
}
