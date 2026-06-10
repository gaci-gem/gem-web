import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '@core/interfaces/usuario';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserStorageService } from './user-storage';
import { PermisosService } from './permisos';
import { EventoTrabajoService } from './evento-trabajo.service';
import { HeartbeatService } from './heartbeat.service';

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
  ) { }
  URL_COMPLETA = environment.BASE_URL;

  private readonly accessTokenKey = 'access_token'
  private readonly refreshTokenKey = 'refresh_token'


  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
  }
  setAccessToken(accessToken:string): void {
    if (localStorage.getItem(this.accessTokenKey)) {
      localStorage.setItem(this.accessTokenKey, accessToken);
    } else {
      sessionStorage.setItem(this.accessTokenKey, accessToken);
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey) ?? sessionStorage.getItem(this.refreshTokenKey);
  }

  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
    if (rememberMe) {
      localStorage.setItem(this.accessTokenKey, accessToken)
      localStorage.setItem(this.refreshTokenKey, refreshToken)
    } else {
      sessionStorage.setItem(this.accessTokenKey, accessToken)
      sessionStorage.setItem(this.refreshTokenKey, refreshToken)
    }
  }

  clearTokens() {
    localStorage.removeItem(this.accessTokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    sessionStorage.removeItem(this.accessTokenKey)
    sessionStorage.removeItem(this.refreshTokenKey)
  }

  refreshToken(): Observable<string> {
    const refresh = this.getRefreshToken()
    return this.http.post<any>(`${this.URL_COMPLETA}/auth/refresh`, { refreshToken: refresh })
  }

  verifyToken(): Observable<boolean> {
    const token = this.getAccessToken();
    if (!token) return of(false);
    return this.http.get(`${this.URL_COMPLETA}/auth/profile`).pipe(
      map(() => true), // si responde 200
      catchError(() => of(false)) // si responde 401 o error
    );
  }

  login(credentials: any, recordar:boolean=false): Observable<any> {
    // Enviar la fecha local del cliente para que el backend compute bien cumpleaños y ausencia
    const body = { ...credentials, fechaActual: new Date().toISOString() };
    return this.http.post(`${this.URL_COMPLETA}/auth/login`, body).pipe(
      tap((res: any) => {
        this.eventoTrabajoService.limpiarEvento();
        this.setTokens(res.accessToken, res.refreshToken, recordar);
        const usuarioData = {
          ...res.usuario,
          esCumpleanios: res.esCumpleanios,
          ultimoLogin: res.ultimoLogin,
          diasAusente: res.diasAusente
        };
        this.userStorage.setUsuario(usuarioData, recordar);
        if (res.permisos) {
          this.permisosService.setPermisos(res.permisos, recordar);
        }
        this.heartbeatService.start();
      })
    )
  }

  logout(): void {
    this.heartbeatService.stop();
    this.eventoTrabajoService.limpiarEvento();
    this.clearTokens();
    this.userStorage.clearUsuario()
    this.permisosService.clearPermisos();
    // localStorage.removeItem('__SIMPLE_ANGULAR_CONFIG__'); // Limpia configuración de la app
  }

}
