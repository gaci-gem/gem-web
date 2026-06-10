# SDD Cycle: sse-notificaciones (Frontend)

**Estado**: ✅ Archivado
**Fecha**: 2026-05-28

## Resumen

Cliente SSE (Server-Sent Events) en Angular para recibir notificaciones en tiempo real. Implementado como `SseService` con Signals, reconexión exponential backoff, deduplicación y cap de 50 notificaciones.

## Archivos tocados

| Archivo                                                               | Acción     | Descripción                                                     |
| --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| `src/app/core/services/sse.service.ts`                                | Nuevo      | EventSource wrapper con Signals, reconnect, dedup, cap 50       |
| `src/app/views/shared/notification-dropdown/notification-dropdown.ts` | Modificado | Reemplaza polling de 30min con `effect()` que mergea SSE events |

## Decisiones técnicas

- Signal-based: `notifications()` es un `WritableSignal<Notificacion[]>`
- Dedup por `id` antes de pushear al signal
- Cap FIFO de 50 notificaciones en memoria
- Exponential backoff en reconexión (1s, 2s, 4s, 8s... max 30s)
- Filtro de heartbeats del backend (no se muestran al usuario)

## Tests

- **17 tests** en `sse.service.spec.ts` — todos pasando
- Cobertura: connect, disconnect, dedup, capping, heartbeat filtering, retry logic
