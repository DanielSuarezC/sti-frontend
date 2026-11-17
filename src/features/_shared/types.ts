/** Tipos compartidos entre pantallas de Admin y Coordinador. Fieles a `backend/docs/api/*.md`. */
import type { EstadoSemaforo } from '@/lib/types';

export type EstadoPlan =
  | 'BORRADOR'
  | 'EN_CONCERTACION'
  | 'EN_NEGOCIACION'
  | 'ESCALADO_COMITE'
  | 'PENDIENTE_VALIDACION'
  | 'PENDIENTE_FIRMAS'
  | 'APROBADO'
  | 'IMPLEMENTACION'
  | 'SEGUIMIENTO'
  | 'FINALIZADO'
  | 'ARCHIVADO';

export const ESTADOS_PLAN: EstadoPlan[] = [
  'BORRADOR',
  'EN_CONCERTACION',
  'EN_NEGOCIACION',
  'ESCALADO_COMITE',
  'PENDIENTE_VALIDACION',
  'PENDIENTE_FIRMAS',
  'APROBADO',
  'IMPLEMENTACION',
  'SEGUIMIENTO',
  'FINALIZADO',
  'ARCHIVADO',
];

export type TipoAjuste =
  | 'COMUNICACION'
  | 'PEDAGOGIA'
  | 'EVALUACION'
  | 'AMBIENTE'
  | 'INTERACCION'
  | 'TECNOLOGIA';

export const TIPOS_AJUSTE: TipoAjuste[] = [
  'COMUNICACION',
  'PEDAGOGIA',
  'EVALUACION',
  'AMBIENTE',
  'INTERACCION',
  'TECNOLOGIA',
];

export interface Ref {
  id: number | null;
  nombre_completo: string | null;
  rol: string;
}

export interface PlanItem {
  id: number;
  estudiante_id: number;
  estudiante_nombre: string;
  programa_id: number | null;
  semestre_academico: string;
  estado: EstadoPlan;
  version: number;
  total_ajustes: number;
  semaforo_actual: EstadoSemaforo | null;
  fecha_elaboracion: string | null;
  fecha_aprobacion: string | null;
  updated_at: string;
}

export interface SemaforoAjuste {
  valor: EstadoSemaforo;
  corte: string | null;
  texto: string;
  fecha: string | null;
}

export type EstadoNegociacion = 'ABIERTA' | 'EN_CICLO' | 'ACORDADA' | 'ESCALADA_COMITE' | 'CERRADA';

export interface NegociacionResumen {
  id: number;
  estado: EstadoNegociacion;
  ciclo: number;
  max_ciclos: number;
  siguiente_accion: string | null;
}

export interface Ajuste {
  id: number;
  plan_id: number;
  nombre_ajuste: string;
  descripcion_ajuste: string;
  justificacion: string | null;
  tipo_ajuste: TipoAjuste;
  categoria: string;
  detalle: { tipo: string; descripcion?: string | null; soporte_tecnico_requerido?: boolean };
  barrera: {
    id: number;
    tipo_barrera: string;
    escenario: string | null;
    descripcion_barrera?: string | null;
    severidad?: string | null;
  } | null;
  fortaleza?: { id: number; nombre_fortaleza: string } | null;
  responsable: Ref | null;
  asignatura: { id: number; codigo: string; nombre: string } | null;
  actividad_si_aplica?: string | null;
  especificidad?: string | null;
  recurso?: string | null;
  frecuencia?: string | null;
  indicador_efectividad?: string | null;
  fecha_inicio?: string | null;
  fecha_fin_prevista?: string | null;
  permanencia_indefinida?: boolean;
  estado: string;
  origen?: string | null;
  aceptado_por_estudiante?: boolean | null;
  respuesta_estudiante?: {
    respuesta: string | null;
    comentario: string | null;
    modificacion_propuesta: string | null;
    fecha: string | null;
  };
  semaforo: SemaforoAjuste | null;
  negociacion: NegociacionResumen | null;
}

export interface EstrategiaDuaPlan {
  id: number;
  nombre_estrategia: string;
  descripcion: string | null;
  dimension_dua: string | null;
  escenario: string | null;
  responsable: Ref | null;
  estado_implementacion: string | null;
  implementada: boolean | null;
  barrera: { id: number; tipo_barrera: string; escenario: string | null } | null;
  origen?: string | null;
}

export interface Negociacion {
  id: number;
  plan_id: number;
  estudiante_id: number;
  ajuste: { id: number; nombre_ajuste: string; tipo_ajuste: TipoAjuste } | null;
  tipo: string;
  estado: EstadoNegociacion;
  ciclo: number;
  max_ciclos: number;
  objecion_estudiante: string | null;
  propuesta_bienestar: string | null;
  resolucion: string | null;
  historial: {
    ciclo: number;
    objecion: string | null;
    propuesta: string | null;
    resolucion: string | null;
    respuesta_estudiante: string | null;
    fecha: string | null;
  }[];
  siguiente_accion: string | null;
  creada_por?: Ref | null;
  asignada_a?: Ref | null;
  escalada_at: string | null;
  resuelta_at: string | null;
  created_at: string;
}

export type RolFirmante = 'ESTUDIANTE' | 'BIENESTAR' | 'COORDINADOR';

export interface Firma {
  id: number;
  version: number;
  rol_firmante: RolFirmante;
  firmante: Ref;
  firmado_at: string;
  estado: 'FIRMADA' | 'INVALIDADA';
  hash_documento: string;
  hash_corto: string;
  firma_hash: string;
  ip: string | null;
}

export type AccionPlan =
  | 'EDITAR'
  | 'ENVIAR_A_ESTUDIANTE'
  | 'ELIMINAR'
  | 'ENVIAR_A_VALIDACION'
  | 'GENERAR_MATRIZ'
  | 'INICIAR_IMPLEMENTACION'
  | 'ARCHIVAR'
  | 'FIRMAR'
  | 'VALIDAR'
  | 'DEVOLVER'
  | 'EDITAR_MATRIZ'
  | 'RESPONDER_AJUSTES'
  | 'ACEPTAR_RESPONSABILIDAD'
  | 'EXPORTAR';

export interface Plan {
  id: number;
  vista: 'COMPLETA' | 'DOCENTE';
  estudiante: {
    id: number;
    nombre_completo: string;
    codigo_estudiante: string;
    programa_id: number | null;
    programa: string | null;
  };
  semestre_academico: string;
  estado: EstadoPlan;
  version: number;
  fecha_elaboracion: string | null;
  vigencia_inicio: string | null;
  vigencia_fin: string | null;
  fecha_aprobacion: string | null;
  ciclos_negociacion: number;
  semaforo_actual: EstadoSemaforo | null;
  elaborado_por: Ref | null;
  validado_por: Ref | null;
  fecha_validacion: string | null;
  comentarios_validacion: string | null;
  enviado_a_estudiante_at: string | null;
  resumen_ejecutivo: string | null;
  justificacion_apoyos: string | null;
  participacion_estudiante: boolean;
  participacion_familia: boolean;
  ajustes: Ajuste[];
  estrategias_dua: EstrategiaDuaPlan[];
  resumen: {
    total_ajustes: number;
    total_estrategias_dua: number;
    por_categoria: Record<string, number>;
    por_semaforo: Record<string, number>;
    aceptados_por_estudiante: number;
    pendientes_estudiante: number;
    objetados: number;
    pendientes_docente: number;
  };
  firmas: Firma[];
  firmas_estado: {
    version: number;
    orden: RolFirmante[];
    firmadas: RolFirmante[];
    pendientes: RolFirmante[];
    completas: boolean;
  };
  hash_contenido: string;
  puede_enviar_a_validacion: boolean;
  razones_no_listo: string[];
  negociaciones_abiertas: Negociacion[];
  participacion: {
    fecha: string;
    usuario_id: number | null;
    rol: string;
    accion: string;
    entidad: string;
    entidad_id: number | null;
    detalle: string | null;
  }[];
  acciones_disponibles: AccionPlan[];
  matriz_generada: boolean;
}

export interface PlanVerificacion {
  plan_id: number;
  version: number;
  integro: boolean;
  firmas_vigentes: number;
  firmas_validas: number;
  completo: boolean;
}

export interface VersionPlan {
  version: number;
  vigente: boolean;
  congelada: boolean;
  reemplazada: boolean;
  motivo_reemplazo: string | null;
  estado_plan: string;
  hash_snapshot: string | null;
  motivo_cambio: string | null;
  creado_por: Ref | null;
  created_at: string;
  firmas: Firma[];
}

export interface Exportacion {
  id: number;
  plan_id: number;
  estado: 'SOLICITADA' | 'PROCESANDO' | 'LISTA' | 'ERROR' | 'EXPIRADA';
  tipo: string;
  formato: string;
  formato_solicitado: string;
  version_plan: number;
  aviso: string | null;
  archivo_nombre: string | null;
  content_type: string | null;
  size_bytes: number | null;
  error: string | null;
  created_at: string;
  completada_at: string | null;
  expira_at: string | null;
  descarga: string | null;
}

/* ---------------- Reportes (M9) ---------------- */

/** Las celdas con 0 < n < k llegan como `null`: se muestran como «oculto por privacidad». */
export type Celda = number | null;

export interface ProgramaRef {
  id: number;
  nombre: string;
}

export interface ReporteCabecera {
  k_minimo: number;
  generado_at: string;
  alcance: { rol: string; programas: ProgramaRef[] };
  filtros: Record<string, unknown>;
  nota_privacidad: string;
  celdas_suprimidas: number;
}

export interface SemaforoConteo {
  VERDE: Celda;
  AMARILLO: Celda;
  ROJO: Celda;
  SIN_REGISTRO: Celda;
}

export interface DashboardBloque {
  planes_activos: Celda;
  semaforo: SemaforoConteo;
  tipos_barrera: Record<string, Celda>;
  permanencia: { continuan: Celda; no_continuan: Celda; tasa_permanencia_pct: Celda };
}

export interface DashboardReporte extends ReporteCabecera {
  programas: (DashboardBloque & { programa_id: number; programa: string })[];
  totales: DashboardBloque;
}

export interface IndicadorTrayectoria {
  cohorte_tea: Celda;
  referencia_programa: Celda;
  diferencia: Celda;
}

export interface TrayectoriasReporte extends ReporteCabecera {
  programas: {
    programa_id: number;
    programa: string;
    estudiantes_con_trayectoria: Celda;
    permanencia: { continuan: Celda; no_continuan: Celda };
    indicadores: {
      permanencia_pct: IndicadorTrayectoria;
      avance_promedio_pct: IndicadorTrayectoria;
      graduacion_pct: IndicadorTrayectoria;
      promedio_academico: IndicadorTrayectoria;
    };
    referencia_fuente: string | null;
  }[];
}

export interface AjustesFrecuentesReporte extends ReporteCabecera {
  categorias: { categoria: string; estudiantes: Celda; ajustes: Celda }[];
  categorias_ocultas: number;
  ajustes_especificos: { categoria: string; tipo: string; estudiantes: Celda; ajustes: Celda }[];
  ajustes_especificos_ocultos: number;
}

export interface EfectividadDuaReporte extends ReporteCabecera {
  estrategias: {
    estrategia_id: number;
    codigo: string;
    nombre: string;
    principio: string;
    pauta: number;
    estudiantes: Celda;
    tasa_implementacion_pct: Celda;
    casos_evaluados: Celda;
    tasa_efectividad_pct: Celda;
  }[];
  estrategias_ocultas: number;
  por_principio: {
    principio: string;
    estudiantes: Celda;
    tasa_implementacion_pct: Celda;
  }[];
}

export interface UsoReporte extends ReporteCabecera {
  usuarios_por_rol_estado: Record<string, Record<string, Celda>>;
  estudiantes_por_via_ingreso: Record<string, Celda>;
  planes_por_estado: Record<string, Celda>;
  planes_por_semestre: { semestre: string; planes_generados: Celda; semaforo: unknown }[];
  actividad: {
    inicios_de_sesion: number;
    notificaciones_creadas: number;
    correos_por_estado: Record<string, number>;
    exportaciones_por_tipo: Record<string, number>;
  };
}

export interface ReferenciaPrograma {
  programa_id: number;
  programa: string;
  permanencia_pct: number | null;
  avance_promedio_pct: number | null;
  graduacion_pct: number | null;
  promedio_academico: number | null;
  fuente: string | null;
}

export type TipoReporte =
  | 'dashboard'
  | 'trayectorias'
  | 'ajustes-frecuentes'
  | 'efectividad-dua'
  | 'uso';

export interface FiltrosReporte {
  programa_id?: number | null;
  semestre?: string | null;
}

/* ---------------- Estudiantes (tablero según rol) ---------------- */

export interface EstudianteFila {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  codigo_estudiante: string;
  programa_id: number | null;
  /** Solo para Coordinador/Bienestar; el Admin recibe únicamente los datos básicos. */
  programa?: string | null;
  semestre_actual?: number | null;
  estado_cuenta: string;
  estado_academico: string;
  via_ingreso?: string | null;
  bienestar_asignado?: { id: number; nombre_completo: string } | null;
  plan?: { id: number; estado: EstadoPlan; semaforo: EstadoSemaforo | null; version: number } | null;
  semaforo_agregado?: EstadoSemaforo | null;
  paso_actual?: number | null;
  progreso?: { hechos: number; total: number };
  pendientes?: number;
}

/* ---------------- Notificaciones (página completa) ---------------- */

export interface NotificacionItem {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  enlace: string | null;
}

export interface NotificacionesPagina {
  items: NotificacionItem[];
  total: number;
  no_leidas: number;
  page: number;
  page_size: number;
}
