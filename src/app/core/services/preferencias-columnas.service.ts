import { Injectable } from '@angular/core';

export interface EstadoColumnas {
  orden: string[];
  visibles: string[];
}

@Injectable({ providedIn: 'root' })
export class PreferenciasColumnasService {
  private readonly prefijoClave = 'preferencias-columnas';

  restaurar(
    pantalla: string,
    usuarioId: string | undefined,
    columnasIniciales: string[],
    visiblesIniciales: string[],
  ): EstadoColumnas {
    const estadoInicial = { orden: [...columnasIniciales], visibles: [...visiblesIniciales] };
    if (!usuarioId) return estadoInicial;

    try {
      const crudo = localStorage.getItem(this.obtenerClave(pantalla, usuarioId));
      if (!crudo) return estadoInicial;
      const guardado = JSON.parse(crudo) as Partial<EstadoColumnas>;
      if (!Array.isArray(guardado.orden) || !Array.isArray(guardado.visibles)) return estadoInicial;

      const existentes = new Set(columnasIniciales);
      const camposGuardados = new Set(
        [...guardado.orden, ...guardado.visibles].filter((campo): campo is string => existentes.has(campo)),
      );
      const ordenGuardado = guardado.orden.filter((campo): campo is string => existentes.has(campo));
      const orden = [
        ...ordenGuardado,
        ...columnasIniciales.filter((campo) => !ordenGuardado.includes(campo)),
      ];
      const visibles = [
        ...guardado.visibles.filter((campo): campo is string => existentes.has(campo)),
        ...visiblesIniciales.filter((campo) => !camposGuardados.has(campo)),
      ];
      return { orden, visibles };
    } catch {
      return estadoInicial;
    }
  }

  guardar(pantalla: string, usuarioId: string | undefined, estado: EstadoColumnas): void {
    if (!usuarioId) return;
    localStorage.setItem(this.obtenerClave(pantalla, usuarioId), JSON.stringify(estado));
  }

  private obtenerClave(pantalla: string, usuarioId: string): string {
    return `${this.prefijoClave}:${usuarioId}:${pantalla}`;
  }
}
