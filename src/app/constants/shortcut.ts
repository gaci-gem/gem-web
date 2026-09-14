export const SHORTCUTS = {
  INICIO: {
    combo: 'Alt+1',
    descripcion: 'Ir a Inicio'
  },
  EVENTOS_USUARIO: {
    combo: 'Alt+2',
    descripcion: 'Ir a Eventos Usuario'
  },
  HORAS_USUARIO: {
    combo: 'Alt+3',
    descripcion: 'Ir a Horas Usuario'
  },
  TICKETS: {
    combo: 'Alt+4',
    descripcion: 'Ir a Tickets'
  },
  EVENTOS_GENERALES: {
    combo: 'Alt+5',
    descripcion: 'Ir a Eventos generales'
  },
  NUEVO: {
    combo: 'Alt+A',
    descripcion: 'Crear nuevo registro'
  },
  INFO: {
    combo: 'Alt+I',
    descripcion: 'Ver atajos de teclado'
  },
  PALETA: {
    combo: 'Alt+K',
    descripcion: 'Abrir paleta de comandos'
  },
  REFRESCAR: {
    combo: 'Alt+R / Alt+Shift+R',
    combos: ['Alt+R', 'Alt+Shift+R'],
    descripcion: 'Actualizar la lista actual'
  },
  EXPORTAR: {
    combo: 'Alt+E',
    descripcion: 'Exportar la lista actual'
  },
  LIMPIAR_FILTROS: {
    combo: 'Alt+L',
    descripcion: 'Limpiar filtros de la lista actual'
  },
  PRESETS: {
    combo: 'Alt+P / Alt+Shift+P',
    combos: ['Alt+P', 'Alt+Shift+P'],
    descripcion: 'Aplicar preset predeterminado'
  },
  BUSCAR: {
    combo: 'Alt+F',
    descripcion: 'Enfocar la búsqueda o filtro actual'
  },
  ESCAPE: {
    combo: 'Escape',
    descripcion: 'Cerrar o cancelar el diálogo activo'
  },
} as const;

// 🔑 Claves válidas del objeto (NUEVO, GUARDAR, etc.)
export type ShortcutKey = keyof typeof SHORTCUTS;

// 📦 Tipo de cada definición individual ({ combo, descripcion })
export type ShortcutItem = typeof SHORTCUTS[ShortcutKey];

// 📚 Tipo de todo el objeto SHORTCUTS
export type ShortcutDefinitions = typeof SHORTCUTS;
