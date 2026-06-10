// changelog.ts
export interface ChangelogEntry {
  version: string;
  date: string;
  isFuture?: boolean;
  estimatedDate?: string;
  changes: ChangelogChange[];
}

export interface ChangelogChange {
  type: 'feature' | 'improvement' | 'fix';
  text: string;
  link?: string;
  urlReport?: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.e.0',
    date: '2026-06-09',
    changes: [
      {
        type: 'feature',
        text: 'Nuevo módulo de Novedades.',
      },
    ]
  },
  {
    version: '0.2.0',
    date: '2026-05-31',
    changes: [
      {
        type: 'feature',
        text: 'Nueva vista de evento más completa con toda la información en un solo lugar.',
      },
      {
        type: 'feature',
        text: 'Ahora podés escribir notas y comentarios con un editor mejorado.',
      },
      {
        type: 'improvement',
        text: 'Rediseñamos la pantalla de "Mis eventos" para que sea más fácil de usar.',
      },
      {
        type: 'improvement',
        text: 'Mejoras al seleccionar un evento para trabajar.',
      },
      {
        type: 'fix',
        text: 'Corregimos errores en el cálculo y visualización de horas.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-16',
    changes: [
      {
        type: 'feature',
        text: 'Nueva pantalla de reportes para ver tus horas cargadas.',
      },
      {
        type: 'improvement',
        text: 'Mejoras en la seguridad de la autenticación.',
      },
      { type: 'fix', text: 'Corregimos la exportación de eventos.' },
      { type: 'fix', text: 'Correcciones al migrar una base de conocimiento.' },
      { type: 'fix', text: 'Varias correcciones en la pantalla de horas.' },
    ],
  },
  {
    version: '0.0.3',
    date: '2026-02-18',
    changes: [
      {
        type: 'improvement',
        text: 'Ahora se puede seleccionar un eventos propio para trabajar.',
      },
      {
        type: 'improvement',
        text: 'Boton para limpiar los filtros de las grillas.',
      },
      {
        type: 'fix',
        text: 'Correción en los filtros de eventos y eventos usuario.',
      },
      { type: 'fix', text: 'Corrección al eliminar una nota compartida.' },
      { type: 'fix', text: 'Correción en el link de discord con GEM.' },
      { type: 'fix', text: 'Correción exportacion de eventos.' },
    ],
  },
  {
    version: '0.0.2',
    date: '2026-02-02',
    changes: [
      { type: 'improvement', text: 'Primer rediseño del dashboard.' },
      { type: 'feature', text: 'Integración con Notion.' },
      { type: 'feature', text: 'Integración con Discord.' },
    ],
  },
  {
    version: '0.0.1',
    date: '2026-01-10',
    changes: [
      { type: 'feature', text: 'Menciones en comentarios.' },
      {
        type: 'feature',
        text: 'Administracion de KBs y deploys.',
        link: '/kb/kbs',
        urlReport:
          'https://discord.com/channels/1366451551064821782/1450234207480582255',
      },
      { type: 'feature', text: 'Notas personales y compartidas.' },
      {
        type: 'feature',
        text: 'Rework del Perfil de usuario.',
        link: '/usuario/perfil',
      },
      { type: 'feature', text: 'Notificaciones.' },
      {
        type: 'fix',
        text: 'Correccion en calculo de horas.',
        urlReport:
          'https://discord.com/channels/1366451551064821782/1440429435944829049',
      },
    ],
  },
];

/*
futuro:
{
    version: '0.0.2',
    date: '',
    isFuture: true,
    estimatedDate: '2026-02-02',
    changes: [
        { type: 'improvement', text: 'Primer rediseño del dashboard.' },
        { type: 'feature', text: 'Integración con Notion.' },
    ]
},

actual:
{
    version: '0.0.2',
    date: '2026-02-02',
    changes: [
        { type: 'improvement', text: 'Primer rediseño del dashboard.' },
        { type: 'feature', text: 'Integración con Notion.' },
    ]
},
*/
