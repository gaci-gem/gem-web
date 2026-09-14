import { SHORTCUTS } from './shortcut';

describe('SHORTCUTS', () => {
  it('exposes exactly the agreed global navigation mapping', () => {
    expect([
      SHORTCUTS.INICIO,
      SHORTCUTS.EVENTOS_USUARIO,
      SHORTCUTS.HORAS_USUARIO,
      SHORTCUTS.TICKETS,
      SHORTCUTS.EVENTOS_GENERALES,
    ].map(shortcut => shortcut.combo)).toEqual([
      'Alt+1',
      'Alt+2',
      'Alt+3',
      'Alt+4',
      'Alt+5',
    ]);
    expect(Object.keys(SHORTCUTS).filter(key => /^(CLIENTES|PROYECTOS|USUARIOS|REGISTRO_HORAS)$/.test(key))).toEqual([]);
  });
});
