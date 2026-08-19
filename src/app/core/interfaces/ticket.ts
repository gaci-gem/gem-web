export const TICKET_STATES = [
  'INGRESADO',
  'EN_REVISION',
  'EN_DESARROLLO',
  'RESUELTO',
  'CERRADO',
  'RECHAZADO',
] as const;

export type TicketState = (typeof TICKET_STATES)[number];

export interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: TicketState;
  externalReference: string | null;
  clientName: string | null;
  clientCode: string;
  clientId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[];
  events: TicketEvent[];
  attachments?: TicketAttachment[];
}

export interface TicketComment {
  id: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  attachments?: TicketAttachment[];
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
