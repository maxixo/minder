export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
}

export interface PaginatedApiEnvelope<T> extends ApiEnvelope<T> {
  pagination: PaginationMeta;
}
