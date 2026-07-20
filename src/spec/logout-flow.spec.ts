// logout-flow.spec.ts
// Slice 2 logout flow seed + Slice 3 wires. Asserts the logout wiring for
// REQ-logout-all-envs:
// - fire POST /auth/logout with `withCredentials: true`;
// - clear `localStorage` JWT (Q4 LOCKED);
// - post a `{ type: 'logout', at: <ISO> }` message on `BroadcastChannel('gem-auth')`
//   after logout resolves so `gem-docs` can clear its session in lockstep.
//
// Slice 2 status: `AuthService.logout()` did NOT yet wire any of the three
// behaviours above. The LS-clear assertion today IS GREEN because
// `clearTokens()` already wipes `localStorage` + `sessionStorage` keys; the
// other two were documented as pending until Slice 3.
// Slice 3 status: `AuthService.logout()` fires `POST /auth/logout` and posts
// `BroadcastChannel('gem-auth')` after resolve. The two pending markers now
// flip to real assertions — see task 3.3 in tasks.md.

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
  const LOGOUT_PATH = '/auth/logout'

  // Drain helper: Slice 3 wires AuthService.logout() to fire POST /auth/logout
  // as a fire-and-forget cookie clear. Tests that don't care about that HTTP
  // call (the GREEN-pre LS-clear / heartbeat-stop group) still need to flush
  // the request so `httpMock.verify()` in afterEach stays clean.
  function drainLogoutRequest() {
    const open = httpMock.match(
      (r) => r.method === 'POST' && r.url.endsWith(LOGOUT_PATH),
    )
    open.forEach((r) => r.flush({ ok: true }))
  }

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
    drainLogoutRequest()
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
  // Slice 3 wires — formerly pending(), now real assertions. Spec checks
  // REQ-cross-app-cors + REQ-logout-all-envs end-to-end through httpMock +
  // the real BroadcastChannel in the Chromium runner.
  // -------------------------------------------------------------------------

  it('fires POST /auth/logout with withCredentials=true (Slice 3 wire)', () => {
    service.logout()

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'POST' &&
        r.url === `${envModule.apiBaseUrl || ''}/auth/logout`,
    )
    expect(req.request.withCredentials).toBeTrue()
    req.flush({ ok: true })
  })

  it("posts { type: 'logout', at: <ISO> } on BroadcastChannel('gem-auth') after resolve (Slice 3 wire)", async () => {
    const received: string[] = []
    const bc = new BroadcastChannel('gem-auth')
    bc.onmessage = (ev) => received.push(JSON.stringify(ev.data ?? {}))

    service.logout()

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'POST' &&
        r.url === `${envModule.apiBaseUrl || ''}/auth/logout`,
    )
    expect(req.request.withCredentials).toBeTrue()
    req.flush({ ok: true })

    // BroadcastChannel delivery is async (macrotask). Poll the queue until
    // the message arrives or the timeout expires. In CI this resolves in
    // single-digit milliseconds; the 1s ceiling is a defensive cap.
    await new Promise<void>((resolve) => {
      if (received.length >= 1) {
        return resolve()
      }
      const deadline = Date.now() + 1000
      const interval = setInterval(() => {
        if (received.length >= 1 || Date.now() > deadline) {
          clearInterval(interval)
          resolve()
        }
      }, 5)
    })

    bc.close()
    expect(received.length).toBe(1)
    const parsed = JSON.parse(received[0])
    expect(parsed.type).toBe('logout')
    expect(typeof parsed.at).toBe('string')
    expect(new Date(parsed.at).toString()).not.toBe('Invalid Date')
  })

  it('broadcasts logout even when POST /auth/logout fails (defensive)', async () => {
    // The BC post is a fire-and-forget side-channel. If gem-api is briefly
    // unreachable (network blip, restart), the cookie may not clear server-side
    // but gem-docs MUST still drop its session to avoid a zombie-authed UI.
    const received: string[] = []
    const bc = new BroadcastChannel('gem-auth')
    bc.onmessage = (ev) => received.push(JSON.stringify(ev.data ?? {}))

    service.logout()

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'POST' &&
        r.url === `${envModule.apiBaseUrl || ''}/auth/logout`,
    )
    req.flush('service unavailable', { status: 503, statusText: 'Service Unavailable' })

    await new Promise<void>((resolve) => {
      if (received.length >= 1) return resolve()
      const deadline = Date.now() + 1000
      const interval = setInterval(() => {
        if (received.length >= 1 || Date.now() > deadline) {
          clearInterval(interval)
          resolve()
        }
      }, 5)
    })

    bc.close()
    expect(received.length).toBe(1)
  })
})
