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
  private readonly deviceIdKey = 'auth_device_id'


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
    this.clearTokens();
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

  refreshToken(): Observable<{ accessToken?: string; refreshToken?: string }> {
    const refresh = this.getRefreshToken()
    return this.http.post<{ accessToken?: string; refreshToken?: string }>(`${this.URL_COMPLETA}/auth/refresh`, refresh ? { refreshToken: refresh } : {})
  }

  verifyToken(): Observable<boolean> {
    return this.http.get(`${this.URL_COMPLETA}/auth/profile`).pipe(
      map(() => true), // si responde 200
      catchError(() => of(false)) // si responde 401 o error
    );
  }

  login(credentials: any, recordar:boolean=false): Observable<any> {
    // Enviar la fecha local del cliente para que el backend compute bien cumpleaños y ausencia
    const body = {
      ...credentials,
      recordar,
      deviceId: this.getOrCreateDeviceId(),
      fechaActual: new Date().toISOString(),
    };
    return this.http.post(`${this.URL_COMPLETA}/auth/login`, body).pipe(
      tap((res: any) => {
        this.eventoTrabajoService.limpiarEvento();
        if (res.accessToken && res.refreshToken) {
          this.setTokens(res.accessToken, res.refreshToken, recordar);
        }
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

  private getOrCreateDeviceId(): string {
    const existing = localStorage.getItem(this.deviceIdKey);
    if (existing) return existing;

    const webCrypto = globalThis.crypto;
    let deviceId: string | undefined;

    if (typeof webCrypto?.randomUUID === 'function') {
      try {
        deviceId = webCrypto.randomUUID();
      } catch {
        // Continue with the compatible generator if randomUUID is unavailable at runtime.
      }
    }

    if (!deviceId && typeof webCrypto?.getRandomValues === 'function') {
      try {
        const bytes = new Uint8Array(16);
        webCrypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        deviceId = [
          this.bytesToHex(bytes, 0, 4),
          this.bytesToHex(bytes, 4, 2),
          this.bytesToHex(bytes, 6, 2),
          this.bytesToHex(bytes, 8, 2),
          this.bytesToHex(bytes, 10, 6),
        ].join('-');
      } catch {
        // Use the non-cryptographic fallback below when Web Crypto is unavailable.
      }
    }

    const fallback = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    deviceId ??= fallback;
    localStorage.setItem(this.deviceIdKey, deviceId);
    return deviceId;
  }

  private bytesToHex(bytes: Uint8Array, start: number, length: number): string {
    return Array.from(bytes.slice(start, start + length), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  logout(): Observable<void> {
    this.heartbeatService.stop();
    this.eventoTrabajoService.limpiarEvento();
    return this.http.post<void>(`${this.URL_COMPLETA}/auth/logout`, {}).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearTokens();
        this.userStorage.clearUsuario();
        this.permisosService.clearPermisos();
        try {
          const channel = new BroadcastChannel('gem-auth');
          channel.postMessage({ type: 'logout', at: new Date().toISOString() });
          channel.close();
        } catch {
          // BroadcastChannel is optional; local cleanup remains authoritative.
        }
      }),
    );
    // localStorage.removeItem('__SIMPLE_ANGULAR_CONFIG__'); // Limpia configuración de la app
  }

}
