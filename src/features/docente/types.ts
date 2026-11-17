export interface AsignaturaDocente {
  id: number;
  codigo: string;
  nombre: string;
}

export interface UltimaImplementacion {
  id: number;
  fecha: string;
  implementado: boolean;
  nota: string | null;
}

export interface AjusteDocente {
  id: number;
  nombre_ajuste: string;
  descripcion: string;
  tipo_ajuste: string;
  categorias: string[];
  frecuencia: string | null;
  indicador_efectividad: string | null;
  actividad_si_aplica: string | null;
  fecha_inicio: string;
  fecha_fin_prevista: string | null;
  permanencia_indefinida: boolean;
  estado: string;
  semaforo_actual: string | null;
  semestre: string;
  plan_estado: string;
  es_responsable: boolean;
  ultima_implementacion: UltimaImplementacion | null;
}

export interface EstrategiaDocente {
  id: number;
  nombre_estrategia: string;
  descripcion: string;
  dimension_dua: string;
  alcance: string | null;
  escenario: string | null;
  estado_implementacion: string;
  implementada: boolean;
  nota_implementacion: string | null;
  implementada_at: string | null;
  semestre: string;
  plan_estado: string;
}

export interface EstudianteAlias {
  alias: string;
  iniciales: string | null;
  ajustes: AjusteDocente[];
  estrategias_dua: EstrategiaDocente[];
}

export interface GrupoAsignatura {
  asignatura: AsignaturaDocente | null;
  estudiantes: EstudianteAlias[];
}

export interface MisAjustesResponse {
  docente_ve_nombre: boolean;
  total_ajustes: number;
  total_estrategias: number;
  asignaturas: GrupoAsignatura[];
}

export interface ImplementacionHistorial {
  id: number;
  fecha: string;
  implementado: boolean;
  nota: string | null;
  created_at?: string;
}
