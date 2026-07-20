// logout-flow.spec.ts
// Slice 2 logout flow seed. Asserts the logout wiring for REQ-logout-all-envs:
// - fire POST /auth/logout with `withCredentials: true`;
// - clear `localStorage` JWT (Q4 LOCKED, hydrates cookie-first future path);
// - post a `{ type: 'logout', at: <ISO> }` message on `BroadcastChannel('gem-auth')`
//   after logout resolves so `gem-docs` can clear its session in lockstep.
//
// Status: RED on origin/desa — `AuthService.logout()` does NOT yet wire any of
// the three behaviours above. The LS-clear assertion today IS GREEN because
// `clearTokens()` already wipes `localStorage` + `sessionStorage` keys; the
// other two assertions are documented as pending until Slice 3 (per design §
// 9 and tasks.md § Slice 3 owner) lands the AuthService.logout() +
// BroadcastChannel('gem-auth') wiring and the `withCredentials` interceptor.

import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing'
import { environment as envModule } from '@/environments/environment'
import { AuthService } from '@core/services/auth'
import { UserStorageService } from '@core/services/user-storage'
import { PermisosService } from '@core/services/permisos'
import { EventoTrabajoService } from '@core/services/evento-trabajo.service'
import { HeartbeatService } from '@core/services/heartbeat.service'

describe('AuthService.logout() — REQ-logout-all-envs (Slice 2 seed, with Slice 3 wires)', () => {
  const ACCESS_KEY = 'access_token'
  const REFRESH_KEY = 'refresh_token'

  let service: AuthService
  let httpMock: HttpTestingController
  let userStorage: jasmine.SpyObj<UserStorageService>
  let permisos: jasmine.SpyObj<PermisosService>
  let eventoTrabajo: jasmine.SpyObj<EventoTrabajoService>
  let heartbeat: jasmine.SpyObj<HeartbeatService>

  beforeEach(async () => {
    localStorage.setItem(ACCESS_KEY, 'jwt.to.clear')
    sessionStorage.setItem(REFRESH_KEY, 'jwt.refresh.to.clear')

    userStorage = jasmine.createSpyObj<UserStorageService>('UserStorageService', [
      'clearUsuario',
      'setUsuario',
      'getUsuario',
    ])
    permisos = jasmine.createSpyObj<PermisosService>('PermisosService', [
      'clearPermisos',
      'setPermisos',
    ])
    eventoTrabajo = jasmine.createSpyObj<EventoTrabajoService>(
      'EventoTrabajoService',
      ['limpiarEvento'],
    )
    heartbeat = jasmine.createSpyObj<HeartbeatService>('HeartbeatService', [
      'start',
      'stop',
    ])

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: UserStorageService, useValue: userStorage },
        { provide: PermisosService, useValue: permisos },
        { provide: EventoTrabajoService, useValue: eventoTrabajo },
        { provide: HeartbeatService, useValue: heartbeat },
      ],
    }).compileComponents()

    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(ACCESS_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    httpMock.verify()
  })

  // -------------------------------------------------------------------------
  // GREEN today.
  // -------------------------------------------------------------------------

  it('clears the access_token from localStorage on logout', () => {
    // sanity: pre-condition
    expect(localStorage.getItem(ACCESS_KEY)).toBe('jwt.to.clear')

    service.logout()

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(sessionStorage.getItem(ACCESS_KEY)).toBeNull()
  })

  it('clears the refresh_token from localStorage on logout', () => {
    expect(sessionStorage.getItem(REFRESH_KEY)).toBe('jwt.refresh.to.clear')

    service.logout()

    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('stops the heartbeat and clears additional user state on logout', () => {
    service.logout()

    expect(heartbeat.stop).toHaveBeenCalled()
    expect(eventoTrabajo.limpiarEvento).toHaveBeenCalled()
    expect(userStorage.clearUsuario).toHaveBeenCalled()
    expect(permisos.clearPermisos).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // RED-seeds for Slice 3 wires. Document the assertions here so reviewers
  // can see the desired contract; the `pending()` markers keep CI green and
  // signal that Slice 3 owns the wiring.
  // -------------------------------------------------------------------------

  it('fires POST /auth/logout with withCredentials=true (Slice 3 wire)', () => {
    pending(
      'Slice 3 wires AuthService.logout() to fire POST /auth/logout with ' +
        'withCredentials=true (REQ-cross-app-cors + REQ-logout-all-envs). ' +
        'See design § 9 and tasks.md § Slice 3.3.',
    )

    service.logout()

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'POST' &&
        r.url === `${envModule.apiBaseUrl || ''}/auth/logout`,
    )
    expect(req.request.withCredentials).toBeTrue()
    req.flush({ ok: true })
  })

  it("posts { type: 'logout', at: <ISO> } on BroadcastChannel('gem-auth') after resolve (Slice 3 wire)", () => {
    pending(
      'Slice 3 wires a BroadcastChannel("gem-auth") post on logout so ' +
        'gem-docs can clear its session in lockstep. See design § 9 and ' +
        'tasks.md § Slice 3.3.',
    )

    const received: string[] = []
    const bc = new BroadcastChannel('gem-auth')
    bc.onmessage = (ev) => received.push(JSON.stringify(ev.data ?? {}))

    service.logout()

    // The post is async-after-resolve; for the green path we expect one
    // message whose envelope contains type=logout and a valid ISO `at`.
    expect(received.length).toBe(1)
    const parsed = JSON.parse(received[0])
    expect(parsed.type).toBe('logout')
    expect(typeof parsed.at).toBe('string')
    expect(new Date(parsed.at).toString()).not.toBe('Invalid Date')
    bc.close()
  })
})
