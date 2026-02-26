import { Usuario } from "./usuario";

export interface Reporte {
  id?: number;
  tipo: ReporteTipo;
  parametros?: string;
  estado?: ReporteEstado;
  archivoUrl?: string;
  usuarioId?: number;
  solicitadoEn?: Date;
  generadoEn?: Date;
  errorDescripcion?: string;
  envMailFin: boolean;

  usuario?: Usuario;
}

export enum ReporteTipo {
    HORAS_MENSUALES="HORAS_MENSUALES",
    HORAS_RANGO_FECHAS="HORAS_RANGO_FECHAS",
    HORAS_POR_PROYECTO="HORAS_POR_PROYECTO",
    EVENTOS_CERRADOS="EVENTOS_CERRADOS",
    FACTURACION_MENSUAL="FACTURACION_MENSUAL",
}

export enum ReporteEstado {
    PE="PE",
    PR="PR",
    OK="OK",
    ER="ER",
}
export const ReporteEstadoDescripcion = {
    PE: "Pendiente",
    PR: "En Proceso",
    OK: "Generado",
    ER: "Error"
}
export function getReporteEstadoDescripcion(estado: ReporteEstado): string {
    switch (estado) {
        case ReporteEstado.PE:
            return ReporteEstadoDescripcion[ReporteEstado.PE];
        case ReporteEstado.PR:
            return ReporteEstadoDescripcion[ReporteEstado.PR];
        case ReporteEstado.OK:
            return ReporteEstadoDescripcion[ReporteEstado.OK];
        case ReporteEstado.ER:
            return ReporteEstadoDescripcion[ReporteEstado.ER];
    }
}
export function getReporteTipoDescripcion(tipo: ReporteTipo): string {
    switch (tipo) {
        case ReporteTipo.HORAS_MENSUALES:
            return "Horas Mensuales";
        case ReporteTipo.HORAS_RANGO_FECHAS:
            return "Horas Rango Fechas";
        case ReporteTipo.HORAS_POR_PROYECTO:
            return "Horas por Proyecto";
        case ReporteTipo.EVENTOS_CERRADOS:
            return "Eventos Cerrados";
        case ReporteTipo.FACTURACION_MENSUAL:
            return "Facturación Mensual";
        default:
            return "Tipo Desconocido";
    }
}

export function getReporteParametrosSugerencia(tipo: ReporteTipo): string | undefined {
    switch (tipo) {
        case ReporteTipo.HORAS_MENSUALES:
            return '{"mes": 2, "anio": 2026}';
        case ReporteTipo.HORAS_RANGO_FECHAS:
            return '{"desde": "2026-02-01", "hasta": "2026-02-28"}';
        case ReporteTipo.HORAS_POR_PROYECTO:
            return '{"proyectoId": 1, "desde": "2026-02-01", "hasta": "2026-02-28"}';
        case ReporteTipo.EVENTOS_CERRADOS:
            return '{"desde": "2026-02-01", "hasta": "2026-02-28"}';
        case ReporteTipo.FACTURACION_MENSUAL:
            return undefined;
        default:
            return undefined;
    }
}

export const FiltroReporteEstado = [
    { value: ReporteEstado.PE, label: ReporteEstadoDescripcion[ReporteEstado.PE] },
    { value: ReporteEstado.PR, label: ReporteEstadoDescripcion[ReporteEstado.PR] },
    { value: ReporteEstado.OK, label: ReporteEstadoDescripcion[ReporteEstado.OK] },
    { value: ReporteEstado.ER, label: ReporteEstadoDescripcion[ReporteEstado.ER] },
];

export const ReporteEstadoBadge = {
    PE: {
        class: 'bg-warning text-dark',
        icon: 'lucideClock',
        label: ReporteEstadoDescripcion[ReporteEstado.PE]
    },
    PR: {
        class: 'bg-info text-dark',
        icon: 'lucideRefreshCcw',
        label: ReporteEstadoDescripcion[ReporteEstado.PR]
    },
    OK: {
        class: 'bg-success text-dark',
        icon: 'lucideCircleCheckBig',
        label: ReporteEstadoDescripcion[ReporteEstado.OK]
    },
    ER: {
        class: 'bg-danger',
        icon: 'lucideTriangleAlert',
        label: ReporteEstadoDescripcion[ReporteEstado.ER]
    }
}