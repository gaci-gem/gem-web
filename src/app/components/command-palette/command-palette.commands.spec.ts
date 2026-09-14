import { SHORTCUTS } from '@/app/constants/shortcut';
import { COMMAND_PALETTE_COMMANDS } from './command-palette.commands';

describe('COMMAND_PALETTE_COMMANDS', () => {
  it('assigns the five agreed navigation shortcuts from SHORTCUTS', () => {
    const navigation = COMMAND_PALETTE_COMMANDS.slice(0, 5);

    expect(navigation.map(command => command.shortcut)).toEqual([
      SHORTCUTS.INICIO,
      SHORTCUTS.EVENTOS_USUARIO,
      SHORTCUTS.HORAS_USUARIO,
      SHORTCUTS.TICKETS,
      SHORTCUTS.EVENTOS_GENERALES,
    ]);
  });

  it('enables Crear evento through the existing events route', () => {
    const command = COMMAND_PALETTE_COMMANDS.find(item => item.id === 'create-event');

    expect(command?.disabled).not.toBeTrue();
    expect(command?.route).toBe('/evento/eventos');
  });
});
