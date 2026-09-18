import { FiltroActivo } from '@/app/constants/filtros_activo';
import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cliente } from '@core/interfaces/cliente';
import { Observable } from 'rxjs';

export interface ClientePage {
  data: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClienteListParams {
  globalSearch?: string;
  sigla?: string;
  nombre?: string;
  page?: number;
  limit?: number;
  sortField?: 'id' | 'sigla' | 'nombre' | 'activo';
  sortDirection?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(activo?: FiltroActivo): Observable<Cliente[]>;
  getAll(activo: FiltroActivo, params: ClienteListParams): Observable<ClientePage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, params?: ClienteListParams): Observable<Cliente[] | ClientePage> {
    let httpParams = new HttpParams().set('activo', activo);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<Cliente[] | ClientePage>(`${this.URL_COMPLETA}/cliente`, { params: httpParams });
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.URL_COMPLETA}/cliente/${id}`);
  }

  create(cliente:Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.URL_COMPLETA}/cliente`, cliente);
  }

  update(id:number, cliente:Cliente): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.URL_COMPLETA}/cliente/${id}`, cliente);
  }

  delete(id:number): Observable<Cliente> {
    return this.http.delete<Cliente>(`${this.URL_COMPLETA}/cliente/${id}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/cliente/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/cliente/importacion/export?activo=${activo}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/cliente/importacion/excel`, formData);
  }
}
