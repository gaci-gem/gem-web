import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Adicional, Preferencia, UsuarioCompleto, Usuario as UsuarioInterface } from '@core/interfaces/usuario';
import { FiltroActivo } from '@/app/constants/filtros_activo';

export interface UsuarioPage {
  data: UsuarioInterface[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsuarioListParams {
  globalSearch?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  usuario?: string;
  rol?: string;
  page?: number;
  limit?: number;
  sortField?: 'id' | 'nombre' | 'apellido' | 'email' | 'usuario' | 'createdAt' | 'ultimo_login';
  sortDirection?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;
  
  getAll(activo?: FiltroActivo): Observable<UsuarioInterface[]>;
  getAll(activo: FiltroActivo, params: UsuarioListParams): Observable<UsuarioPage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, params?: UsuarioListParams): Observable<UsuarioInterface[] | UsuarioPage> {
    let httpParams = new HttpParams().set('activo', activo);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<UsuarioInterface[] | UsuarioPage>(`${this.URL_COMPLETA}/usuario`, { params: httpParams });
  }

  getByID(usuarioId:string) : Observable<UsuarioInterface>{
    return this.http.get<UsuarioInterface>(`${this.URL_COMPLETA}/usuario/${usuarioId}`);
  }

  getByIdCompleto(usuarioId:string) : Observable<UsuarioCompleto>{
    return this.http.get<UsuarioCompleto>(`${this.URL_COMPLETA}/usuario/${usuarioId}/completo`);
  }

  getByRol(rol:string) : Observable<UsuarioInterface[]>{
    return this.http.get<UsuarioInterface[]>(`${this.URL_COMPLETA}/usuario/rol/${rol}`);
  }
  
  create(usuario:UsuarioInterface): Observable<UsuarioInterface> {
    return this.http.post<UsuarioInterface>(`${this.URL_COMPLETA}/auth/crearUsuario`, usuario);
  }

  update(usuarioId:string, usuario:UsuarioInterface): Observable<UsuarioInterface> {
    return this.http.patch<UsuarioInterface>(`${this.URL_COMPLETA}/usuario/${usuarioId}`, usuario);
  }

  delete(usuarioId:string): Observable<UsuarioInterface> {
    return this.http.delete<UsuarioInterface>(`${this.URL_COMPLETA}/usuario/${usuarioId}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/usuario/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/usuario/importacion/export?activo=${activo}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/usuario/importacion/excel`, formData);
  }

  cambiarPassword(usuarioId: string, contrasenaActual: string, nuevaContrasena: string): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/auth/cambiar-contrasena`, {
      usuarioId,
      contrasenaActual,
      nuevaContrasena
    });
  }
  
  // PREFERENCIAS

  setPreferencias(usuarioId:string, preferencias: Preferencia[]) : Observable<Preferencia[]>{
    return this.http.post<Preferencia[]>(`${this.URL_COMPLETA}/usuario/${usuarioId}/preferencias`, preferencias);
  }

  getPreferencias(usuarioId:string) : Observable<Preferencia[]>{
    return this.http.get<Preferencia[]>(`${this.URL_COMPLETA}/usuario/${usuarioId}/preferencias`);
  }

  // adicionales

  getAdicionales(usuarioId:string) : Observable<Adicional[]>{
    return this.http.get<Adicional[]>(`${this.URL_COMPLETA}/usuario/${usuarioId}/adicionales`);
  }

  getAdicional(usuarioId:string, clave:string) : Observable<Adicional>{
    return this.http.get<Adicional>(`${this.URL_COMPLETA}/usuario/${usuarioId}/adicional/${clave}`);
  }

  actualizarAdicional(usuarioId:string, clave:string, valor:string) : Observable<any>{
    return this.http.post<any>(`${this.URL_COMPLETA}/usuario/${usuarioId}/adicional`, { usuarioId, clave, valor });
  }

  deleteAdicional(usuarioId:string, clave:string) : Observable<any>{
    return this.http.delete<any>(`${this.URL_COMPLETA}/usuario/${usuarioId}/adicional/${clave}`);
  }
  

}
