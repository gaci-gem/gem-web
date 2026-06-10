# Makima Frontend — Agent Context & Skills

## Project Skills

| Skill             | Description                                                                                                      | Location                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `makima-frontend` | Angular 21 frontend conventions: standalone components, PrimeNG, routing, services, state management, SCSS, auth | [SKILL.md](skills/makima-frontend/SKILL.md) |

## Stack Overview

| Layer            | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Framework        | Angular 21 (standalone components, NO NgModules)                 |
| Change Detection | Zoneless (`provideZonelessChangeDetection()`)                    |
| UI Components    | PrimeNG 21 beta (Aura theme) + Bootstrap 5.3                     |
| Icons            | @ng-icons/core (Lucide + Tabler)                                 |
| State            | Angular signals + RxJS BehaviorSubject (NO NgRx)                 |
| Routing          | Flat lazy-loaded structure with auth + permission guards         |
| HTTP             | Functional interceptor (Bearer token + auto-refresh)             |
| Auth             | JWT (access + refresh tokens) via AuthService                    |
| RBAC             | PermissionGuard + PermisoVerGuard with `"RECURSO.ACCION"` format |
| Styles           | SCSS with 16 theme presets + dark mode                           |
| Testing          | Karma + Jasmine (sparse coverage)                                |
| Locale           | es-AR (Argentina Spanish)                                        |
| TypeScript       | Strict mode enabled                                              |
| Build            | Angular CLI 21 with SWC/esbuild                                  |

## Path Aliases

```
@core/*             → src/app/core/*
@views/*            → src/app/views/*
@layouts/*          → src/app/layouts/*
@app/components/*   → src/app/components/*
@common/*           → src/app/common/*
@/*                 → src/*
```

## Key Architecture Decisions

1. **100% standalone** — sin NgModules, todo es `@Component({ standalone: true, imports: [...] })`
2. **Zoneless** — no depende de zone.js para detección de cambios, usar signals + ChangeDetectorRef
3. **Sin NgRx** — estado manejado con signals y BehaviorSubject
4. **Flat routing** — todas las rutas feature son hijas de `path: ''`, agrupadas por layout
5. **CRUD base class** — `TrabajarCon<T>` como clase base abstracta para todas las vistas de listado ABM
6. **Dynamic Dialogs** — modales CRUD via PrimeNG `DialogService.open()`
7. **Functional interceptor** — `HttpInterceptorFn` (no class-based)
8. **16 themes** — sistema de temas SCSS configurables con persistencia en localStorage
9. **Dark mode** — Bootstrap `data-bs-theme` + PrimeNG `.my-app-dark`
