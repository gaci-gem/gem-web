export interface TicketCredentialCreate {
  login: string;
}

export interface TicketCredential {
  id: string;
  identidadId: string;
  login: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCredentialUpdate {
  login?: string;
  activo?: boolean;
}
