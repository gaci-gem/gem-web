import { FiltroActivo } from '@/app/constants/filtros_activo';
import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Entorno } from '@core/interfaces/entorno';
import { Observable } from 'rxjs';

export interface EntornoPage { data: Entorno[]; total: number; page: number; limit: number; totalPages: number; }
export interface EntornoListParams { globalSearch?: string; codigo?: string; nombre?: string; page?: number; limit?: number; sortField?: 'codigo' | 'nombre' | 'activo'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class EntornoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<Entorno[]>;
  getAll(activo: FiltroActivo, params: EntornoListParams): Observable<EntornoPage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, params?: EntornoListParams): Observable<Entorno[] | EntornoPage> {
    let httpParams = new HttpParams().set('activo', activo);
    Object.entries(params ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<Entorno[] | EntornoPage>(`${this.URL_COMPLETA}/entorno`, { params: httpParams });
  }

  getByCodigo(entornoCodigo: string): Observable<Entorno> {
    return this.http.get<Entorno>(`${this.URL_COMPLETA}/entorno/${entornoCodigo}`);
  }

  create(entorno:Entorno): Observable<Entorno> {
    return this.http.post<Entorno>(`${this.URL_COMPLETA}/entorno`, entorno);
  }

  update(entornoCodigo:string, entorno:Entorno): Observable<Entorno> {
    return this.http.patch<Entorno>(`${this.URL_COMPLETA}/entorno/${entornoCodigo}`, entorno);
  }

  delete(entornoCodigo:string): Observable<Entorno> {
    return this.http.delete<Entorno>(`${this.URL_COMPLETA}/entorno/${entornoCodigo}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/entorno/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/entorno/importacion/export?activo=${activo}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/entorno/importacion/excel`, formData);
  }
}
