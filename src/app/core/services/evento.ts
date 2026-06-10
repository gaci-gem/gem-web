import { FiltroActivo } from '@/app/constants/filtros_activo';
import { environment } from '@/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Evento, Evento_requisito, Evento_requisito_completo, EventoCompleto, EventoDocumentacion, EventoVistaOpciones, EventoVistaResponse, NotionPageResult, VidaEvento } from '@core/interfaces/evento';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(cerrado: FiltroActivo = FiltroActivo.TRUE, estado: string | string[] = ''): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.URL_COMPLETA}/evento?cerrado=${cerrado}&estado=${estado}`);
  }

  getAllComplete(cerrado: FiltroActivo = FiltroActivo.ALL, params?: any): Observable<EventoCompleto[]> {
    let url = `${this.URL_COMPLETA}/evento/completo?cerrado=${cerrado}`;
    
    if (params) {
      if (params.estado) {
        url += `&estado=${params.estado}`;
      }
      if (params.desde) {
        url += `&desde=${params.desde}`;
      }
      if (params.hasta) {
        url += `&hasta=${params.hasta}`;
      }
      if (params.propio) {
        url += `&propio=${params.propio}`;
      }
    }
    
    return this.http.get<EventoCompleto[]>(url);
  }

  getAllCompleteByUsuario(usuarioId:string, params?: any): Observable<EventoCompleto[]> {
    let url = `${this.URL_COMPLETA}/evento/completo/usuario/${usuarioId}?cerrado=${FiltroActivo.FALSE}`;
    
    if (params) {
      if (params.estado) {
        url += `&estado=${params.estado}`;
      }
      if (params.desde) {
        url += `&desde=${params.desde}`;
      }
      if (params.hasta) {
        url += `&hasta=${params.hasta}`;
      }
    }
    
    return this.http.get<EventoCompleto[]>(url);
  }

  getById(eventoId: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.URL_COMPLETA}/evento/${eventoId}`);
  }

  getByIdCompleto(eventoId: string): Observable<EventoCompleto> {
    return this.http.get<EventoCompleto>(`${this.URL_COMPLETA}/evento/${eventoId}/completo`);
  }

  getEventoVista(eventoId: string, opciones?: EventoVistaOpciones): Observable<EventoVistaResponse> {
    let params = new HttpParams();

    if (opciones?.incluirActividad !== undefined) {
      params = params.set('incluirActividad', String(opciones.incluirActividad));
    }
    if (opciones?.incluirAdjuntos !== undefined) {
      params = params.set('incluirAdjuntos', String(opciones.incluirAdjuntos));
    }
    if (opciones?.incluirRequisitos !== undefined) {
      params = params.set('incluirRequisitos', String(opciones.incluirRequisitos));
    }
    if (opciones?.adjuntosActivo !== undefined) {
      params = params.set('adjuntosActivo', String(opciones.adjuntosActivo));
    }

    return this.http.get<EventoVistaResponse>(`${this.URL_COMPLETA}/evento/${eventoId}/vista`, { params });
  }

  getAdjuntos(eventoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL_COMPLETA}/evento/${eventoId}/adjuntos`);
  }

  getDocumentacion(eventoId: string): Observable<EventoDocumentacion[]> {
    return this.http.get<EventoDocumentacion[]>(`${this.URL_COMPLETA}/eventos/documentacion/evento/${eventoId}`);
  }

  getRequisitos(eventoId: string): Observable<Evento_requisito_completo[]> {
    return this.http.get<Evento_requisito_completo[]>(`${this.URL_COMPLETA}/evento/${eventoId}/requisitos`);
  }

  getActividad(eventoId: string): Observable<VidaEvento[]> {
    return this.http.get<VidaEvento[]>(`${this.URL_COMPLETA}/evento/${eventoId}/actividad`);
  }

  create(evento:Evento): Observable<Evento> {
    return this.http.post<Evento>(`${this.URL_COMPLETA}/evento`, evento);
  }

  createAdicional(formData:FormData): Observable<Evento> {
    return this.http.post<Evento>(`${this.URL_COMPLETA}/evento/adicional`, formData);
  }

  update(eventoId:string, evento:Evento): Observable<Evento> {
    return this.http.patch<Evento>(`${this.URL_COMPLETA}/evento/${eventoId}`, evento);
  }

  updateAdicional(eventoId:string, formData:FormData): Observable<Evento> {
    return this.http.patch<Evento>(`${this.URL_COMPLETA}/evento/${eventoId}/adicional`, formData);
  }

  delete(eventoId:string): Observable<Evento> {
    return this.http.delete<Evento>(`${this.URL_COMPLETA}/evento/${eventoId}`);
  }

  // importaciones

  descargarPlantilla(options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/evento/importacion/plantilla`, finalOptions);
  }

  exportarExcel(cerrado: FiltroActivo = FiltroActivo.TRUE, estado: string | string[] = '', options?: any): Observable<any> {
    const defaultOptions = { responseType: 'blob' as 'json' };
    const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
    return this.http.get<any>(`${this.URL_COMPLETA}/evento/importacion/export?cerrado=${cerrado}&estado=${estado}`, finalOptions);
  }

  importarExcel(formData:FormData): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/evento/importacion/excel`, formData);
  }

  getAdjuntoBlob(adjuntoId:number): Observable<Blob> {
    return this.http.get<Blob>(`${this.URL_COMPLETA}/evento/adjunto/${adjuntoId}`, { responseType: 'blob' as 'json' });
  }

  agregarAdicional(eventoId:string, formData:FormData): Observable<Evento> {
    return this.http.post<Evento>(`${this.URL_COMPLETA}/evento/adicion`, formData);
  }

  eliminarAdicional(eventoId:string, adicionId:string): Observable<Evento> {
    return this.http.delete<Evento>(`${this.URL_COMPLETA}/evento/adicion/${eventoId}/${adicionId}`);
  }

  toggleObservador(eventoId: string, usuarioId: string): Observable<any> {
    return this.http.post<any>(
      `${this.URL_COMPLETA}/evento/toggle-observador/${eventoId}/${usuarioId}`,
      {}
    );
  }

  // requisitos
  registrarEventoRequisito(eventoId: string, dto: any): Observable<any> {
    return this.http.post<any>(`${this.URL_COMPLETA}/evento/requisito/${eventoId}`, dto);
  }

  updateEventoRequisito(eventoId: string, requisitoId: string, dto: any): Observable<any> {
    return this.http.patch<any>(`${this.URL_COMPLETA}/evento/requisito/${eventoId}/${requisitoId}`, dto);
  }

  removeEventoRequisito(eventoId: string, requisitoId: string): Observable<any> {
    return this.http.delete<any>(`${this.URL_COMPLETA}/evento/requisito/${eventoId}/${requisitoId}`);
  }

  // documentacion

  getPaginasLibres(): Observable<NotionPageResult[]> {
    return this.http.get<NotionPageResult[]>(`${this.URL_COMPLETA}/eventos/documentacion/disponibles/notion`);
  }
  asociarPaginaNotion(eventoId: string, pages:NotionPageResult[]): Observable<EventoDocumentacion> {
    return this.http.post<EventoDocumentacion>(`${this.URL_COMPLETA}/eventos/documentacion/asociar/notion/${eventoId}`, pages );
  }
  desasociarPaginaNotion(docuId: string): Observable<EventoDocumentacion> {
    return this.http.delete<EventoDocumentacion>(`${this.URL_COMPLETA}/eventos/documentacion/desasociar/${docuId}` );
  }
  togglePaginaPrincipal(docuId: string): Observable<EventoDocumentacion> {
    return this.http.patch<EventoDocumentacion>(`${this.URL_COMPLETA}/eventos/documentacion/toggle-principal/${docuId}`, {} );
  }

}
