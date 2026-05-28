# SDD Cycles — GEM Frontend

> Spec-Driven Development: cambios planificados e implementados en el frontend de GEM.

## Ciclos Completados

| Ciclo                                                           | Fecha      | Estado       | Descripción                                                |
| --------------------------------------------------------------- | ---------- | ------------ | ---------------------------------------------------------- |
| [sse-notificaciones](./sse-notificaciones.md)                   | 2026-05-28 | ✅ Archivado | Servicio SSE + integración en NotificationDropdown         |
| [eventos-usuario-sse-refresh](./eventos-usuario-sse-refresh.md) | 2026-05-28 | ✅ Archivado | Tests para auto-refresh por SSE en EventosUsuarioComponent |

## Convenciones

- **Modo de persistencia**: Engram (artefactos en memoria)
- **Testing**: Jasmine + Angular TestBed + fakeAsync
- **SSE**: `effect()` + `cdr.detectChanges()` para zoneless Angular
