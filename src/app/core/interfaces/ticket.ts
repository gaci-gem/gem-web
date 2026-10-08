export const TICKET_STATES = [
  'INGRESADO',
  'EN_REVISION',
  'EN_DESARROLLO',
  'ESPERANDO_RESPUESTA_CLIENTE',
  'RECHAZADO',
  'CERRADO',
] as const;

export type TicketState = (typeof TICKET_STATES)[number];

export type TicketOrigin = 'EMAIL' | 'GEM_CLIENTES' | 'GEM_WEB';

export interface Ticket {
  id: number;
  subject: string;
  origin: TicketOrigin;
  description: string;
  status: TicketState;
  priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  type: 'CONSULTA' | 'ERROR_INCIDENTE' | 'REQUERIMIENTO_MEJORA' | null;
  externalReference: string | null;
  observation: string | null;
  module?: { code: string; name: string } | null;
  assignedUser?: { id: string; name: string; email: string; color: string | null } | null;
  creator: { id: string; login: string } | null;
  clientName: string | null;
  clientCode: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  events: TicketEvent[];
}

export interface TicketPage {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[];
  events: TicketEvent[];
  attachments?: TicketAttachment[];
  emailOriginal?: TicketAttachment;
}

export interface TicketComment {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  source?: 'GEM_WEB' | 'GEM_CLIENTES' | 'EMAIL' | 'SYSTEM';
  actorType?: 'USER' | 'CLIENT' | 'EMAIL' | 'SYSTEM';
  actorId?: string | null;
  userId?: string | null;
  credentialId?: string | null;
  displayName?: string | null;
  attachments?: TicketAttachment[];
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface TicketAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  checksum: string;
  createdAt: string;
  downloadUrl: string;
}

export interface TicketEvent {
  id: string;
  type: string;
  code: string;
  title: string;
  visibleState: 'OPEN' | 'CLOSED';
  color: string;
}
