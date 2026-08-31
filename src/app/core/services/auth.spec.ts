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

  it('sends remember me and a stable browser device id', () => {
    spyOn(crypto, 'randomUUID').and.returnValue(
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
});
