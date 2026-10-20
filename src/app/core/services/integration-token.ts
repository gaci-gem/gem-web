import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@/environments/environment';
import { Observable } from 'rxjs';
import {
  IntegrationTokenRequest,
  IntegrationTokenResponse,
} from '@core/interfaces/integration-token';

@Injectable({ providedIn: 'root' })
export class IntegrationTokenService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.BASE_URL}/auth/integration-tokens`;
  private readonly externalEndpoint = `${environment.BASE_URL}/auth/integraciones-tokens`;

  create(
    request: IntegrationTokenRequest,
  ): Observable<IntegrationTokenResponse> {
    return this.http.post<IntegrationTokenResponse>(this.endpoint, request);
  }

  list(): Observable<IntegrationTokenResponse[]> {
    return this.http.get<IntegrationTokenResponse[]>(this.endpoint);
  }

  revoke(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  createExternal(request: IntegrationTokenRequest): Observable<IntegrationTokenResponse> {
    return this.http.post<IntegrationTokenResponse>(this.externalEndpoint, request);
  }
  listExternal(): Observable<IntegrationTokenResponse[]> {
    return this.http.get<IntegrationTokenResponse[]>(this.externalEndpoint);
  }
  revokeExternal(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.externalEndpoint}/${id}`);
  }
}
