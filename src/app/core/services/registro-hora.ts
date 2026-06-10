import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Categoria, HorasPorCategoriaResponse, RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { PaginatedResponse } from '@core/interfaces/paginated-response';
import { extractData } from '@core/operators/extract-data.operator';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroHoraService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(mes?: number, anio?: number, categoriaCodigo?: string): Observable<RegistroHora[]> {
    let url = `${this.URL_COMPLETA}/registro-hora`;
    const params: string[] = [];
    if (mes !== undefined && anio !== undefined) {
      params.push(`mes=${mes}`, `anio=${anio}`);
    }
    if (categoriaCodigo) {
      params.push(`categoriaCodigo=${categoriaCodigo}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<PaginatedResponse<RegistroHora>>(url).pipe(
      extractData<RegistroHora>()
    );
  }

  getPorCategoria(eventoId: string): Observable<HorasPorCategoriaResponse> {
    return this.http.get<HorasPorCategoriaResponse>(
      `${this.URL_COMPLETA}/registro-hora/evento/${eventoId}/por-categoria`
    );
  }

  getById(registroId: number): Observable<RegistroHora> {
    return this.http.get<RegistroHora>(`${this.URL_COMPLETA}/registro-hora/${registroId}`);
  }

  getByUsuario(usuarioId: string, mes?: number, anio?: number): Observable<RegistroHora[]> {
    let url = `${this.URL_COMPLETA}/registro-hora/usuario/${usuarioId}`;
    if (mes !== undefined && anio !== undefined) {
      url += `?mes=${mes}&anio=${anio}`;
    }
    return this.http.get<PaginatedResponse<RegistroHora>>(url).pipe(
      extractData<RegistroHora>()
    );
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
