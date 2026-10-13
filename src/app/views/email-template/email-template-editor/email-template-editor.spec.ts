import { construirCampos } from './email-template-editor';

describe('construirCampos', () => {
  it('mantiene asunto primero para templates con campos no tradicionales', () => {
    expect(construirCampos(['introduccionEstado', 'asunto', 'textoAuxiliar', 'asunto']))
      .toEqual(['asunto', 'introduccionEstado', 'textoAuxiliar']);
  });

  it('agrega asunto cuando el backend entrega campos legacy sin asunto', () => {
    expect(construirCampos(['introduccionEstado', 'textoAuxiliar']))
      .toEqual(['asunto', 'introduccionEstado', 'textoAuxiliar']);
  });
});
