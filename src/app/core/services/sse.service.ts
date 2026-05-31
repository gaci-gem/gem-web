import {
  Injectable,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { Notificacion } from '@core/interfaces/notificacion';
import { environment } from '@/environments/environment';
import { AuthService } from '@core/services/auth';

@Injectable({ providedIn: 'root' })
export class SseService {
  private eventSource: EventSource | null = null;
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly notifications = signal<Notificacion[]>([]);
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.leida).length,
  );
  readonly connected = signal(false);

  private readonly BASE_URL = environment.BASE_URL;
  private readonly RECONNECT_BASE = 1000;
  private readonly RECONNECT_MAX = 30000;
  private readonly KEEPALIVE_INTERVAL = 30_000;
  private readonly KEEPALIVE_TIMEOUT = 90_000;
  private retryDelay = this.RECONNECT_BASE;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageTime = Date.now();
  private isDestroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  connect(): void {
    if (this.eventSource || this.isDestroyed) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.lastMessageTime = Date.now();

    this.eventSource = new EventSource(
      `${this.BASE_URL}/notificacion/sse?token=${encodeURIComponent(token)}`,
    );

    this.eventSource.onopen = () => {
      this.connected.set(true);
      this.retryDelay = this.RECONNECT_BASE;
      this.lastMessageTime = Date.now();
    };

    this.eventSource.onmessage = (event: MessageEvent) => {
      this.lastMessageTime = Date.now();

      // Heartbeat from server has event.type === 'heartbeat' and data === ''
      if (event.type === 'heartbeat') return;

      try {
        const data = JSON.parse(event.data);

        // Defensive: check if parsed data itself is a heartbeat signal
        if (data && data.type === 'heartbeat') return;

        const notif = data as Notificacion;
        this.notifications.update((list) => {
          if (list.some((n) => n.id !== undefined && n.id === notif.id))
            return list;
          return [notif, ...list].slice(0, 50);
        });

        this.retryDelay = this.RECONNECT_BASE;
      } catch {
        // ignore malformed
      }
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.connected.set(false);
      this.scheduleReconnect();
    };

    this.startKeepAlive();
  }

  disconnect(): void {
    this.isDestroyed = true;
    this.stopKeepAlive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
    this.connected.set(false);
  }

  /** Fuerza reconexión inmediata sin marcar como destruido */
  private forceReconnect(): void {
    this.stopKeepAlive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
    this.connected.set(false);
    this.retryDelay = this.RECONNECT_BASE;
    this.connect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isDestroyed) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.retryDelay = Math.min(this.retryDelay * 2, this.RECONNECT_MAX);
      this.connect();
    }, this.retryDelay);
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (Date.now() - this.lastMessageTime > this.KEEPALIVE_TIMEOUT) {
        this.forceReconnect();
      }
    }, this.KEEPALIVE_INTERVAL);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}
