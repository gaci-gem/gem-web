import { FiltroActivo } from '@/app/constants/filtros_activo';
import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Producto } from '@core/interfaces/producto';
import { Observable } from 'rxjs';

export interface ProductoPage { data: Producto[]; total: number; page: number; limit: number; totalPages: number; }
export interface ProductoListParams { globalSearch?: string; sigla?: string; nombre?: string; entornoCodigo?: string; page?: number; limit?: number; sortField?: 'id' | 'sigla' | 'nombre' | 'entornoCodigo' | 'activo'; sortDirection?: 'asc' | 'desc'; }

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(): Observable<Producto[]>;
  getAll(activo: FiltroActivo): Observable<Producto[]>;
  getAll(activo: FiltroActivo, params: ProductoListParams): Observable<ProductoPage>;
  getAll(activo: FiltroActivo = FiltroActivo.TRUE, params?: ProductoListParams): Observable<Producto[] | ProductoPage> {
    let httpParams = new HttpParams().set('activo', activo);
    Object.entries(params ?? {}).forEach(([key, value]) => { if (value !== undefined && value !== '') httpParams = httpParams.set(key, String(value)); });
    return this.http.get<Producto[] | ProductoPage>(`${this.URL_COMPLETA}/producto`, { params: httpParams });
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.URL_COMPLETA}/producto/${id}`);
  }

  create(producto:Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.URL_COMPLETA}/producto`, producto);
  }

  update(id:number, producto:Producto): Observable<Producto> {
    return this.http.patch<Producto>(`${this.URL_COMPLETA}/producto/${id}`, producto);
  }

  delete(id:number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.URL_COMPLETA}/producto/${id}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/producto/importacion/plantilla`, finalOptions);
  }

  exportarExcel(activo: FiltroActivo = FiltroActivo.TRUE, options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/producto/importacion/export?activo=${activo}`, finalOptions);
  }

  importarProductos(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/producto/importacion/excel`, formData);
  }

}
