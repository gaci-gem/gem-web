import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { EmailTemplateCatalogItem, EmailTemplateConfig, EmailTemplatePayload, EmailTemplatePreview } from '@core/interfaces/email-template';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.BASE_URL}/email-templates`;

  list(): Observable<EmailTemplateCatalogItem[]> {
    return this.http.get<EmailTemplateCatalogItem[]>(this.url);
  }

  get(clave: string): Observable<EmailTemplateConfig> {
    return this.http.get<EmailTemplateConfig>(`${this.url}/${clave}`);
  }

  update(clave: string, payload: EmailTemplatePayload): Observable<EmailTemplateConfig> {
    return this.http.patch<EmailTemplateConfig>(`${this.url}/${clave}`, payload);
  }

  preview(clave: string, payload: EmailTemplatePayload): Observable<EmailTemplatePreview> {
    return this.http.post<EmailTemplatePreview>(`${this.url}/${clave}/preview`, payload);
  }

  sendTest(clave: string, email: string, payload: EmailTemplatePayload): Observable<{ enviado: boolean }> {
    return this.http.post<{ enviado: boolean }>(`${this.url}/${clave}/test`, { email, ...payload });
  }

  previewEventoAsignadoMarkdown(markdown: string): Observable<{ clave: string; html: string }> {
    return this.previewMarkdown('evento-asignado', markdown);
  }

  previewMarkdown(clave: string, markdown: string): Observable<{ clave: string; html: string; variables: string[] }> {
    return this.http.post<{ clave: string; html: string; variables: string[] }>(`${this.url}/prototype/markdown-preview`, { clave, markdown });
  }
}
