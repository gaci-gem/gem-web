# Delta Specs: Categorización de Horas Trabajadas — Frontend

## Domain 1: Data Models / Interfaces

### ADDED Requirements

#### Requirement: TipoTrabajo interface

The system SHALL define a `TipoTrabajo` interface representing a work category with code, display name, and color.

```
export interface TipoTrabajo {
  codigo: string;
  descripcion: string;
  color: string;
  activo?: boolean;
}
```

#### Scenario: TipoTrabajo is used in Hora and EventoCompleto

- GIVEN the existing `Hora` interface in `registro-hora.ts`
- WHEN the backend returns a `Hora` with `categoriaCodigo` and nested `categoria` object
- THEN `Hora` SHALL include `categoriaCodigo?: string` and `categoria?: TipoTrabajo`

- GIVEN the existing `EventoCompleto` interface in `evento.ts`
- WHEN the `GET /eventos/:id/vista` response includes `categoriaSugerida`
- THEN `EventoCompleto` SHALL include `categoriaSugerida?: TipoTrabajo | null`

#### Requirement: HorasPorCategoria response interface

The system SHALL define an interface for the `GET /registro-hora/evento/:eventoId/por-categoria` response.

```
export interface CategoriaHoras {
  codigo: string;
  descripcion: string;
  color?: string;
  totalHoras: number;
  totalFormateado: string;
  cantidadRegistros: number;
}

export interface HorasPorCategoriaResponse {
  eventoId: string;
  categorias: CategoriaHoras[];
  totalGeneral: number;
  totalGeneralFormateado: string;
}
```

#### Requirement: Hardcoded category catalog constant

The system SHALL define a constant `TIPOS_TRABAJO: TipoTrabajo[]` in a new file `src/app/constants/tipo-trabajo.ts` with the 8 seed values:

| codigo | descripcion | color |
|--------|-------------|-------|
| DEV | Desarrollo | #2196F3 |
| TEST | Testing | #4CAF50 |
| ANAL | Análisis | #FF9800 |
| REV | Revisión de código | #9C27B0 |
| DESIGN | Diseño | #E91E63 |
| ADMIN | Administrativo | #607D8B |
| MEET | Reunión | #795548 |
| OTHER | Otros | #9E9E9E |

#### Scenario: Sin categoría handling

- GIVEN a `Hora` with `categoriaCodigo` === `null` or `undefined`
- WHEN displayed in any UI table
- THEN it SHALL render as "Sin categoría" with no color indicator

---

## Domain 2: UI — Category Select Component

### ADDED Requirements

#### Requirement: Category select with visual indicators

The system SHALL render a `p-select` (PrimeNG `SelectModule`) for each hora row in the CRUD modal, where each option displays:
- A colored circle indicator (using `categoria.color`)
- The `categoria.descripcion` text label
- A tooltip with the description on hover (PrimeNG `TooltipModule` or `p-tooltip`)

#### Scenario: Default rendering

- GIVEN the user opens the HoraCrud modal in add mode
- WHEN a new hora row is added
- THEN the category select SHALL be rendered with placeholder "Categoría..." and all 8 options from `TIPOS_TRABAJO`

#### Scenario: Category option template

- GIVEN the category dropdown is open
- WHEN listing options
- THEN each option SHALL render as `<span class="flex align-items-center gap-2"><span class="categoria-color-indicator" [style.background]="item.color"></span>{{ item.descripcion }}</span>`
- AND SHALL use PrimeNG `p-select` with custom `itemTemplate`

#### Scenario: No category (null value)

- GIVEN the user has not selected a category
- WHEN the form saves
- THEN `categoriaCodigo` SHALL be `null` in the payload (not sent or sent as null)

---

## Domain 3: UI — Hours Form (HoraCrud)

### ADDED Requirements

#### Requirement: categoriaCodigo form control per hora row

The system SHALL add a `categoriaCodigo` form control (`FormControl<string | null>`) to each `FormGroup` in `createHoraForm()`.

#### Scenario: Form creation

- GIVEN `createHoraForm()` is called
- WHEN a new FormGroup is built
- THEN it SHALL include `categoriaCodigo: new FormControl<string | null>(null)`

- GIVEN `populateForm()` is called for an existing `RegistroHora`
- WHEN mapping horas data to form controls
- THEN `categoriaCodigo` SHALL be populated from `hora.categoriaCodigo`

#### Requirement: toModel() includes categoriaCodigo

The system SHALL include `categoriaCodigo` in the `toModel()` output for each hora.

#### Scenario: Save with category

- GIVEN the user has selected "DEV" in the category combo
- WHEN `toModel()` is called
- THEN each hora object SHALL include `categoriaCodigo: "DEV"`

#### Requirement: Precarga from categoriaSugerida

The system SHALL pre-fill the `categoriaCodigo` control when the modal receives `categoriaSugerida` from the calling context.

#### Scenario: Opening modal from event detail with categoriaSugerida

- GIVEN `HoraCrud` receives `categoriaSugerida` in its modal data (via `CrudFormModal.data`)
- WHEN `ngOnInit()` runs and creates the first hora row
- THEN the first hora's `categoriaCodigo` SHALL be set to `categoriaSugerida.codigo`

- GIVEN `categoriaSugerida` is `null`
- WHEN the modal opens
- THEN the category select SHALL remain without preselected value

#### Scenario: Adding new rows after precarga

- GIVEN the first row was pre-filled with `categoriaSugerida.codigo`
- WHEN the user clicks "Add row" (`addHora()`)
- THEN subsequent rows SHALL NOT inherit the precarga value (they start empty)

---

## Domain 4: UI — Hours List (Tables)

### ADDED Requirements

#### Requirement: Category column in horas table (admin view)

The system SHALL display a "Categoría" column in the expanded horas sub-table inside `horas.html` (admin `Horas` component).

#### Scenario: Admin view with category column

- GIVEN the admin `Horas` component loads registered hours
- WHEN expanding a row to see individual horas in the nested table
- THEN each hora row SHALL display a column "Categoría" showing:
  - A colored circle (using `hora.categoria.color`)
  - The `hora.categoria.descripcion` label
  - For null category: "Sin categoría" in gray, no circle

#### Requirement: Category column in horas-usuario table

The system SHALL display the same "Categoría" column in `horas-usuario.html` (user `HorasUsuario` component), following the same rendering rules.

#### Requirement: Filter by category in admin horas view

The system SHALL add a category filter in the admin `Horas` component, using a PrimeNG `p-select` in the toolbar area.

#### Scenario: Category filter in toolbar

- GIVEN the admin `Horas` component
- WHEN the user selects a category from the filter dropdown
- THEN the `horasGenerales` list SHALL be filtered to show only hours rows that have at least one hora with that category

- GIVEN the filter is set to a category
- AND the user clears the filter
- THEN all hours rows SHALL be shown again

#### Requirement: Category filter requests backend

The system SHALL pass `categoriaCodigo` as a query parameter to `GET /registro-hora` when filtering by category.

#### Scenario: Backend filter integration

- GIVEN the user selects "DEV" in the category filter
- WHEN `consultarRegistros()` executes
- THEN the service call SHALL include `categoriaCodigo=DEV` in the query params

---

## Domain 5: UI — Evento Detail (Eventov2)

### ADDED Requirements

#### Requirement: "Cargar horas" button in EventoV2

The system SHALL add a "Cargar horas" button in the `EventoV2DetailsFilesComponent` (or in `Eventov2` template) that opens the `HoraCrud` modal passing `categoriaSugerida` from the loaded `evento`.

#### Scenario: Open hours modal from event detail

- GIVEN the event detail is loaded and `evento.categoriaSugerida` is available
- WHEN the user clicks "Cargar horas"
- THEN `HoraCrud` SHALL open in add mode
- AND `data` SHALL include `categoriaSugerida: evento.categoriaSugerida`
- AND the first hora row SHALL be pre-filled with the suggested category

- GIVEN `evento.categoriaSugerida` is `null`
- WHEN the user clicks "Cargar horas"
- THEN `data` SHALL include `categoriaSugerida: null`
- AND the first hora row SHALL have no preselected category

#### Requirement: Desglose por categoría section

The system SHALL display a section in the event detail (`Eventov2` or a child component) showing hours broken down by category, consuming `GET /registro-hora/evento/:eventoId/por-categoria`.

#### Scenario: Desglose table in event detail

- GIVEN the event detail is loaded
- WHEN the "horas por categoría" section renders
- THEN it SHALL show a table with columns: Color indicator, Categoría, Horas totales, Cantidad de registros
- AND a row "Sin categoría" for `codigo === "SIN_CATEGORIA"`
- AND a total row at the bottom showing `totalGeneralFormateado`

#### Scenario: Empty desglose

- GIVEN the event has no hours
- WHEN the desglose section renders
- THEN it SHALL show an empty table with a message "No hay horas registradas"
- AND `totalGeneral` SHALL be `0`

#### Scenario: Desglose loads lazily

- GIVEN the event detail loads
- WHEN the desglose section is visible (via IntersectionObserver or direct load)
- THEN the component SHALL call `RegistroHoraService.getPorCategoria(eventoId)`

---

## Domain 6: API Integration

### ADDED Requirements

#### Requirement: getPorCategoria service method

The `RegistroHoraService` SHALL add a method `getPorCategoria(eventoId: string): Observable<HorasPorCategoriaResponse>` for the new endpoint.

#### Scenario: Service method contract

- GIVEN `RegistroHoraService` is used
- WHEN `getPorCategoria(eventoId)` is called
- THEN it SHALL `GET ${URL_COMPLETA}/registro-hora/evento/${eventoId}/por-categoria`
- AND return `HorasPorCategoriaResponse`

#### Requirement: Filter by categoriaCodigo in getAll

The `RegistroHoraService.getAll()` method SHALL accept an optional `categoriaCodigo` parameter.

#### Scenario: Filter param in getAll

- GIVEN `RegistroHoraService.getAll()` is called
- WHEN `categoriaCodigo` is provided
- THEN the URL SHALL include `&categoriaCodigo=${categoriaCodigo}`

#### Requirement: categoriaSugerida in EventoService.getEventoVista

The `EventoService.getEventoVista()` already returns `EventoVistaResponse`, which contains `evento: EventoCompleto`. The `EventoCompleto` SHALL now include `categoriaSugerida` as per Domain 1.

#### Scenario: EventoVistaResponse includes categoriaSugerida

- GIVEN `EventoService.getEventoVista(eventoId)` is called
- WHEN the response arrives
- THEN `res.evento.categoriaSugerida` SHALL contain the `TipoTrabajo` object or be `null`
