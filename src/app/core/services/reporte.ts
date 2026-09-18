import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Reporte } from '@core/interfaces/reporte';
import { Observable } from 'rxjs';

export interface ReportePage { data: Reporte[]; total: number; page: number; limit: number; totalPages: number; }
export interface ReporteListParams { globalSearch?: string; tipo?: string; parametros?: string; usuario?: string; solicitadoEn?: string; generadoEn?: string; estado?: string; errorDescripcion?: string; page?: number; limit?: number; sortField?: 'id' | 'tipo' | 'solicitadoEn' | 'generadoEn' | 'estado' | 'errorDescripcion' | 'usuario'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(activo?: 'true' | 'false' | 'all'): Observable<Reporte[]>;
  getAll(activo: 'true' | 'false' | 'all', params: ReporteListParams): Observable<ReportePage>;
  getAll(activo: 'true' | 'false' | 'all' | undefined = 'true', params?: ReporteListParams): Observable<Reporte[] | ReportePage> {
    let query = new HttpParams();
    if (!params) query = query.set('activo', activo ?? 'true');
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query = query.set(key, String(value));
    });
    return this.http.get<Reporte[] | ReportePage>(`${this.URL_COMPLETA}/reporte`, { params: query });
  }

  getById(reporteId: number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.URL_COMPLETA}/reporte/${reporteId}`);
  }

  create(reporte:Reporte): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.URL_COMPLETA}/reporte`, reporte);
  }

  update(reporteId:number, reporte:Reporte): Observable<Reporte> {
    return this.http.patch<Reporte>(`${this.URL_COMPLETA}/reporte/${reporteId}`, reporte);
  }

  delete(reporteId:number): Observable<Reporte> {
    return this.http.delete<Reporte>(`${this.URL_COMPLETA}/reporte/${reporteId}`);
  }

  descargarReporte(reporteId:number, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/reporte/${reporteId}/descargar`, finalOptions);
  }
}
