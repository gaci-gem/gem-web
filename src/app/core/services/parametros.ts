import { environment } from "@/environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Parametro } from "@core/interfaces/parametro";
import { map, Observable } from "rxjs";

export interface ParametroPage { data: Parametro[]; total: number; page: number; limit: number; totalPages: number; }
export interface ParametroListParams { globalSearch?: string; clave?: string; valor?: string; tipo?: string; ambito?: string; descripcion?: string; page?: number; limit?: number; sortField?: 'clave' | 'valor' | 'tipo' | 'ambito' | 'descripcion'; sortDirection?: 'asc' | 'desc'; }


@Injectable({
  providedIn: 'root'
})
export class ParametroService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<Parametro[]>;
  getAll(params: ParametroListParams): Observable<ParametroPage>;
  getAll(params?: ParametroListParams): Observable<Parametro[] | ParametroPage> {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<Parametro[] | ParametroPage>(`${this.URL_COMPLETA}/parametros`, { params: httpParams });
  }

  getById(id: string): Observable<Parametro> {
    return this.http.get<Parametro>(`${this.URL_COMPLETA}/parametros/${id}`);
  }

  create(parametro: Parametro): Observable<Parametro> {
    return this.http.post<Parametro>(`${this.URL_COMPLETA}/parametros`, parametro);
  }

  update(id:string, parametro:Parametro): Observable<Parametro> {
    return this.http.patch<Parametro>(`${this.URL_COMPLETA}/parametros/${id}`, parametro);
  }
  updateByCodigo(codigo:string, parametro:Parametro): Observable<Parametro> {
    return this.http.patch<Parametro>(`${this.URL_COMPLETA}/parametros/codigo/${codigo}`, parametro);
  }

  delete(id:string): Observable<Parametro> {
    return this.http.delete<Parametro>(`${this.URL_COMPLETA}/parametros/${id}`);
  }
  

  getParametroActivo(parametroCodigo: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.URL_COMPLETA}/parametros/activo/${parametroCodigo}`).pipe(
        map((res:any) => {
          return res.activo as boolean;
        })
    );
  }

}
