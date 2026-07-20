// sign-in-flow.spec.ts
// Slice 2 sign-in flow seed. Asserts the redirect gating in `loginOk()` via
// the testable `decideRedirect(returnUrl)` helper exposed on the component.
//
// Status: RED on origin/desa — sign-in.ts still routes via `Router.navigateByUrl`
// regardless of `returnUrl` origin. After Slice 2 lands, this spec flips GREEN.
//
// testability note: Karma runs the page in real Chrome; any
// `window.location.href = X` would navigate the runner away mid-`it`.
// `decideRedirect` keeps the decision pure so the spec can assert the
// redirect target shape without disturbing the Karma harness.

import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router, provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { MessageService } from 'primeng/api'
import { AuthService } from '@core/services/auth'
import { UserStorageService } from '@core/services/user-storage'
import { LayoutStoreService } from '@core/services/layout-store.service'
import { environment as envModule } from '@/environments/environment'
import { SignIn } from '@/app/views/auth/sign-in'

function setEnv(partial: Partial<typeof envModule>) {
  Object.assign(envModule, partial)
}

function resetEnv() {
  setEnv({
    BASE_URL: '',
    loginUrl: '',
    apiBaseUrl: '',
    cookieName: 'token',
    cookieOnlyAuth: false,
    useCookieAuth: false,
    trustedReturnOrigins: [],
    REVERT_LITERAL: false,
  } as any)
}

describe('SignIn.decideRedirect() — REQ-sign-in-redirect + REQ-open-redirect-guard', () => {
  let component: SignIn
  let authStub: jasmine.SpyObj<AuthService>

  beforeEach(async () => {
    authStub = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'getAccessToken',
      'logout',
      'verifyToken',
    ])
    authStub.getAccessToken.and.returnValue('jwt.test.token')
    const userStorageStub = jasmine.createSpyObj<UserStorageService>(
      'UserStorageService',
      ['getUsuario'],
    )
    userStorageStub.getUsuario.and.returnValue({ pagina_inicio: '/inicio' } as any)

    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthService, useValue: authStub },
        { provide: UserStorageService, useValue: userStorageStub },
        { provide: LayoutStoreService, useValue: {} },
        MessageService,
      ],
    }).compileComponents()

    component = TestBed.createComponent(SignIn).componentInstance
  })

  afterEach(() => resetEnv())

  // [test-only helper]
  function trustOrigin(origins: string[], useCookieAuth: boolean) {
    setEnv({ trustedReturnOrigins: origins, useCookieAuth })
  }

  // -- Test/Prod: cookie-mode redirect ---------------------------------------

  describe('cookie-mode (useCookieAuth=true)', () => {
    beforeEach(() => trustOrigin(['https://gem-docs.julitorossian.dev'], true))

    it('returns cross-origin-cookie with the trusted URL only (no token)', () => {
      const decision = component.decideRedirect('https://gem-docs.julitorossian.dev/welcome')
      expect(decision?.kind).toBe('cross-origin-cookie')
      expect(decision?.url).toBe('https://gem-docs.julitorossian.dev/welcome')
    })

    it('does NOT call AuthService.getAccessToken in cookie mode', () => {
      authStub.getAccessToken.calls.reset()
      component.decideRedirect('https://gem-docs.julitorossian.dev/welcome')
      expect(authStub.getAccessToken).not.toHaveBeenCalled()
    })
  })

  // -- Dev: URL-token handover -----------------------------------------------

  describe('URL-token handover (useCookieAuth=false, trusted localhost)', () => {
    beforeEach(() => trustOrigin(['http://localhost:4201', 'http://localhost:4200'], false))

    it('returns cross-origin-token with ?token=jwt appended', () => {
      const decision = component.decideRedirect('http://localhost:4201/welcome')
      expect(decision?.kind).toBe('cross-origin-token')
      expect(decision?.url).toContain('http://localhost:4201/welcome')
      expect(decision?.url).toContain('token=jwt.test.token')
    })

    it('uses & when the URL already has a query string', () => {
      const decision = component.decideRedirect('http://localhost:4201/welcome?lang=es')
      expect(decision?.url).toContain('lang=es')
      expect(decision?.url).toContain('&token=jwt.test.token')
      expect(decision?.url).not.toContain('?&')
    })
  })

  // -- Open-redirect guard ---------------------------------------------------

  describe('returnUrl NOT in allowlist (open-redirect guard)', () => {
    beforeEach(() => trustOrigin(['https://gem-docs.julitorossian.dev'], true))

    it('returns null for evil.com', () => {
      expect(component.decideRedirect('https://evil.com/x')).toBeNull()
    })

    it('returns null for javascript:alert(1)', () => {
      expect(component.decideRedirect('javascript:alert(1)')).toBeNull()
    })

    it('returns null on scheme mismatch (http vs https)', () => {
      expect(component.decideRedirect('http://gem-docs.julitorossian.dev/welcome')).toBeNull()
    })

    it('returns null on port mismatch (:8443)', () => {
      expect(component.decideRedirect('https://gem-docs.julitorossian.dev:8443/welcome')).toBeNull()
    })

    it('returns null on subdomain takeover', () => {
      expect(component.decideRedirect('https://evil.gem-docs.julitorossian.dev/welcome')).toBeNull()
    })

    it('does NOT call AuthService.getAccessToken when not trusted', () => {
      authStub.getAccessToken.calls.reset()
      component.decideRedirect('https://evil.com/x')
      expect(authStub.getAccessToken).not.toHaveBeenCalled()
    })
  })

  describe('empty / undefined returnUrl', () => {
    beforeEach(() => trustOrigin(['https://gem-docs.julitorossian.dev'], true))

    it('returns null for empty string', () => {
      expect(component.decideRedirect('')).toBeNull()
    })

    it('returns null for undefined', () => {
      expect(component.decideRedirect(undefined)).toBeNull()
    })
  })

  describe('REVERT_LITERAL fail-safe rollback', () => {
    it('bypasses allowlist and performs URL-token handover to localhost:4201 if REVERT_LITERAL is active', () => {
      setEnv({ REVERT_LITERAL: true } as any)
      const decision = component.decideRedirect('http://localhost:4201/welcome')
      expect(decision?.kind).toBe('cross-origin-token')
      expect(decision?.url).toContain('http://localhost:4201/welcome')
      expect(decision?.url).toContain('token=jwt.test.token')
    })

    it('returns null for other untrusted origins even if REVERT_LITERAL is active', () => {
      setEnv({ REVERT_LITERAL: true } as any)
      expect(component.decideRedirect('https://evil.com/welcome')).toBeNull()
    })
  })
})

// -- loginOk() fallback navigation (Router path only) --------------------------

describe('SignIn.loginOk() — fallback navigation', () => {
  let component: SignIn
  let navigateSpy: jasmine.Spy
  let queryParams: Record<string, string | undefined>

  async function configure(opts: {
    queryParams?: Record<string, string | undefined>
    paginaInicio?: string | null
  }) {
    queryParams = opts.queryParams ?? {}
    const authStub = jasmine.createSpyObj<AuthService>('AuthService', [
      'login', 'getAccessToken', 'logout', 'verifyToken',
    ])
    const userStorageStub = jasmine.createSpyObj<UserStorageService>(
      'UserStorageService', ['getUsuario'],
    )
    // Default: pagina_inicio = '/inicio'. `null` flips it to undefined (mimics
    // a logged-in user without pagina_inicio set).
    userStorageStub.getUsuario.and.returnValue(
      opts.paginaInicio === null
        ? (undefined as any)
        : ({ pagina_inicio: opts.paginaInicio ?? '/inicio' } as any),
    )

    await TestBed.configureTestingModule({
      imports: [SignIn],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
        { provide: AuthService, useValue: authStub },
        { provide: UserStorageService, useValue: userStorageStub },
        { provide: LayoutStoreService, useValue: {} },
        MessageService,
      ],
    }).compileComponents()

    const router = TestBed.inject(Router)
    navigateSpy = spyOn(router, 'navigateByUrl').and.callThrough()
    component = TestBed.createComponent(SignIn).componentInstance
  }

  afterEach(() => resetEnv())

  it('falls back to router.navigateByUrl(\'/inicio\') when ?returnUrl=https://evil.com', async () => {
    setEnv({ trustedReturnOrigins: ['https://gem-docs.julitorossian.dev'] })
    await configure({ queryParams: { returnUrl: 'https://evil.com/x' } })
    component.loginOk()
    expect(navigateSpy).toHaveBeenCalledWith('/inicio')
  })

  it('falls back to router.navigateByUrl(\'/\') when returnUrl missing AND no pagina_inicio', async () => {
    setEnv({})
    await configure({ paginaInicio: null })
    component.loginOk()
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })
})
