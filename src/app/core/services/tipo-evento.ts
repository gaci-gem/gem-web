import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TipoEvento, TipoEventoTimeline } from '@core/interfaces/tipo-evento';
import { Observable } from 'rxjs';

export interface TipoEventoPage { data: TipoEvento[]; total: number; page: number; limit: number; totalPages: number; }
export interface TipoEventoListParams { globalSearch?: string; codigo?: string; descripcion?: string; page?: number; limit?: number; sortField?: 'codigo' | 'descripcion' | 'activo' | 'propio' | 'facturable' | 'color'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class TipoEventoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<TipoEvento[]>;
  getAll(params: TipoEventoListParams): Observable<TipoEventoPage>;
  getAll(params?: TipoEventoListParams): Observable<TipoEvento[] | TipoEventoPage> {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<TipoEvento[] | TipoEventoPage>(`${this.URL_COMPLETA}/tipo-evento`, { params: httpParams });
  }

  getById(id: string): Observable<TipoEvento> {
    return this.http.get<TipoEvento>(`${this.URL_COMPLETA}/tipo-evento/${id}`);
  }

  getTimeline(codigo: string): Observable<TipoEventoTimeline> {
    return this.http.get<TipoEventoTimeline>(`${this.URL_COMPLETA}/tipo-evento/${codigo}/timeline`);
  }

  create(tipoEvento:TipoEvento): Observable<TipoEvento> {
    return this.http.post<TipoEvento>(`${this.URL_COMPLETA}/tipo-evento`, tipoEvento);
  }

  update(id:string, tipoEvento:TipoEvento): Observable<TipoEvento> {
    return this.http.patch<TipoEvento>(`${this.URL_COMPLETA}/tipo-evento/${id}`, tipoEvento);
  }

  delete(id:string): Observable<TipoEvento> {
    return this.http.delete<TipoEvento>(`${this.URL_COMPLETA}/tipo-evento/${id}`);
  }
  
  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/tipo-evento/importacion/plantilla`, finalOptions);
  }

  exportarExcel(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/tipo-evento/importacion/export`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/tipo-evento/importacion/excel`, formData);
  }
}
