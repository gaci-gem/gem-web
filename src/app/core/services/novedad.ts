import { environment } from "@/environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  CreateNovedadDto,
  DashboardResponse,
  Novedad,
  PaginatedNovedadResponse,
  QueryNovedadDto
} from "@core/interfaces/novedad";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NovedadService {
    private http = inject(HttpClient);
    URL_COMPLETA = environment.BASE_URL;

    getAll(query: QueryNovedadDto): Observable<PaginatedNovedadResponse> {
        let params = new HttpParams();

        if (query.tipo) { params = params.set('tipo', query.tipo); }
        if (query.estado) { params = params.set('estado', query.estado); }
        if (query.fechaDesde) { params = params.set('fechaDesde', query.fechaDesde); }
        if (query.fechaHasta) { params = params.set('fechaHasta', query.fechaHasta); }
        if (query.createdById) { params = params.set('createdById', query.createdById); }
        if (query.page !== undefined) { params = params.set('page', query.page); }
        if (query.limit !== undefined) { params = params.set('limit', query.limit); }

        return this.http.get<PaginatedNovedadResponse>(`${this.URL_COMPLETA}/novedad`, { params });
    }

    getDashboard(limit?: number): Observable<DashboardResponse> {
        let params = new HttpParams();
        if (limit !== undefined) { params = params.set('limit', limit); }

        return this.http.get<DashboardResponse>(`${this.URL_COMPLETA}/novedad/dashboard`, { params });
    }

    getById(id: number): Observable<Novedad> {
        return this.http.get<Novedad>(`${this.URL_COMPLETA}/novedad/${id}`);
    }

    create(dto: CreateNovedadDto): Observable<Novedad> {
        return this.http.post<Novedad>(`${this.URL_COMPLETA}/novedad`, dto);
    }

    archive(id: number): Observable<Novedad> {
        return this.http.post<Novedad>(`${this.URL_COMPLETA}/novedad/${id}/archivar`, {});
    }
}
