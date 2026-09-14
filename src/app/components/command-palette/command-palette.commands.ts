import { SHORTCUTS, ShortcutItem } from '@/app/constants/shortcut';

export type CommandPaletteCommand = {
  id: string;
  label: string;
  group: 'Navegación' | 'Acciones frecuentes';
  icon: string;
  route?: string;
  action?: 'toggle-theme';
  shortcut?: ShortcutItem;
  disabled?: boolean;
  disabledReason?: string;
  keywords: string;
};

export const COMMAND_PALETTE_COMMANDS: CommandPaletteCommand[] = [
  { id: 'home', label: 'Inicio', group: 'Navegación', icon: 'lucideCircleGauge', route: '/dashboard', shortcut: SHORTCUTS.INICIO, keywords: 'inicio dashboard home' },
  { id: 'user-events', label: 'Eventos Usuario', group: 'Navegación', icon: 'lucideCalendar', route: '/evento/eventos/usuario', shortcut: SHORTCUTS.EVENTOS_USUARIO, keywords: 'eventos usuario propios' },
  { id: 'user-hours', label: 'Horas Usuario', group: 'Navegación', icon: 'lucideClockPlus', route: '/hora/horas/usuario', shortcut: SHORTCUTS.HORAS_USUARIO, keywords: 'horas usuario tiempo registro' },
  { id: 'tickets', label: 'Tickets', group: 'Navegación', icon: 'lucideTicket', route: '/gem-clientes/tickets', shortcut: SHORTCUTS.TICKETS, keywords: 'tickets soporte' },
  { id: 'general-events', label: 'Eventos generales', group: 'Navegación', icon: 'lucideCalendarDays', route: '/evento/eventos', shortcut: SHORTCUTS.EVENTOS_GENERALES, keywords: 'eventos generales calendario' },
  { id: 'notes', label: 'Notas', group: 'Navegación', icon: 'lucideNotebook', disabled: true, disabledReason: 'Preview: sin ruta independiente', keywords: 'notas apuntes' },
  { id: 'create-event', label: 'Crear evento', group: 'Acciones frecuentes', icon: 'lucideCalendarPlus', route: '/evento/eventos', keywords: 'crear nuevo evento' },
  { id: 'log-hours', label: 'Registrar horas', group: 'Acciones frecuentes', icon: 'lucideClock3', route: '/hora/horas/usuario', keywords: 'registrar cargar horas tiempo' },
  { id: 'profile', label: 'Mi perfil', group: 'Acciones frecuentes', icon: 'tablerUserCircle', route: '/usuario/perfil', keywords: 'perfil cuenta usuario' },
  { id: 'theme', label: 'Cambiar tema', group: 'Acciones frecuentes', icon: 'lucideMoon', action: 'toggle-theme', keywords: 'tema oscuro claro apariencia' },
];
