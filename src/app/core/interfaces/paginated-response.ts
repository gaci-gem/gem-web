export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  registros: T[];
  pagination: PaginationMeta;
}

export interface Page<T> {
  data: T[];
  pagination: PaginationMeta;
}
