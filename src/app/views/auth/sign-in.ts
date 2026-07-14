import { Component, inject, OnInit } from '@angular/core'
import { AppLogo } from '@app/components/app-logo'
import { ActivatedRoute, Router } from '@angular/router'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { AuthService } from '@core/services/auth'
import { NgIcon } from '@ng-icons/core'
import { showError } from '@/app/utils/message-utils'
import { MessageService } from 'primeng/api'
import { LoadingSpinnerComponent } from '@app/components/index'
import { finalize } from 'rxjs'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { UsuarioService } from '@core/services/usuario'
import { UserStorageService } from '@core/services/user-storage'

@Component({
  selector: 'app-sign-in',
  imports: [
    AppLogo,
    ReactiveFormsModule,
    NgIcon,
    LoadingSpinnerComponent,
    FormsModule
  ],
  template: `
    @if (cargando) {
        <app-loading-spinner></app-loading-spinner>
    }
    <div class="auth-box overflow-hidden align-items-center d-flex">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-xxl-4 col-md-6 col-sm-8">
            <div class="card">
              <div class="card-body">
                <div class="auth-brand mb-4">
                  <app-app-logo [logoMaxWidth]="220" />
                </div>

                <div class="">
                  <form [formGroup]="loginForm" (ngSubmit)="login()">
                    <div class="mb-3">
                      <label for="usuario" class="form-label"
                        >Usuario <span class="text-danger">*</span></label
                      >
                      <div class="input-group">
                        <input
                          formControlName="usuario"
                          type="text"
                          class="form-control"
                          id="usuario"
                          placeholder="Usuario"
                          required
                        />
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="userPassword" class="form-label"
                        >Contraseña <span class="text-danger">*</span></label
                      >
                      <div class="input-group">
                        <input
                          formControlName="password"
                          [type]="showPassword ? 'text' : 'password'"
                          class="form-control"
                          id="userPassword"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          class="btn btn-light btn-icon"
                          type="button"
                          (click)="togglePassword()"
                        >
                          <ng-icon
                            name="tablerEye"
                            [class.d-block]="showPassword"
                            [class.d-none]="!showPassword"
                          ></ng-icon>
                          <ng-icon
                            name="tablerEyeClosed"
                            [class.d-block]="!showPassword"
                            [class.d-none]="showPassword"
                          ></ng-icon>
                        </button>
                      </div>
                    </div>

                    <div
                      class="d-flex justify-content-between align-items-center mb-3"
                    >
                      <div class="form-check">
                        <input
                          class="form-check-input form-check-input-light fs-14"
                          type="checkbox"
                          id="rememberMe"
                          checked
                        />
                        <label class="form-check-label" for="rememberMe"
                          >Recordarme</label
                        >
                      </div>
                      <!-- <a
                        routerLink="/auth/reset-password"
                        class="text-decoration-underline link-offset-3 text-muted"
                        >Forgot Password?</a
                      > -->
                    </div>

                    <div class="d-grid">
                      <button
                        type="submit"
                        class="btn btn-primary fw-semibold py-2"
                      >
                        Iniciar Sesion
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class SignIn implements OnInit {
  constructor(public layout: LayoutStoreService) { }
  private authService = inject(AuthService);
  private router = inject(Router);
  private rutActiva = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private userStorage = inject(UserStorageService);

  showPassword: boolean = false
  cargando: boolean = false;

  ngOnInit(): void {
    // Si hay returnUrl apuntando a gem-docs Y ya tenemos sesión válida,
    // redirigir directo sin mostrar el login form
    const returnUrl = this.rutActiva.snapshot.queryParams['returnUrl'];
    if (returnUrl && returnUrl.includes('localhost:4201')) {
      this.authService.verifyToken().subscribe(isValid => {
        if (isValid) {
          const token = this.authService.getAccessToken();
          const separator = returnUrl.includes('?') ? '&' : '?';
          window.location.href = `${returnUrl}${separator}token=${token}`;
        }
        // Si no está logueado, mostrar el form normalmente
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword
  }

  loginForm = new FormGroup({
    usuario: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  login() {
    if (this.loginForm.valid) {
      const recordar = (document.getElementById('rememberMe') as HTMLInputElement).checked || false;

      this.cargando = true;
      this.authService.login(this.loginForm.value, recordar).pipe(
        finalize(() => this.cargando = false)
      ).subscribe({
        next: () => {
          this.loginOk()
        },
        error: (err) => {
          // this.mostrarError('Credenciales inválidas')  // podés mostrar un toast, mensaje, etc.
          console.error(err)
          showError(this.messageService, 'Error', 'Credenciales inválidas');
        },
      })
    }
  }

  loginOk() {
    let returnUrl = this.rutActiva.snapshot.queryParams['returnUrl'];
    let inicio_default = this.userStorage.getUsuario()?.pagina_inicio;

    // Si returnUrl apunta a gem-docs (puerto 4201), pasar token en la URL
    // ya que localStorage no es compartido entre origins diferentes
    // IMPORTANTE: usar window.location.href para cross-origin, router.navigateByUrl no sirve
    if (returnUrl && returnUrl.includes('localhost:4201')) {
      const token = this.authService.getAccessToken();
      const separator = returnUrl.includes('?') ? '&' : '?';
      window.location.href = `${returnUrl}${separator}token=${token}`;
      return;
    }

    // Comportamiento normal: gem-web redirect
    this.router.navigateByUrl(returnUrl || inicio_default || '/');
  }

}
