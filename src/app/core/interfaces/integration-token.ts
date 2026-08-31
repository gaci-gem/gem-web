export interface IntegrationTokenRequest {
  label: string;
  kind?: string;
  expiresInDays?: number;
}

export interface IntegrationTokenResponse {
  id: string;
  kind: string;
  label: string;
  expiresAt: string | null;
  tokenPreview: string | null;
  token?: string;
  createdAt?: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}
