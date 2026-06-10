# Frontend Integration: Categorización de Horas Trabajadas

> **API Change**: `categorizar-horas-trabajadas` — mayo 2026
> **Backend**: NestJS 11 / Prisma 7.3 / MariaDB
> **Frontend**: Angular 21 standalone + signals + PrimeNG

---

## 1. Resumen del cambio

Ahora cada bloque de hora puede tener una **categoría** que indica qué tipo de trabajo se realizó (desarrollo, testing, análisis, etc.). El usuario elige la categoría al cargar la hora, y el sistema sugiere un valor según la etapa actual del evento.

---

## 2. Catálogo de categorías

Se creó el modelo `tipo_trabajo` con estos valores iniciales (seed SQL):

| Código | Descripción        | Color   | Uso típico                           |
| ------ | ------------------ | ------- | ------------------------------------ |
| DEV    | Desarrollo         | #2196F3 | Codificar features, corregir bugs    |
| TEST   | Testing            | #4CAF50 | Pruebas manuales o automatizadas     |
| ANAL   | Análisis           | #FF9800 | Relevar requisitos, analizar impacto |
| REV    | Revisión de código | #9C27B0 | Code review, pair programming        |
| DESIGN | Diseño             | #E91E63 | Diseño de UI/UX, prototipado         |
| ADMIN  | Administrativo     | #607D8B | Tareas administrativas, reuniones    |
| MEET   | Reunión            | #795548 | Reuniones internas o con cliente     |
| OTHER  | Otros              | #9E9E9E | Actividades no cubiertas arriba      |

El frontend debe cargar este catálogo para mostrar el combo. No hay endpoint CRUD todavía, pero los códigos son estables y se pueden hardcodear temporalmente con un `enum` o cargarse del backend cuando se implemente el CRUD.

---

## 3. API - Cambios en requests

### POST /registro-hora (crear registro con horas)

El DTO `CreateHoraDto` ahora acepta `categoriaCodigo` opcional:

```typescript
// Request body — POST /registro-hora
{
  "fecha": "2026-05-27",
  "horas": [
    {
      "eventoId": "uuid-del-evento",
      "inicio": "09:00",
      "fin": "12:30",
      "detalle": "Implementando login con JWT",
      "categoriaCodigo": "DEV"              // ← NUEVO, opcional
    },
    {
      "eventoId": "uuid-del-evento",
      "inicio": "13:30",
      "fin": "15:00",
      "detalle": "Review del PR de autenticación",
      "categoriaCodigo": "REV"              // ← NUEVO, opcional
    }
  ]
}
```

**Reglas**:

- `categoriaCodigo` es opcional — los requests existentes sin este campo siguen funcionando.
- Si se envía, debe ser un código válido del catálogo `tipo_trabajo` (devuelve 400 si no).
- Cada hora dentro del array puede tener distinta categoría.

### PUT /registro-hora/:id (actualizar registro)

Misma lógica — `categoriaCodigo` opcional en cada `CreateHoraDto` anidado.

---

## 4. API - Cambios en responses

### GET /eventos/:id (detalle de evento)

Ahora incluye `categoriaSugerida`:

```json
{
  "id": "uuid",
  "titulo": "Bug en login",
  "etapaActual": 3,
  "categoriaSugerida": {
    // ← NUEVO
    "codigo": "TEST",
    "descripcion": "Testing",
    "color": "#4CAF50",
    "activo": true
  }
  // ... resto de campos existentes
}
```

**Uso**: El frontend debe usar este valor para **precargar el combo** de categoría en el formulario de carga de horas, cuando el usuario está cargando horas contra este evento.

**Reglas**:

- `categoriaSugerida` puede ser `null` si la etapa no tiene categoría configurada.
- Es una **sugerencia** — el usuario puede cambiarla. Si el usuario cambia el combo, se manda el valor que eligió.
- Si `categoriaSugerida` es `null`, el combo se muestra sin valor preseleccionado.

### GET /eventos (listado)

NO incluye `categoriaSugerida` por ahora (solo en el detalle).

### GET /registro-hora (listado de registros diarios)

Cada hora ahora incluye datos de categoría:

```json
{
  "id": 1,
  "fecha": "2026-05-27",
  "usuarioId": "uuid",
  "horas": [
    {
      "id": 42,
      "inicio": "09:00",
      "fin": "12:30",
      "detalle": "Implementando login",
      "categoriaCodigo": "DEV",
      "categoria": {
        // ← NUEVO
        "codigo": "DEV",
        "descripcion": "Desarrollo",
        "color": "#2196F3"
      }
    }
  ]
}
```

---

## 5. Nuevo endpoint: desglose por categoría

```
GET /registro-hora/evento/:eventoId/por-categoria
```

**Response**:

```json
{
  "eventoId": "uuid",
  "categorias": [
    {
      "codigo": "DEV",
      "descripcion": "Desarrollo",
      "totalHoras": 12.5,
      "totalFormateado": "12.50h",
      "cantidadRegistros": 5
    },
    {
      "codigo": "TEST",
      "descripcion": "Testing",
      "totalHoras": 4.0,
      "totalFormateado": "4.00h",
      "cantidadRegistros": 2
    }
  ],
  "totalGeneral": 16.5,
  "totalGeneralFormateado": "16.50h"
}
```

**Uso**: Para mostrar gráficos o tablas de "horas estimadas vs reales por categoría" en el detalle del evento.

**Reglas**:

- Las horas sin `fin` (eventos "tomados") se excluyen del cálculo.
- Las horas sin categoría se agrupan como `"SIN_CATEGORIA"` / `"Sin categoría"`.
- Las categorías se devuelven ordenadas por `totalHoras` descendente.
- Si no hay horas, devuelve `categorias: []` y `totalGeneral: 0`.

### Filtro por categoría en listado de registros

```
GET /registro-hora?categoriaCodigo=DEV&fechaDesde=...
```

Filtra los registros que tengan al menos una hora con esa categoría.

---

## 6. Flujo recomendado para el formulario de carga de horas

```
1. Usuario abre el modal de "Cargar horas" para un evento
2. Frontend llama a GET /eventos/:id
3. Si `categoriaSugerida` no es null:
   → Precargar el combo de categoría con `categoriaSugerida.codigo`
   → Mostrar la descripción como placeholder (ej: "Testing")
4. Si `categoriaSugerida` es null:
   → Combo sin valor preseleccionado, placeholder "Seleccionar..."
5. Usuario puede cambiar la categoría antes de guardar
6. Al enviar POST /registro-hora, cada hora lleva su `categoriaCodigo`
```

### Consideraciones UI

- **Combo con colores**: El catálogo tiene `color` — usalo para mostrar un indicador visual (circulito al lado de cada opción).
- **Tooltip con descripción**: Cada código tiene una descripción larga, mostrala como tooltip o subtítulo en el combo.
- **Responsive**: En mobile, considerar un selector nativo en vez de dropdown de PrimeNG.

---

## 7. Resumen de cambios en el frontend

| Componente             | Cambio                                                          |
| ---------------------- | --------------------------------------------------------------- |
| **Combo de categoría** | Nuevo componente/select en el formulario de carga de horas      |
| **Evento detalle**     | Leer `categoriaSugerida` del GET /eventos/:id para precargar    |
| **Tabla de horas**     | Mostrar columna "Categoría" con el label y color                |
| **Gráfico de horas**   | Usar `GET /.../por-categoria` para mostrar desglose             |
| **Filtros**            | Agregar filtro por categoría en el listado de registros         |
| **Exportación**        | La columna de categoría ya se incluye en la exportación backend |

---

## 8. Preguntas frecuentes

**Q: ¿Puedo hardcodear los códigos de categoría en el frontend?**
R: Sí, temporalmente. Son 8 códigos estables (DEV, TEST, ANAL, REV, DESIGN, ADMIN, MEET, OTHER). Cuando se implemente el CRUD de `tipo_trabajo`, conviene cargarlos del backend.

**Q: ¿Qué pasa si no mando `categoriaCodigo`?**
R: La hora se guarda sin categoría. 100% retrocompatible.

**Q: ¿Puedo cambiar la categoría de una hora existente?**
R: Sí, vía PUT /registro-hora/:id, pasando el nuevo `categoriaCodigo` en la hora correspondiente.

**Q: ¿Las horas viejas (anteriores a la migración) tienen categoría?**
R: No. Quedan con `categoriaCodigo = null`. El frontend debe mostrarlas como "Sin categoría".
