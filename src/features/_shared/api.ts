/**
 * Hooks de datos compartidos entre Admin y Coordinador (TanStack Query).
 * Contratos: backend/docs/api/slice_a.md (§7 notificaciones, §9 reportes), slice_c1.md (planes) y slice_c2.md (estudiantes).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, getBlob, post, put, saveBlob } from '@/lib/api';
import { NOTIFICACIONES_KEY } from '@/lib/notificaciones';
import type { Pagina } from '@/lib/types';
import type {
  AjustesFrecuentesReporte,
  DashboardReporte,
  EfectividadDuaReporte,
  EstadoPlan,
  EstudianteFila,
  Exportacion,
  Firma,
  FiltrosReporte,
  Negociacion,
  NotificacionesPagina,
  Plan,
  PlanItem,
  PlanVerificacion,
  ProgramaRef,
  ReferenciaPrograma,
  TipoReporte,
  TrayectoriasReporte,
  UsoReporte,
  VersionPlan,
} from './types';

/* ------------------------------ Planes ------------------------------ */

export interface PlanesParams {
  estado?: EstadoPlan | '';
  q?: string;
  programa_id?: number | null;
  page?: number;
  page_size?: number;
}

export const planesKey = ['planes'] as const;

export function usePlanes(params: PlanesParams, enabled = true) {
  return useQuery({
    queryKey: [...planesKey, 'lista', params],
    queryFn: ({ signal }) => get<Pagina<PlanItem>>('/planes', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: [...planesKey, 'detalle', id],
    queryFn: ({ signal }) => get<Plan>(`/planes/${id}`, { signal }),
    enabled: Number.isFinite(id),
  });
}

export function usePlanVerificacion(id: number, enabled = true) {
  return useQuery({
    queryKey: [...planesKey, 'verificar', id],
    queryFn: ({ signal }) => get<PlanVerificacion>(`/planes/${id}/verificar`, { signal }),
    enabled,
  });
}

export function usePlanVersiones(id: number) {
  return useQuery({
    queryKey: [...planesKey, 'versiones', id],
    queryFn: ({ signal }) =>
      get<{ plan_id: number; version_actual: number; items: VersionPlan[] }>(
        `/planes/${id}/versiones`,
        { signal },
      ),
  });
}

export function useNegociaciones(params: { estado?: string; plan_id?: number }, enabled = true) {
  return useQuery({
    queryKey: ['negociacion', params],
    queryFn: ({ signal }) =>
      get<Pagina<Negociacion>>('/negociacion', { query: { ...params, page_size: 50 }, signal }),
    enabled,
  });
}

/* ------------------------------ Exportación de un plan ------------------------------ */

export function useExportarPlan(planId: number) {
  return useMutation({
    mutationFn: async (formato: 'pdf' | 'docx' | 'html') => {
      let exp = await post<Exportacion>(`/planes/${planId}/exportar`, undefined, {
        query: { formato },
      });
      // Si no está lista en la respuesta, se consulta unas pocas veces (generación asíncrona).
      for (let i = 0; i < 10 && (exp.estado === 'SOLICITADA' || exp.estado === 'PROCESANDO'); i++) {
        await new Promise((r) => setTimeout(r, 1000));
        exp = await get<Exportacion>(`/exportaciones/${exp.id}`);
      }
      if (exp.estado === 'LISTA') {
        const file = await getBlob(`/exportaciones/${exp.id}/descargar`);
        saveBlob(file, exp.archivo_nombre ?? `plan-${planId}.${exp.formato}`);
      }
      return exp;
    },
  });
}

export function useFirmasPlan(id: number, enabled = true) {
  return useQuery({
    queryKey: [...planesKey, 'firmas', id],
    queryFn: ({ signal }) =>
      get<{ plan_id: number; version: number; estado_firmas: unknown; firmas: Firma[] }>(
        `/planes/${id}/firmas`,
        { signal },
      ),
    enabled,
  });
}

/* ------------------------------ Estudiantes ------------------------------ */

export interface EstudiantesParams {
  q?: string;
  estado?: string;
  estado_plan?: string;
  semaforo?: string;
  con_pendientes?: boolean | '';
  programa_id?: number | null;
  page?: number;
  page_size?: number;
}

export function useEstudiantes(params: EstudiantesParams) {
  return useQuery({
    queryKey: ['estudiantes', 'lista', params],
    queryFn: ({ signal }) =>
      get<Pagina<EstudianteFila>>('/estudiantes', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}

/* ------------------------------ Reportes (M9) ------------------------------ */

export const reportesKey = ['reportes'] as const;

export function useAlcanceReportes() {
  return useQuery({
    queryKey: [...reportesKey, 'alcance'],
    queryFn: ({ signal }) =>
      get<{ k_minimo: number; programas: ProgramaRef[] }>('/reportes/alcance', { signal }),
  });
}

function useReporte<T>(tipo: TipoReporte, filtros: FiltrosReporte, extra?: Record<string, number>) {
  return useQuery({
    queryKey: [...reportesKey, tipo, filtros, extra],
    queryFn: ({ signal }) =>
      get<T>(`/reportes/${tipo}`, {
        query: { programa_id: filtros.programa_id, semestre: filtros.semestre, ...extra },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export const useReporteDashboard = (f: FiltrosReporte) => useReporte<DashboardReporte>('dashboard', f);
export const useReporteTrayectorias = (f: FiltrosReporte) =>
  useReporte<TrayectoriasReporte>('trayectorias', f);
export const useReporteAjustes = (f: FiltrosReporte) =>
  useReporte<AjustesFrecuentesReporte>('ajustes-frecuentes', f);
export const useReporteEfectividad = (f: FiltrosReporte) =>
  useReporte<EfectividadDuaReporte>('efectividad-dua', f);
export const useReporteUso = (f: FiltrosReporte) => useReporte<UsoReporte>('uso', f);

export function useReferencias(enabled = true) {
  return useQuery({
    queryKey: [...reportesKey, 'referencias'],
    queryFn: ({ signal }) =>
      get<{ items: ReferenciaPrograma[] }>('/reportes/referencias', { signal }),
    enabled,
  });
}

export function useGuardarReferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      programa_id,
      ...body
    }: Partial<Omit<ReferenciaPrograma, 'programa'>> & { programa_id: number }) =>
      put<ReferenciaPrograma>(`/reportes/referencias/${programa_id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportesKey }),
  });
}

/** Descarga de un reporte (xlsx/pdf). Devuelve si el PDF llegó degradado a HTML imprimible. */
export async function descargarReporte(
  tipo: TipoReporte,
  formato: 'xlsx' | 'pdf',
  filtros: FiltrosReporte,
): Promise<{ degradado: boolean; aviso: string | null }> {
  const file = await getBlob(`/reportes/${tipo}/export`, {
    query: { formato, programa_id: filtros.programa_id, semestre: filtros.semestre },
  });
  saveBlob(file, `reporte-${tipo}.${formato}`);
  const degradado = !!file.headers?.get('X-Export-Degradado');
  return { degradado, aviso: file.headers?.get('X-Export-Aviso') ?? null };
}

/* ------------------------------ Notificaciones (página completa) ------------------------------ */

export function useNotificacionesPagina(params: { solo_no_leidas?: boolean; page: number; page_size: number }) {
  return useQuery({
    queryKey: [...NOTIFICACIONES_KEY, 'pagina', params],
    queryFn: ({ signal }) =>
      get<NotificacionesPagina>('/notificaciones', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
  });
}
