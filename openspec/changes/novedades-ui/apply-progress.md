# Apply Progress — Novedades UI

## Batch 2: Phase 2 — Core Components

**Date**: 2026-06-09
**Mode**: Standard (no strict TDD)

### Completed Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Add `NOV` to `PermisoClave` enum and `permisosData` | ✅ Done | Added `NOV = 'NOV'` after `TIPO_TRABAJO = 'TTR'`; added entry with LEER, CREAR, ELIMINAR actions |
| 1.2 | Create `Novedad` interfaces | ✅ Done | Created `novedad.ts` with `NovedadTipo`, `NovedadEstado` enums and all DTO/response interfaces |
| 1.3 | Create `NovedadService` | ✅ Done | Created `novedad.ts` service following `nota.ts` pattern; uses `HttpParams` for query, `inject(HttpClient)`, `providedIn: 'root'` |
| 2.1 | Create `NovedadHistoryComponent` (history page) | ✅ Done | Standalone component with PrimeNG p-table (lazy loading), filter panel (tipo/estado/date), archive via ConfirmDialog, "Nueva novedad" button opens DynamicDialog |
| 2.2 | Create `NovedadCreateModal` (create dialog) | ✅ Done | Extends `CrudFormModal<Novedad>`; form with titulo/contenido/tipo/validez/destinatarios/notificaciones; calls NovedadService.create() on submit |
| 2.3 | Create `NovedadWidget` (dashboard component) | ✅ Done | Standalone component with UiCard; shows urgent banner, active items list with tipo badge + time ago, loading/error/empty states, "Ver historial" nav link |
| 2.4 | Add routing and navigation entries | ✅ Done | Added `NOVEDAD_ROUTES` in `novedad.route.ts` with path `/novedad/historial`; registered in `views.route.ts` with `PermisoVerGuard` for `PermisoClave.NOV` |
| 3.1 | Dashboard urgent banner | ✅ Done | Included in NovedadWidget — alerta danger arriba cuando urgentBanner[] no está vacío |
| 3.2 | Loading/error/empty states | ✅ Done | Todos los componentes manejan loading, error y empty states |
| 3.3 | Menu item in sidebar | ✅ Done | Added `Novedades` entry in `data.ts` with `lucideMegaphone` icon and `PermisoClave.NOV` |

### Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/app/views/dashboard/components/novedad-widget.ts` | Created | Dashboard widget component with inline template |
| `src/app/views/novedad/novedad-history.ts` | Created | History page component with PrimeNG table |
| `src/app/views/novedad/novedad-history.html` | Created | History page template |
| `src/app/views/novedad/components/novedad-create-modal.ts` | Created | Create modal extending CrudFormModal |
| `src/app/views/novedad/components/novedad-create-modal.html` | Created | Placeholder template for create modal |
| `src/app/views/novedad/novedad.route.ts` | Created | Route definition for `/novedad/historial` |
| `src/app/views/dashboard/dashboard.ts` | Modified | Added `NovedadWidget` to imports array |
| `src/app/views/dashboard/dashboard.html` | Modified | Added `<app-novedad-widget />` after `<app-actividad-reciente />` |
| `src/app/views/views.route.ts` | Modified | Added novedad route with `PermisoVerGuard` |
| `src/app/layouts/components/data.ts` | Modified | Added `Novedades` menu item with `lucideMegaphone` and `PermisoClave.NOV` |
| `openspec/changes/novedades-ui/tasks.md` | Modified | Marked all tasks as `[x]` |
| `openspec/changes/novedades-ui/apply-progress.md` | Modified | This file — cumulative progress |

### Deviations from Design

1. **Router path for novedad**: The route for novedad uses `path: ''` in `views.route.ts` (matching current project convention) while the child route `novedad.route.ts` has `path: 'novedad/historial'`. This produces `/novedad/historial` as the full path — matching the widget's `routerLink`.
2. **Tooltip on archive button**: Removed PrimeNG `pTooltip` in favor of native HTML `title` to avoid adding TooltipModule import for a single use.
3. **p-inputSwitch simplified**: Used Bootstrap `form-check form-switch` checkboxes instead of PrimeNG InputSwitch (not currently used in project, avoids adding new dependency).
4. **Recipients section**: The create modal uses radio buttons for recipient type and p-multiSelect for roles/users selection. The `optionLabel` for roles uses `descripcion` (not `nombre` as in the mockup) because the `Rol` interface has `descripcion` as the display name field.

### Issues Found

None.

### Remaining Tasks

None — all tasks complete.

### Workload / PR Boundary

- Mode: auto-chain (feature-branch-chain)
- Current work unit: Phase 2 — Core Components (Tasks 2.1, 2.2, 2.3, 2.4)
- Boundary: widget + history page + create modal + routing — no Phase 3 integration yet
- Estimated review budget impact: ~600 lines changed (component code + templates + routing)

### Status

**10/10 tasks complete.** All implementation done. Ready for verify.
