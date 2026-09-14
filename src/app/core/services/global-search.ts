import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';
import { GlobalSearchResult } from '@core/interfaces/global-search';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly http = inject(HttpClient);

  search(query: string, limit = 5): Observable<GlobalSearchResult[]> {
    const params = new HttpParams().set('q', query).set('limit', limit);
    return this.http.get<GlobalSearchResult[]>(`${environment.BASE_URL}/search`, { params });
  }
}
