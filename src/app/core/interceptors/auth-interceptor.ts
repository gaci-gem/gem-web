
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { catchError, finalize, shareReplay, switchMap, throwError, Observable } from 'rxjs';

let refreshInFlight: Observable<{ accessToken?: string }> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();
  const excluded = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/profile'];

  // Si el request ya tiene la marca de intento de refresh, no lo reintentes
  if (req.headers.get('X-Refresh-Attempt')) {
    // Si el refresh falló, cerramos sesión directamente
    authService.logout().subscribe();
    router.navigateByUrl('/login');
    return throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Refresh token expired' }));
  }

  // Agregamos el token al header
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Si la petición que devolvió 401 es la del refresh token → no reintentamos
        // (evita bucle cuando el refresh token también expiró)
        if (excluded.some(path => req.url.includes(path))) {
          authService.logout().subscribe();
          router.navigateByUrl('/login');
          return throwError(() => error);
        }

        // Intentamos renovar el token
        refreshInFlight ??= authService.refreshToken().pipe(
          finalize(() => refreshInFlight = null),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
        return refreshInFlight.pipe(
          switchMap((newToken: { accessToken?: string }) => {
            // Guardamos el nuevo token y repetimos la request
            if (newToken.accessToken) authService.setAccessToken(newToken.accessToken);

            const newAuthReq = req.clone({
              setHeaders: newToken?.accessToken ? { Authorization: `Bearer ${newToken.accessToken}` } : {}
            });

            return next(newAuthReq);
          }),
          catchError(refreshError => {
            // Si falla el refresh token → cerramos sesión
            authService.logout().subscribe();
            router.navigateByUrl('/login');
            return throwError(() => refreshError);
          })
        );
      }

      // Otros errores
      return throwError(() => error);
    })
  );
};
