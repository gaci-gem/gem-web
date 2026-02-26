import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RegistroHora, UsuarioHorasGenerales } from '@core/interfaces/registro-hora';
import { PaginatedResponse } from '@core/interfaces/paginated-response';
import { extractData } from '@core/operators/extract-data.operator';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroHoraService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(mes?: number, anio?: number): Observable<RegistroHora[]> {
    let url = `${this.URL_COMPLETA}/registro-hora`;
    if (mes !== undefined && anio !== undefined) {
      url += `?mes=${mes}&anio=${anio}`;
    }
    return this.http.get<PaginatedResponse<RegistroHora>>(url).pipe(
      extractData<RegistroHora>()
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
