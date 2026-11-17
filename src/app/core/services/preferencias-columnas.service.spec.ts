import { PreferenciasColumnasService } from './preferencias-columnas.service';

describe('PreferenciasColumnasService', () => {
  let service: PreferenciasColumnasService;

  beforeEach(() => {
    localStorage.clear();
    service = new PreferenciasColumnasService();
  });

  it('separa las preferencias por usuario y pantalla', () => {
    service.guardar('eventos', 'usuario-1', { orden: ['cliente'], visibles: [] });
    service.guardar('eventos-usuario', 'usuario-1', { orden: ['titulo'], visibles: ['titulo'] });

    expect(service.restaurar('eventos', 'usuario-1', ['titulo', 'cliente'], ['titulo']).orden).toEqual(['cliente', 'titulo']);
    expect(service.restaurar('eventos-usuario', 'usuario-1', ['titulo', 'cliente'], ['titulo']).orden).toEqual(['titulo', 'cliente']);
    expect(service.restaurar('eventos', 'usuario-2', ['titulo', 'cliente'], ['titulo']).visibles).toEqual(['titulo']);
  });

  it('ignora columnas inexistentes y agrega nuevas con sus defaults', () => {
    service.guardar('eventos', 'usuario-1', {
      orden: ['cliente', 'columna-eliminada'],
      visibles: ['cliente', 'columna-eliminada'],
    });

    expect(service.restaurar('eventos', 'usuario-1', ['titulo', 'cliente', 'producto'], ['titulo', 'producto'])).toEqual({
      orden: ['cliente', 'titulo', 'producto'],
      visibles: ['cliente', 'titulo', 'producto'],
    });
  });

  it('permite guardar el estado por defecto al restablecer', () => {
    service.guardar('eventos', 'usuario-1', { orden: ['cliente'], visibles: [] });
    service.guardar('eventos', 'usuario-1', { orden: ['titulo', 'cliente'], visibles: ['titulo'] });

    expect(service.restaurar('eventos', 'usuario-1', ['titulo', 'cliente'], ['titulo'])).toEqual({
      orden: ['titulo', 'cliente'],
      visibles: ['titulo'],
    });
  });
});
