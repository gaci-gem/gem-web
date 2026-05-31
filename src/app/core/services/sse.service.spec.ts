import { TestBed } from '@angular/core/testing';
import { SseService } from './sse.service';
import { AuthService } from './auth';

describe('SseService', () => {
  let service: SseService;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let mockEventSource: jasmine.SpyObj<EventSource>;
  let eventSourceInstance: any;

  function createMockEventSource(): any {
    const es = jasmine.createSpyObj('EventSource', ['close']);
    es.onmessage = null;
    es.onerror = null;
    return es;
  }

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    authServiceMock.getAccessToken.and.returnValue('test-token-123');

    eventSourceInstance = createMockEventSource();
    mockEventSource = eventSourceInstance;

    (window as any).EventSource = jasmine
      .createSpy('EventSource')
      .and.returnValue(eventSourceInstance);

    TestBed.configureTestingModule({
      providers: [
        SseService,
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(SseService);
    (service as any).isDestroyed = false;
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty notifications and zero unread count', () => {
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    expect(service.connected()).toBeFalse();
  });

  it('should not connect when no token is available', () => {
    authServiceMock.getAccessToken.and.returnValue(null);
    service.connect();
    expect(service.connected()).toBeFalse();
    expect((window as any).EventSource).not.toHaveBeenCalled();
  });

  it('should connect when token is available and create EventSource with correct URL', () => {
    service.connect();
    eventSourceInstance.onopen();
    expect(service.connected()).toBeTrue();
    expect((window as any).EventSource).toHaveBeenCalledWith(
      '/notificacion/sse?token=test-token-123',
    );
  });

  it('should set connected to false on disconnect', () => {
    service.connect();
    eventSourceInstance.onopen();
    expect(service.connected()).toBeTrue();
    service.disconnect();
    expect(service.connected()).toBeFalse();
  });

  it('should handle duplicate connect calls gracefully', () => {
    service.connect();
    eventSourceInstance.onopen();
    service.connect();
    expect(service.connected()).toBeTrue();
    expect((window as any).EventSource).toHaveBeenCalledTimes(1);
  });

  it('should not reconnect after disconnect', () => {
    service.connect();
    service.disconnect();
    expect(service.connected()).toBeFalse();

    (service as any).scheduleReconnect();
    expect((service as any).reconnectTimer).toBeNull();
  });

  it('should reset retry delay on successful message', () => {
    (service as any).retryDelay = 16000;
    service.connect();

    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({
        id: 1,
        mensaje: 'Test',
        leida: false,
        createdAt: new Date().toISOString(),
      }),
    });
    eventSourceInstance.onmessage(mockEvent);
    expect((service as any).retryDelay).toBe(1000);
  });

  it('should parse incoming SSE message into notifications signal', () => {
    service.connect();

    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({
        id: 1,
        mensaje: 'Nueva notificación',
        leida: false,
        createdAt: new Date().toISOString(),
      }),
    });
    eventSourceInstance.onmessage(mockEvent);

    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].mensaje).toBe('Nueva notificación');
    expect(service.notifications()[0].id).toBe(1);
  });

  it('should deduplicate notifications by id', () => {
    service.connect();

    const payload = {
      id: 1,
      mensaje: 'Duplicado',
      leida: false,
      createdAt: new Date().toISOString(),
    };
    eventSourceInstance.onmessage(
      new MessageEvent('message', { data: JSON.stringify(payload) }),
    );
    eventSourceInstance.onmessage(
      new MessageEvent('message', { data: JSON.stringify(payload) }),
    );

    expect(service.notifications().length).toBe(1);
  });

  it('should cap notifications at 50', () => {
    service.connect();

    for (let i = 0; i < 60; i++) {
      eventSourceInstance.onmessage(
        new MessageEvent('message', {
          data: JSON.stringify({
            id: i,
            mensaje: `Notif ${i}`,
            leida: false,
            createdAt: new Date().toISOString(),
          }),
        }),
      );
    }

    expect(service.notifications().length).toBe(50);
    expect(service.notifications()[0].id).toBe(59);
    expect(service.notifications()[49].id).toBe(10);
  });

  it('should ignore malformed SSE messages', () => {
    service.connect();

    eventSourceInstance.onmessage(
      new MessageEvent('message', { data: 'not-json' }),
    );

    expect(service.notifications().length).toBe(0);
  });

  it('should ignore heartbeat events', () => {
    service.connect();

    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({ type: 'heartbeat' }),
      }),
    );

    expect(service.notifications().length).toBe(0);
  });

  it('should compute unread count from notifications', () => {
    service.connect();

    const ts = new Date().toISOString();
    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({
          id: 1,
          mensaje: 'A',
          leida: false,
          createdAt: ts,
        }),
      }),
    );
    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({
          id: 2,
          mensaje: 'B',
          leida: true,
          createdAt: ts,
        }),
      }),
    );
    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({
          id: 3,
          mensaje: 'C',
          leida: false,
          createdAt: ts,
        }),
      }),
    );

    expect(service.unreadCount()).toBe(2);
  });

  it('should prepend new notifications to the beginning of the list', () => {
    service.connect();

    const ts = new Date().toISOString();
    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({
          id: 1,
          mensaje: 'First',
          leida: false,
          createdAt: ts,
        }),
      }),
    );
    eventSourceInstance.onmessage(
      new MessageEvent('message', {
        data: JSON.stringify({
          id: 2,
          mensaje: 'Second',
          leida: false,
          createdAt: ts,
        }),
      }),
    );

    expect(service.notifications()[0].id).toBe(2);
    expect(service.notifications()[1].id).toBe(1);
  });

  it('should trigger scheduleReconnect on EventSource error', () => {
    const scheduleSpy = spyOn(service as any, 'scheduleReconnect');
    service.connect();

    eventSourceInstance.onerror(new Event('error'));

    expect(scheduleSpy).toHaveBeenCalled();
  });

  it('should set connected to false and nullify EventSource on error', () => {
    service.connect();
    eventSourceInstance.onopen();
    expect(service.connected()).toBeTrue();

    eventSourceInstance.onerror(new Event('error'));

    expect(service.connected()).toBeFalse();
    expect((service as any).eventSource).toBeNull();
  });
});
