import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '@core/interfaces/usuario';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserStorageService } from './user-storage';
import { PermisosService } from './permisos';
import { EventoTrabajoService } from './evento-trabajo.service';
import { HeartbeatService } from './heartbeat.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private userStorage: UserStorageService,
    private permisosService: PermisosService,
    private eventoTrabajoService: EventoTrabajoService,
    private heartbeatService: HeartbeatService,
    private router: Router,
  ) { }
  URL_COMPLETA = environment.BASE_URL;

  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) || sessionStorage.getItem(this.accessTokenKey);
  }

  setAccessToken(accessToken: string): void {
    const recordar = localStorage.getItem('recordar') === 'true' || sessionStorage.getItem('recordar') === 'true';
    if (recordar) {
      localStorage.setItem(this.accessTokenKey, accessToken);
    } else {
      sessionStorage.setItem(this.accessTokenKey, accessToken);
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey) || sessionStorage.getItem(this.refreshTokenKey);
  }

  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
    if (rememberMe) {
      localStorage.setItem(this.accessTokenKey, accessToken);
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    } else {
      sessionStorage.setItem(this.accessTokenKey, accessToken);
      sessionStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/auth/refresh`, {});
  }

  verifyToken(): Observable<boolean> {
    return this.http.get(`${this.URL_COMPLETA}/auth/profile`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  login(credentials: any, recordar:boolean=false): Observable<any> {
    localStorage.setItem('recordar', recordar.toString());
    sessionStorage.setItem('recordar', recordar.toString());
    
    return this.http.post<any>(`${this.URL_COMPLETA}/auth/login`, {
      usuario: credentials.usuario,
      password: credentials.password,
      recordar
    }).pipe(
      tap((res: any) => {
        // Guardar los tokens del response (el backend los devuelve en el body)
        if (res.accessToken && res.refreshToken) {
          this.setTokens(res.accessToken, res.refreshToken, recordar);
        }
        this.eventoTrabajoService.limpiarEvento();
        this.cargarDatosUsuario();
        this.heartbeatService.start();
      })
    )
  }

  private cargarDatosUsuario(): void {
    this.http.get<any>(`${this.URL_COMPLETA}/auth/profile`).subscribe({
      next: (profile) => {
        const recordar = localStorage.getItem('recordar') === 'true' || sessionStorage.getItem('recordar') === 'true';
        this.userStorage.setUsuario(profile.usuario, recordar);
        this.permisosService.setPermisos(profile.permisos || [], recordar);
      },
      error: () => {
        this.logout();
      }
    });
  }

  logout(): void {
    this.http.post(`${this.URL_COMPLETA}/auth/logout`, {}).subscribe({
      next: () => this.limpiarSesion(),
      error: () => this.limpiarSesion()
    });
  }

  private limpiarSesion(): void {
    this.clearTokens();
    this.heartbeatService.stop();
    this.eventoTrabajoService.limpiarEvento();
    this.userStorage.clearUsuario();
    this.permisosService.clearPermisos();
    this.router.navigate(['/login']);
  }

}
