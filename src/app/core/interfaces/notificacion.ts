import { VidaEvento } from "./evento";

export type NotificationTargetType = 'EVENTO' | 'COMENTARIO' | 'EVENTO_ADICION' | 'NOTA' | 'NOVEDAD';
export type NotificationSourceType = 'SISTEMA' | 'USUARIO';

export interface NotificationPayload {
	titulo?: string;
	autorId?: string;
	autorNombre?: string;
	[key: string]: any;
}

export interface Notificacion {
	id?: number;
	usuarioId?: string;
	mensaje: string;
	payload?: NotificationPayload;
	leida: boolean;
	readAt?: string | null;
	isValid?: boolean;
	targetType?: NotificationTargetType;
	targetId?: string;
	accion?: string;
	sourceType?: NotificationSourceType;
	sourceId?: string | null;
	createdAt: string | Date;

	// Campos legacy/deprecados para compatibilidad
	fecha?: Date;
	asunto?: string;
	envMail?: boolean;
	icon?: string;
	// tipo?: VidaEvento;
}
