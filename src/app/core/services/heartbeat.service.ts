import { environment } from '@/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeartbeatService {
  private readonly endpoint = `${environment.BASE_URL}/activity/heartbeat`;
  private readonly intervalMs = 180_000; // 3 minutos
  private readonly accessTokenKey = 'access_token';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly http: HttpClient) { }

  start(): void {
    if (this.intervalId || !this.isAuthenticated()) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.sendHeartbeat();
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private sendHeartbeat(): void {
    if (!this.isAuthenticated()) {
      this.stop();
      return;
    }

    this.http.post<void>(this.endpoint, null).subscribe({
      error: () => {
      }
    });
  }

  private isAuthenticated(): boolean {
    return !!(localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey));
  }
}