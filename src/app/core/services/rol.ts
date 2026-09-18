import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Rol as RolInterface } from '@core/interfaces/rol';
import { FiltroActivo } from '@/app/constants/filtros_activo';

export interface RolPage { data: RolInterface[]; total: number; page: number; limit: number; totalPages: number; }
export interface RolListParams { globalSearch?: string; codigo?: string; descripcion?: string; page?: number; limit?: number; sortField?: 'codigo' | 'descripcion' | 'color' | 'activo'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<RolInterface[]>;
  getAll(activo: FiltroActivo, params: RolListParams): Observable<RolPage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, params?: RolListParams): Observable<RolInterface[] | RolPage> {
    let httpParams = new HttpParams().set('activo', activo);
    Object.entries(params ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<RolInterface[] | RolPage>(`${this.URL_COMPLETA}/rol`, { params: httpParams });
  }

  getByCodigo(rolCodigo: string): Observable<RolInterface> {
    return this.http.get<RolInterface>(`${this.URL_COMPLETA}/rol/${rolCodigo}`);
  }

  create(rol:RolInterface): Observable<RolInterface> {
    return this.http.post<RolInterface>(`${this.URL_COMPLETA}/rol`, rol);
  }

  update(rolCodigo:string, rol:RolInterface): Observable<RolInterface> {
    return this.http.patch<RolInterface>(`${this.URL_COMPLETA}/rol/${rolCodigo}`, rol);
  }

  delete(rolCodigo:string): Observable<RolInterface> {
    return this.http.delete<RolInterface>(`${this.URL_COMPLETA}/rol/${rolCodigo}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/rol/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/rol/importacion/export?activo=${activo}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/rol/importacion/excel`, formData);
  }

  getPermisosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL_COMPLETA}/permiso`);
  }

}
