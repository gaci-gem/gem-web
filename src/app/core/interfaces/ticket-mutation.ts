export type TicketMutationOperation = 'CREATED' | 'UPDATED';
export interface TicketMutationNotification {
  type: 'TICKET_MUTATION';
  ticketId: number;
  operation: TicketMutationOperation;
  changedFields: string[];
  clienteId?: number;
  source: string;
  timestamp: string;
}
