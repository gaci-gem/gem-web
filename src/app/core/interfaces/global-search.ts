export type GlobalSearchEntity = 'clientes' | 'eventos' | 'proyectos';

export interface GlobalSearchResult {
  entity: GlobalSearchEntity;
  id: number | string;
  title: string;
  subtitle: string | null;
}
