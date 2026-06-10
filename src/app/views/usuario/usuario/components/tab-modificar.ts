import { Component, EventEmitter, inject, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { UsuarioCompleto } from "@core/interfaces/usuario";
import { UsuarioService } from "@core/services/usuario";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { UsuarioAdicionalClave } from "@/app/constants/adicionales_usuario";

@Component({
    selector: 'app-tab-modificar',
    imports: [
        ReactiveFormsModule,
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
            <button class="btn btn-primary mt-3" type="submit" form="formUsuario">
                Modificar Información
            </button>
        </form>

        <hr class="my-4">

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
                        <button class="btn btn-primary" type="submit">
                            Actualizar
                        </button>
                    </div>
                    <small class="form-text text-muted">
                        Ingresa tu ID de usuario de Discord
                    </small>
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
    protected messageService = inject(MessageService);
    
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

    modificarUsuario(event: any) {
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
                this.usuarioService.update(usuario.id!, usuario).subscribe({
                    next: () => {
                        this.showSuccess('Usuario actualizado', 'Los datos se actualizaron correctamente');
                        this.usuarioModificado.emit();
                    },
                    error: () => {
                        this.showError('Error', 'No se pudo modificar el usuario');
                    }
                });
            }
        });
    }

    modificarAdicionales(event: any) {
        event.preventDefault();
        const discordId = this.formAdicionales.get('urlDiscord')?.value || '';

        this.usuarioService.actualizarAdicional(
            this.usuario.id!,
            UsuarioAdicionalClave.URL_DISCORD,
            discordId
        ).subscribe({
            next: () => {
                this.showSuccess('Discord actualizado', 'El ID de Discord se actualizó correctamente');
                this.usuarioModificado.emit();
            },
            error: () => {
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
