import { Component, inject, Input, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { UsuarioCompleto } from "@core/interfaces/usuario";
import { UsuarioService } from "@core/services/usuario";
import { NgIcon } from "@ng-icons/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { finalize } from 'rxjs';

@Component({
    selector: 'app-tab-seguridad',
    imports: [
        NgIcon,
        ReactiveFormsModule,
        ConfirmDialogModule,
    ],
    template: `
        <form [formGroup]="formPassword" (ngSubmit)="cambiarPassword()" id="formPassword">
            <div class="row">
                <div class="col-md-12">
                    <label for="contrasenaActual" class="form-label">Contraseña actual</label>
                    <div class="input-group">
                        <input
                            [type]="showPasswordActual ? 'text' : 'password'"
                            id="contrasenaActual"
                            formControlName="contrasenaActual"
                            class="form-control"
                            placeholder="Contraseña actual"
                            required
                        />
                        <button
                            class="btn btn-light btn-icon"
                            type="button"
                            (click)="togglePassword('actual')"
                            [disabled]="cambiandoPassword"
                        >
                            <ng-icon
                                name="tablerEye"
                                [class.d-block]="showPasswordActual"
                                [class.d-none]="!showPasswordActual"
                            ></ng-icon>
                            <ng-icon
                                name="tablerEyeClosed"
                                [class.d-block]="!showPasswordActual"
                                [class.d-none]="showPasswordActual"
                            ></ng-icon>
                        </button>
                    </div>
                    @if (formPassword.get('contrasenaActual')?.invalid && formPassword.get('contrasenaActual')?.touched) {
                        <div class="invalid-feedback">Ingrese su contraseña actual.</div>
                    }
                </div>
                <div class="col-md-12">
                    <label for="nuevaContrasena" class="form-label">Nueva contraseña</label>
                    <div class="input-group">
                        <input
                            [type]="showPasswordNueva ? 'text' : 'password'"
                            id="nuevaContrasena"
                            formControlName="nuevaContrasena"
                            class="form-control"
                            placeholder="Nueva contraseña"
                            required
                        />
                        <button
                            class="btn btn-light btn-icon"
                            type="button"
                            (click)="togglePassword('nueva')"
                            [disabled]="cambiandoPassword"
                        >
                            <ng-icon
                                name="tablerEye"
                                [class.d-block]="showPasswordNueva"
                                [class.d-none]="!showPasswordNueva"
                            ></ng-icon>
                            <ng-icon
                                name="tablerEyeClosed"
                                [class.d-block]="!showPasswordNueva"
                                [class.d-none]="showPasswordNueva"
                            ></ng-icon>
                        </button>
                    </div>
                    @if (formPassword.get('nuevaContrasena')?.invalid && formPassword.get('nuevaContrasena')?.touched) {
                        <div class="invalid-feedback">Ingrese la nueva contraseña.</div>
                    }
                </div>
                <div class="col-md-12">
                    <label for="passwordConfirm" class="form-label">Confirmar nueva contraseña</label>
                    <div class="input-group">
                        <input
                            [type]="showPasswordConfirm ? 'text' : 'password'"
                            id="passwordConfirm"
                            formControlName="passwordConfirm"
                            class="form-control"
                            placeholder="Confirmar nueva contraseña"
                            required
                        />
                        <button
                            class="btn btn-light btn-icon"
                            type="button"
                            (click)="togglePassword('confirm')"
                            [disabled]="cambiandoPassword"
                        >
                            <ng-icon
                                name="tablerEye"
                                [class.d-block]="showPasswordConfirm"
                                [class.d-none]="!showPasswordConfirm"
                            ></ng-icon>
                            <ng-icon
                                name="tablerEyeClosed"
                                [class.d-block]="!showPasswordConfirm"
                                [class.d-none]="showPasswordConfirm"
                            ></ng-icon>
                        </button>
                    </div>
                    @if (formPassword.get('passwordConfirm')?.invalid && formPassword.get('passwordConfirm')?.touched) {
                        <div class="invalid-feedback">Confirme la nueva contraseña.</div>
                    }
                </div>
            </div>
            <button class="btn btn-primary mt-3" type="submit" form="formPassword" [disabled]="cambiandoPassword" [attr.aria-busy]="cambiandoPassword">
                {{ cambiandoPassword ? 'Cambiando...' : 'Cambiar contraseña' }}
            </button>
            @if (cambiandoPassword) { <div class="small text-muted mt-2" role="status">Cambiando contraseña...</div> }
        </form>
    `,
})
export class TabSeguridad implements OnInit {
    @Input() usuario!: UsuarioCompleto;
    
    private fb = inject(FormBuilder);
    protected confirmationService = inject(ConfirmationService);
    private usuarioService = inject(UsuarioService);
    protected messageService = inject(MessageService);
    
    formPassword = this.fb.group({
        contrasenaActual: ['', Validators.required],
        nuevaContrasena: ['', [Validators.required]],
        passwordConfirm: ['', [Validators.required]]
    });
    showPasswordActual:boolean = false;
    showPasswordNueva:boolean = false;
    showPasswordConfirm:boolean = false;
    cambiandoPassword = false;
    private confirmacionPendiente = false;

    ngOnInit(): void {
        
    }

    togglePassword(tipo: 'actual' | 'nueva' | 'confirm') {
        if (tipo === 'actual') {
            this.showPasswordActual = !this.showPasswordActual;
        } else if (tipo === 'nueva') {
            this.showPasswordNueva = !this.showPasswordNueva;
        } else if (tipo === 'confirm') {
            this.showPasswordConfirm = !this.showPasswordConfirm;
        }
    }

    cambiarPassword() {
        if (this.cambiandoPassword || this.confirmacionPendiente) return;
        if (this.formPassword.invalid) {
            this.formPassword.markAllAsTouched();
            return;
        }
        const actual = this.formPassword.get('contrasenaActual')?.value ?? '';
        const nueva = this.formPassword.get('nuevaContrasena')?.value ?? '';
        const confirm = this.formPassword.get('passwordConfirm')?.value ?? '';
        if (nueva !== confirm) {
            this.showError('Error', 'Las contraseñas nuevas no coinciden');
            return;
        }
        this.confirmationService.confirm({
            message: '¿Está seguro que desea cambiar la contraseña?',
            header: 'Confirmar cambio de contraseña',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.confirmacionPendiente = false;
                this.cambiandoPassword = true;
                this.usuarioService.cambiarPassword(this.usuario.id ?? '', actual, nueva).pipe(finalize(() => {
                    this.cambiandoPassword = false;
                })).subscribe({
                    next: () => {
                        this.showSuccess('Contraseña cambiada', 'La contraseña se cambió correctamente');
                        this.formPassword.reset();
                    },
                    error: (err) => {
                        this.showError('Error', err?.error?.message || 'No se pudo cambiar la contraseña');
                    }
                });
            },
            reject: () => { this.confirmacionPendiente = false; }
        });
        this.confirmacionPendiente = true;
    }

    
    protected showSuccess(summary: string, detail: string) {
        this.messageService.add({ severity: 'success', summary, detail });
    }

    protected showError(summary: string, detail: string) {
        this.messageService.add({ severity: 'error', summary, detail });
    }

}
