import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Categoria, HorasPorCategoriaResponse, RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { Page, PaginatedResponse } from '@core/interfaces/paginated-response';
import { extractData } from '@core/operators/extract-data.operator';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroHoraService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(mes?: number, anio?: number, categoriaCodigo?: string): Observable<RegistroHora[]>;
  getAll(params: RegistroHoraQuery): Observable<Page<RegistroHora>>;
  getAll(mesOrParams?: number | RegistroHoraQuery, anio?: number, categoriaCodigo?: string): Observable<RegistroHora[] | Page<RegistroHora>> {
    let url = `${this.URL_COMPLETA}/registro-hora`;
    const params: string[] = [];
    const query = typeof mesOrParams === 'object'
      ? mesOrParams
      : { mes: mesOrParams, anio, categoriaCodigo };
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.push(`${key}=${encodeURIComponent(String(value))}`);
    });
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const response = this.http.get<PaginatedResponse<RegistroHora>>(url);
    return (typeof mesOrParams === 'object' ? response.pipe(
      mapPage<RegistroHora>()
    ) : response.pipe(extractData<RegistroHora>())) as Observable<RegistroHora[] | Page<RegistroHora>>;
  }

  getPorCategoria(eventoId: string): Observable<HorasPorCategoriaResponse> {
    return this.http.get<HorasPorCategoriaResponse>(
      `${this.URL_COMPLETA}/registro-hora/evento/${eventoId}/por-categoria`
    );
  }

  getById(registroId: number): Observable<RegistroHora> {
    return this.http.get<RegistroHora>(`${this.URL_COMPLETA}/registro-hora/${registroId}`);
  }

  getByUsuario(usuarioId: string, mes?: number, anio?: number): Observable<RegistroHora[]>;
  getByUsuario(usuarioId: string, params: RegistroHoraQuery): Observable<Page<RegistroHora>>;
  getByUsuario(usuarioId: string, mesOrParams?: number | RegistroHoraQuery, anio?: number): Observable<RegistroHora[] | Page<RegistroHora>> {
    let url = `${this.URL_COMPLETA}/registro-hora/usuario/${usuarioId}`;
    const query = typeof mesOrParams === 'object' ? mesOrParams : { mes: mesOrParams, anio };
    const params = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const response = this.http.get<PaginatedResponse<RegistroHora>>(url);
    return (typeof mesOrParams === 'object' ? response.pipe(
      mapPage<RegistroHora>()
    ) : response.pipe(extractData<RegistroHora>())) as Observable<RegistroHora[] | Page<RegistroHora>>;
  }

  getHorasGenerales(desde: Date, hasta: Date): Observable<UsuarioHorasGenerales[]> {
    return this.http.get<UsuarioHorasGenerales[]>(
      `${this.URL_COMPLETA}/usuario/usuario/horasGenerales?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`
    );
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.URL_COMPLETA}/registro-hora/categorias`);
  }

  createCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.URL_COMPLETA}/registro-hora/categorias`, categoria);
  }

  updateCategoria(codigo: string, categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.URL_COMPLETA}/registro-hora/categorias/${codigo}`, categoria);
  }

  deleteCategoria(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.URL_COMPLETA}/registro-hora/categorias/${codigo}`);
  }

  create(registro:RegistroHora): Observable<RegistroHora> {
    return this.http.post<RegistroHora>(`${this.URL_COMPLETA}/registro-hora`, registro);
  }

  update(registroId:number, registro:RegistroHora): Observable<RegistroHora> {
    return this.http.patch<RegistroHora>(`${this.URL_COMPLETA}/registro-hora/${registroId}`, registro);
  }

  delete(registroId:number): Observable<RegistroHora> {
    return this.http.delete<RegistroHora>(`${this.URL_COMPLETA}/registro-hora/${registroId}`);
  }

  exportExcel(desde: Date, hasta: Date): Observable<Blob> {
    return this.http.get(`${this.URL_COMPLETA}/registro-hora/importacion/export?fechaDesde=${desde.toISOString()}&fechaHasta=${hasta.toISOString()}`, { responseType: 'blob' });
  }
}

export interface RegistroHoraQuery {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  mes?: number;
  anio?: number;
  categoriaCodigo?: string;
  usuarioId?: string;
  usuario?: string;
  orderBy?: 'fecha' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

function mapPage<T>() {
  return (source: Observable<PaginatedResponse<T>>): Observable<Page<T>> => source.pipe(
    map(response => ({ data: response.registros, pagination: response.pagination }))
  );
}
