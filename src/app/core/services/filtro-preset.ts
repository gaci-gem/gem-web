import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FiltroState, FiltroPreset } from '@core/interfaces/filtro-preset';

@Injectable({ providedIn: 'root' })
export class FiltroPresetService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.BASE_URL}/presets`;

  list(pantalla: string): Observable<FiltroPreset[]> { return this.http.get<FiltroPreset[]>(`${this.url}/${pantalla}`); }
  create(pantalla: string, nombre: string, filtros: FiltroState, esDefault = false): Observable<FiltroPreset> {
    return this.http.post<FiltroPreset>(`${this.url}/${pantalla}`, { nombre, filtros, esDefault });
  }
  update(pantalla: string, id: string, nombre: string, filtros: FiltroState, esDefault?: boolean): Observable<FiltroPreset> {
    return this.http.patch<FiltroPreset>(`${this.url}/${pantalla}/${id}`, { nombre, filtros, ...(esDefault === undefined ? {} : { esDefault }) });
  }
  remove(pantalla: string, id: string): Observable<{ deleted: boolean }> { return this.http.delete<{ deleted: boolean }>(`${this.url}/${pantalla}/${id}`); }
  setDefault(pantalla: string, id: string): Observable<FiltroPreset> { return this.http.post<FiltroPreset>(`${this.url}/${pantalla}/${id}/default`, {}); }
}
