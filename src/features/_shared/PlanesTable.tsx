import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DataTable, Semaforo, buttonClasses, type Column } from '@/components/ui';
import type { Pagina } from '@/lib/types';
import { useFmt, useT } from '@/lib/useT';
import { EstadoPlanBadge } from './EstadoBadge';
import { PAGE_SIZE } from './hooks';
import type { PlanItem } from './types';

export interface PlanesTableProps {
  data?: Pagina<PlanItem>;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  page: number;
  onPageChange: (p: number) => void;
  /** Ruta base del detalle, p. ej. `/coordinador/planes`. */
  basePath: string;
  caption: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Tabla de planes con paginación en servidor. Sin datos clínicos: solo estado, semestre, ajustes y semáforo. */
export function PlanesTable({
  data,
  loading,
  error,
  onRetry,
  page,
  onPageChange,
  basePath,
  caption,
  emptyTitle,
  emptyDescription,
}: PlanesTableProps) {
  const t = useT();
  const f = useFmt();
  const columns: Column<PlanItem>[] = [
    {
      id: 'estudiante',
      header: t('comun.planes.col_estudiante'),
      rowHeader: true,
      cell: (r) => r.estudiante_nombre,
    },
    { id: 'semestre', header: t('comun.planes.col_semestre'), cell: (r) => r.semestre_academico },
    { id: 'estado', header: t('comun.planes.col_estado'), cell: (r) => <EstadoPlanBadge estado={r.estado} /> },
    { id: 'version', header: t('comun.planes.col_version'), cell: (r) => `v${r.version}` },
    { id: 'ajustes', header: t('comun.planes.col_ajustes'), cell: (r) => f.num(r.total_ajustes) },
    {
      id: 'semaforo',
      header: t('comun.planes.col_semaforo'),
      cell: (r) =>
        r.semaforo_actual ? (
          <Semaforo estado={r.semaforo_actual} size="sm" />
        ) : (
          <span className="text-tinta-suave">{t('grafico.sin_registro')}</span>
        ),
    },
    { id: 'actualizado', header: t('comun.planes.col_actualizado'), cell: (r) => f.fecha(r.updated_at) },
    {
      id: 'accion',
      header: t('comun.planes.col_accion'),
      cell: (r) => (
        <Link
          to={`${basePath}/${r.id}`}
          className={buttonClasses('secundaria', 'md')}
          aria-label={t('comun.planes.ver_de', { nombre: r.estudiante_nombre })}
        >
          {t('comun.planes.ver')}
          <ArrowRight aria-hidden className="size-5" />
        </Link>
      ),
    },
  ];
  return (
    <DataTable
      caption={caption}
      columns={columns}
      data={data?.items ?? []}
      getRowId={(r) => r.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      pageSize={PAGE_SIZE}
      serverSide={{ total: data?.total ?? 0, page, onPageChange }}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}
