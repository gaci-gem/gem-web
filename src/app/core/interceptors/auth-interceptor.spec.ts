import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '@core/services/auth';

describe('authInterceptor', () => {
  const authService = {
    getAccessToken: jasmine.createSpy('getAccessToken'),
    logout: jasmine.createSpy('logout'),
    refreshToken: jasmine.createSpy('refreshToken'),
    setAccessToken: jasmine.createSpy('setAccessToken'),
  };
  const router = {
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
  };

  beforeEach(() => {
    authService.getAccessToken.calls.reset();
    authService.logout.calls.reset();
    authService.refreshToken.calls.reset();
    authService.setAccessToken.calls.reset();
    router.navigateByUrl.calls.reset();
    authService.getAccessToken.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('does not refresh or log out when user creation returns 401', () => {
    const request = new HttpRequest('POST', '/auth/crearUsuario', {});
    const error = new HttpErrorResponse({ status: 401, url: request.url });
    const next = (): Observable<never> => throwError(() => error);
    let receivedError: HttpErrorResponse | undefined;

    TestBed.runInInjectionContext(() => authInterceptor(request, next)).subscribe({
      error: received => receivedError = received,
    });

    expect(receivedError).toBe(error);
    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
