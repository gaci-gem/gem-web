---
name: makima-frontend
description: >
  Angular 21 frontend conventions for the Makima (GEM) project.
  Trigger: When working on Makima frontend — any file in src/, or adding new views/components/services.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Crear o modificar vistas (pages) en `src/app/views/`
- Agregar componentes compartidos en `src/app/components/`
- Trabajar con servicios, interceptors, guards, pipes, directivas
- Definir rutas y lazy loading
- Usar PrimeNG o Bootstrap components
- Manejar estado con signals o BehaviorSubject
- Escribir tests unitarios
- Configurar temas, estilos SCSS, o dark mode

## Critical Patterns

### 1. Standalone Components (NO NgModules)

El proyecto es **100% standalone** — no existen NgModules. Cada componente, pipe, directiva declara sus imports directamente:

```typescript
@Component({
  selector: 'app-roles',
  imports: [UiCard, TableModule, NgIcon, ToolbarModule, /* PrimeNG modules */],
  providers: [DialogService, MessageService, ConfirmationService],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles extends TrabajarCon<Rol> { ... }
```

La app se bootstrapa con `bootstrapApplication(App, appConfig)` en `main.ts`.

### 2. App Config (app.config.ts)

Toda la configuración global está en `src/app/app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideZonelessChangeDetection(), provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideAnimationsAsync(), providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: ".my-app-dark" } } }), { provide: LOCALE_ID, useValue: "es-AR" }],
};
```

Puntos clave:

- **Zoneless**: `provideZonelessChangeDetection()` — NO usar zone.js, usar signals + ChangeDetectorRef
- **Interceptor funcional**: `withInterceptors([authInterceptor])` — NO class-based interceptors
- **PrimeNG standalone**: `providePrimeNG()` con Aura theme, dark mode via `.my-app-dark`
- **Locale**: `es-AR` para todo el proyecto

### 3. Naming Conventions

| Elemento               | Convención             | Ejemplo                                           |
| ---------------------- | ---------------------- | ------------------------------------------------- |
| Archivos               | `kebab-case.ts`        | `vertical-layout.ts`, `auth-interceptor.ts`       |
| Componentes (selector) | `app-{name}`           | `app-roles`, `app-ui-card`                        |
| Clases de componentes  | PascalCase             | `Roles`, `VerticalLayout`, `StatusBadgeComponent` |
| Servicios              | PascalCase + `Service` | `AuthService`, `LayoutStoreService`               |
| Interfaces             | PascalCase             | `Usuario`, `EventoCompleto`                       |
| Enums                  | PascalCase             | `PermisoClave`, `FiltroActivo`                    |
| Rutas (constantes)     | UPPER_SNAKE            | `VIEWS_ROUTES`, `USUARIOS_ROUTES`                 |
| Pipes                  | camelCase name         | `booleanLabel`, `padZero`                         |
| Directivas             | camelCase selector     | `appShortcut`, `choicesSelect`                    |
| Carpetas               | kebab-case             | `vertical-layout`, `crud-form-modal`              |

### 4. Path Aliases (SIEMPRE usarlos)

```typescript
// ✅ Correcto
import { UiCard } from "@app/components/ui-card";
import { AuthService } from "@core/services/auth";
import { Roles } from "@views/rol/roles";
import { environment } from "@/environments/environment";

// ❌ Incorrecto - rutas relativas largas
import { AuthService } from "../../core/services/auth";
```

Aliases disponibles:

- `@core/*` → `src/app/core/*`
- `@views/*` → `src/app/views/*`
- `@layouts/*` → `src/app/layouts/*`
- `@app/components/*` → `src/app/components/*`
- `@common/*` → `src/app/common/*`
- `@/*` → `src/*`

### 5. Routing Pattern

**Estructura plana con lazy loading:**

```
app.routes.ts                    ← Root routes (empty path grouping)
views/views.route.ts             ← Hub que importa todas las rutas feature
views/{feature}/{feature}.route.ts ← Rutas de cada feature
```

**Root routes:**

```typescript
export const routes: Routes = [
  { path: "", redirectTo: "/dashboard", pathMatch: "full" },
  { path: "", component: VerticalLayout, loadChildren: () => import("./views/views.route").then((m) => m.VIEWS_ROUTES), canActivate: [authGuard] },
  { path: "", loadChildren: () => import("./views/auth/auth.route").then((m) => m.Auth_ROUTES) }, // Sin guard
  { path: "**", redirectTo: "error/404" },
];
```

**Feature routes:**

```typescript
export const USUARIOS_ROUTES: Routes = [
  { path: "usuario/usuarios", component: Usuarios, data: { title: "Usuarios", permisoClave: PermisoClave.USUARIO }, canActivate: [PermisoVerGuard] },
  { path: "usuario/perfil/:id", component: Usuario, data: { title: "Perfil de Usuario", isPublic: true } },
];
```

**URL Convention:** `/{feature}/{resource}` o `/{feature}/{resource}/:id`
(Ej: `/evento/eventos`, `/evento/evento/:id`, `/usuario/usuarios`)

### 6. Service Pattern

```typescript
@Injectable({ providedIn: "root" })
export class EventoService {
  private http = inject(HttpClient);
  URL_COMPLETA = environment.BASE_URL;

  getAll(param: string): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.URL_COMPLETA}/evento?param=${param}`);
  }

  create(data: Evento): Observable<Evento> {
    return this.http.post<Evento>(`${this.URL_COMPLETA}/evento`, data);
  }

  update(id: string, data: Evento): Observable<Evento> {
    return this.http.patch<Evento>(`${this.URL_COMPLETA}/evento/${id}`, data);
  }

  delete(id: string): Observable<Evento> {
    return this.http.delete<Evento>(`${this.URL_COMPLETA}/evento/${id}`);
  }
}
```

Reglas:

- `providedIn: 'root'` — singleton services
- `inject()` function para DI (o constructor injection)
- `environment.BASE_URL` prepended a todas las llamadas
- CRUD standard: `getAll`, `getById`, `create` (POST), `update` (PATCH), `delete` (DELETE)
- Files: retornar `blob`, upload con `FormData`

### 7. State Management

**NO hay NgRx.** Usar:

1. **Angular Signals** para estado de UI:

   ```typescript
   state = signal<LayoutState>({ ... });
   searchValue = signal('');
   ```

2. **RxJS BehaviorSubject** para estado compartido/complejo:

   ```typescript
   private loadingSubject = new BehaviorSubject<boolean>(false);
   loading$ = this.loadingSubject.asObservable();
   ```

3. **localStorage/sessionStorage** para tokens y preferencias

### 8. Component Patterns

**Base class CRUD — `TrabajarCon<T>`:**
Extender para vistas de listado con ABM:

```typescript
export class Roles extends TrabajarCon<Rol> { ... }
```

Provee: `loadItems()`, `alta()`, `editar()`, `eliminarDirecto()`, `searchValue`, `filtroActivo`, Excel import/export, toasts, confirm dialog, permission checking.

**Dynamic Dialog para modales CRUD:**

```typescript
this.ref = this.dialogService.open(UsuarioCrud, { header, data, ...modalConfig });
this.ref.onClose.subscribe((result) => { ... });
```

**Zoneless:** Usar `ChangeDetectorRef` para marcar cambios cuando sea necesario.

### 9. PrimeNG + Bootstrap

**PrimeNG**:

- Configurado via `providePrimeNG()` con Aura theme
- Componentes importados directamente en cada standalone component (NO NgModules)
- Traducciones al español via `primeng.setTranslation(PRIMENG_ES)`
- Módulos comunes: `TableModule`, `ToastModule`, `ConfirmDialogModule`, `ToolbarModule`, `SelectModule`, `DialogModule`, `DynamicDialog`, `FileUploadModule`, `InputMask`, `TooltipModule`

**Bootstrap 5.3**:

- Importado via SCSS en `assets/scss/app.scss`
- Dark mode via atributo `data-bs-theme` y clase `.my-app-dark` (PrimeNG)
- 16 temas de color configurables (spotify, gaci, material, slack, etc.)

### 10. Interceptors

**Único interceptor funcional** para auth:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  // Attach Bearer token
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token refresh + retry
        // Logout on refresh failure
      }
      return throwError(() => error);
    }),
  );
};
```

### 11. Guards

| Guard             | Tipo                         | Función                                                          |
| ----------------- | ---------------------------- | ---------------------------------------------------------------- |
| `authGuard`       | Functional (`CanActivateFn`) | Verifica token, redirige a `/login` con `returnUrl`              |
| `PermisoVerGuard` | Class-based (`CanActivate`)  | Verifica permiso de lectura del recurso, redirige a `/error/403` |
| `PublicGuard`     | Class-based                  | Siempre retorna `true`                                           |

### 12. Auth & RBAC

- Tokens en `localStorage` (remember me) o `sessionStorage`
- `AuthService.login()` → almacena access_token, refresh_token, user, permissions
- `AuthService.logout()` → limpia todo, detiene heartbeat
- Permisos en formato `"RECURSO.ACCION"` (ej: `EVT.LEER`, `SYS.ADMIN`)
- `PermisoAccion` enum: `LEER, CREAR, MODIFICAR, ELIMINAR, REASIGNAR, ...`
- `PermisoClave` enum: 13 recursos (`EVT, CLI, PRO, USR, MOD, ENT, PRD, ETA, TEV, ROL, REP, SYS, KB`)

### 13. SCSS Architecture

```
assets/scss/
├── _variables.scss            # Bootstrap variable overrides
├── _variables-dark.scss        # Dark mode variables
├── app.scss                    # Main entry
├── config/                     # 16 theme presets
├── structure/                  # Layout (topbar, sidenav, footer)
├── components/                 # Bootstrap component overrides (buttons, cards, tables, etc.)
├── pages/                      # Page-specific styles
└── plugins/                    # Third-party overrides (choice, dropzone, etc.)
```

### 14. Icons

Sistema de iconos via `@ng-icons/core` con Lucide + Tabler:

```typescript
// En providers del root component:
viewProviders: [provideIcons({ ...tablerIcons, ...tablerIconsFill, ...lucideIcons })]

// En templates:
<ng-icon name="tablerRefresh"></ng-icon>
<ng-icon name="lucideSearch"></ng-icon>
```

### 15. Testing

- Framework: Karma + Jasmine
- Config: `@angular/build:karma`
- Tests existentes: muy pocos (6 spec files encontrados)
- Patrón standard:
  ```typescript
  describe("App", () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [provideZonelessChangeDetection()],
      }).compileComponents();
    });
    it("should create", () => {
      const fixture = TestBed.createComponent(App);
      expect(fixture.componentInstance).toBeTruthy();
    });
  });
  ```

## Commands

```bash
# Development
npm start                        # ng serve

# Build
npm run build                    # ng build (development)
npm run build:gaci               # Build production GACI
npm run build:gaciTest           # Build test environment

# Testing
npm test                         # Karma + Jasmine
```

## Resources

- **Backend API**: See backend `.agent/domain/evento.md` for event business domain
- **RBAC Permissions**: See `@core/services/permisos.ts` for permission logic
