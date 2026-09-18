import { FiltroActivo } from '@/app/constants/filtros_activo';
import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Proyecto } from '@core/interfaces/proyecto';
import { Observable } from 'rxjs';

export interface ProyectoPage { data: Proyecto[]; total: number; page: number; limit: number; totalPages: number; }
export interface ProyectoListParams { globalSearch?: string; sigla?: string; nombre?: string; clienteId?: number; page?: number; limit?: number; sortField?: 'id' | 'sigla' | 'nombre' | 'activo'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<Proyecto[]>;
  getAll(activo: FiltroActivo, clienteId?: number | null): Observable<Proyecto[]>;
  getAll(activo: FiltroActivo, params: ProyectoListParams): Observable<ProyectoPage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, paramsOrCliente: ProyectoListParams | number | null = null): Observable<Proyecto[] | ProyectoPage> {
    let httpParams = new HttpParams().set('activo', activo);
    const params = typeof paramsOrCliente === 'object' ? paramsOrCliente ?? {} : { clienteId: paramsOrCliente ?? undefined };
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<Proyecto[] | ProyectoPage>(`${this.URL_COMPLETA}/proyecto`, { params: httpParams });
  }

  getById(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.URL_COMPLETA}/proyecto/${id}`);
  }

  create(proyecto:Proyecto): Observable<Proyecto> {
    return this.http.post<Proyecto>(`${this.URL_COMPLETA}/proyecto`, proyecto);
  }

  update(id:number, proyecto:Proyecto): Observable<Proyecto> {
    return this.http.patch<Proyecto>(`${this.URL_COMPLETA}/proyecto/${id}`, proyecto);
  }

  delete(id:number): Observable<Proyecto> {
    return this.http.delete<Proyecto>(`${this.URL_COMPLETA}/proyecto/${id}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/proyecto/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/proyecto/importacion/export?activo=${activo}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/proyecto/importacion/excel`, formData);
  }
  
}
