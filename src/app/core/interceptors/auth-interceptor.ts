
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Agregar el token al header Authorization
  const token = authService.getAccessToken();
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Si la petición que devolvió 401 es la del refresh token → no reintentamos
          if (req.url && req.url.includes('/auth/refresh')) {
            authService.logout();
            router.navigateByUrl('/login');
            return throwError(() => error);
          }

          // Intentamos renovar el token
          return authService.refreshToken().pipe(
            switchMap((res: any) => {
              // Guardar los nuevos tokens
              if (res.accessToken) {
                authService.setTokens(res.accessToken, res.refreshToken || '', false);
              }
              // Reintentar la request original
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${res.accessToken}`
                }
              });
              return next(newReq);
            }),
            catchError(refreshError => {
              // Si falla el refresh token → cerramos sesión
              authService.logout();
              router.navigateByUrl('/login');
              return throwError(() => refreshError);
            })
          );
        }

        // Otros errores
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
