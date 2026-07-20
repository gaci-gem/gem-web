import { Component, inject } from '@angular/core'
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
import { environment } from '@/environments/environment'
import { isTrustedReturnUrl } from '@core/utils/is-trusted-return-url'

// Internal — surfaced for testability of the redirect decision without
// triggering `window.location.href` from a Karma test (which would navigate
// the runner away).
export type RedirectDecision =
  | { kind: 'cross-origin-cookie'; url: string }
  | { kind: 'cross-origin-token'; url: string }
  | { kind: 'fallback'; url: string }

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
export class SignIn {
  constructor(public layout: LayoutStoreService) { }
  private authService = inject(AuthService);
  private router = inject(Router);
  private rutActiva = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private userStorage = inject(UserStorageService);

  showPassword: boolean = false
  cargando: boolean = false;

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
    const returnUrl = this.rutActiva.snapshot.queryParams['returnUrl'];
    const inicio_default = this.userStorage.getUsuario()?.pagina_inicio;

    // Slice 2 (shared-auth-cross-origin): the helper gates the open-redirect
    // attack surface and decouples the dev URL-token handover from a hardcoded
    // hostname. The allowlist is intentionally env-driven — see
    // environment*.ts (trustedReturnOrigins).
    const decision = this.decideRedirect(returnUrl)
    this.applyRedirect(decision, inicio_default)
  }

  // Exposed for spec assertions — keeps the decision logic independent of the
  // browser side-effect so `window.location.href = X` is never invoked from a
  // Karma test (which would navigate the runner away mid-`it`).
  decideRedirect(returnUrl: string | undefined): RedirectDecision | null {
    if (!returnUrl) return null

    if (isTrustedReturnUrl(returnUrl, environment.trustedReturnOrigins)) {
      if (environment.useCookieAuth) {
        return { kind: 'cross-origin-cookie', url: returnUrl }
      }
      const token = this.authService.getAccessToken()
      const separator = returnUrl.includes('?') ? '&' : '?'
      return {
        kind: 'cross-origin-token',
        url: `${returnUrl}${separator}token=${token ?? ''}`,
      }
    }
    return null
  }

  private applyRedirect(decision: RedirectDecision | null, fallback: string | undefined) {
    if (decision?.kind === 'cross-origin-cookie') {
      // Test/Prod: cookie is the credential. Navigate with no token in URL.
      window.location.href = decision.url
      return
    }
    if (decision?.kind === 'cross-origin-token') {
      // Dev: trusted-allowed localhost origin gets the JWT in the URL because
      // cookies don't cross origins in dev (no Domain).
      window.location.href = decision.url
      return
    }
    this.router.navigateByUrl(fallback || '/')
  }

}
