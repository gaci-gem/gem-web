import { of } from 'rxjs';
import { AuthService } from './auth';

describe('AuthService login', () => {
  const http = { post: jasmine.createSpy('post') };
  const userStorage = { setUsuario: jasmine.createSpy('setUsuario') };
  const permisosService = { setPermisos: jasmine.createSpy('setPermisos') };
  const eventoTrabajoService = { limpiarEvento: jasmine.createSpy('limpiarEvento') };
  const heartbeatService = { start: jasmine.createSpy('start') };
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    http.post.calls.reset();
    http.post.and.returnValue(of({}));
    service = new AuthService(
      http as any,
      userStorage as any,
      permisosService as any,
      eventoTrabajoService as any,
      heartbeatService as any,
    );
  });

  it('reuses an existing browser device id unchanged', () => {
    localStorage.setItem('auth_device_id', 'existing-device-id');

    service.login({ usuario: 'ada', password: 'secret' }, true).subscribe();

    expect(http.post.calls.mostRecent().args[1].deviceId).toBe('existing-device-id');
  });

  it('prefers randomUUID when it is available', () => {
    spyOn(globalThis.crypto, 'randomUUID').and.returnValue(
      '00000000-0000-4000-8000-000000000001',
    );

    service.login({ usuario: 'ada', password: 'secret' }, true).subscribe();
    const firstBody = http.post.calls.mostRecent().args[1];

    service.login({ usuario: 'ada', password: 'secret' }, false).subscribe();
    const secondBody = http.post.calls.mostRecent().args[1];

    expect(firstBody.recordar).toBeTrue();
    expect(firstBody.deviceId).toBe('00000000-0000-4000-8000-000000000001');
    expect(secondBody.recordar).toBeFalse();
    expect(secondBody.deviceId).toBe('00000000-0000-4000-8000-000000000001');
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it('generates a UUID v4-compatible id when randomUUID is unavailable', () => {
    const randomUUID = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });

    try {
      service.login({ usuario: 'ada', password: 'secret' }).subscribe();
      const deviceId = http.post.calls.mostRecent().args[1].deviceId as string;

      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        configurable: true,
        value: randomUUID,
      });
    }
  });
});
