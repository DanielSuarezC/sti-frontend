import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  LoadingState,
  PageHeader,
  Semaforo,
  buttonClasses,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT } from '@/lib/useT';
import type { EstadoSemaforo } from '@/lib/types';

interface CorteSemaforo {
  corte: string;
  semaforo: string | null;
  implementado: boolean | null;
}

interface AsignaturaInfo {
  id: number;
  codigo: string;
  nombre: string;
}

interface SemaforoAjuste {
  ajuste_id: number;
  nombre_ajuste: string;
  alias: string;
  asignatura: AsignaturaInfo | null;
  semaforo_actual: string | null;
  cortes: CorteSemaforo[];
}

interface SemaforoDocenteData {
  resumen: Record<string, number>;
  ajustes: SemaforoAjuste[];
}

function esEstadoSemaforo(val: string | null): val is EstadoSemaforo {
  return val === 'VERDE' || val === 'AMARILLO' || val === 'ROJO';
}

export default function MisAsignaturas() {
  const t = useT();

  const [data, setData] = useState<SemaforoDocenteData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    api
      .get<SemaforoDocenteData>('/docente/semaforo')
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('docente.error_cargar_semaforo'));
        setCargando(false);
      });
  }, [t]);

  if (cargando) {
    return <LoadingState label={t('docente.cargando_semaforo')} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title={t('docente.error_titulo')}
        description={error ?? t('docente.error_cargar_semaforo')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('docente.asignaturas_titulo')}
          description={t('docente.asignaturas_desc')}
        />
        <Link to="/docente/ajustes" className={buttonClasses('primaria')}>
          {t('docente.ver_todos_los_ajustes')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Resumen Semáforo */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-semaforo-verde">
          <p className="text-sm font-semibold text-tinta-suave">{t('docente.semaforo_verde')}</p>
          <p className="font-titulo text-2xl font-bold">{data.resumen['VERDE'] ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-semaforo-amarillo">
          <p className="text-sm font-semibold text-tinta-suave">{t('docente.semaforo_amarillo')}</p>
          <p className="font-titulo text-2xl font-bold">{data.resumen['AMARILLO'] ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-semaforo-rojo">
          <p className="text-sm font-semibold text-tinta-suave">{t('docente.semaforo_rojo')}</p>
          <p className="font-titulo text-2xl font-bold">{data.resumen['ROJO'] ?? 0}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-borde">
          <p className="text-sm font-semibold text-tinta-suave">{t('docente.semaforo_sin_datos')}</p>
          <p className="font-titulo text-2xl font-bold">{data.resumen['SIN_SEMAFORO'] ?? 0}</p>
        </Card>
      </div>

      {/* Listado de ajustes monitoreados */}
      <Card className="space-y-4">
        <CardTitle>{t('docente.tabla_semaforo_titulo')}</CardTitle>
        {data.ajustes.length === 0 ? (
          <EmptyState
            title={t('docente.sin_ajustes_titulo')}
            description={t('docente.sin_ajustes_desc')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-borde text-xs uppercase text-tinta-suave">
                <tr>
                  <th className="py-3 px-4">{t('docente.columna_asignatura')}</th>
                  <th className="py-3 px-4">{t('docente.columna_estudiante')}</th>
                  <th className="py-3 px-4">{t('docente.columna_ajuste')}</th>
                  <th className="py-3 px-4">{t('docente.columna_semaforo_actual')}</th>
                  <th className="py-3 px-4">{t('docente.columna_cortes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {data.ajustes.map((item) => (
                  <tr key={item.ajuste_id} className="hover:bg-fondo-suave/50">
                    <td className="py-3 px-4 font-semibold">
                      {item.asignatura
                        ? `${item.asignatura.codigo} - ${item.asignatura.nombre}`
                        : t('docente.asignatura_general')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge color="cobalto">{item.alias}</Badge>
                    </td>
                    <td className="py-3 px-4">{item.nombre_ajuste}</td>
                    <td className="py-3 px-4">
                      {esEstadoSemaforo(item.semaforo_actual) ? (
                        <Semaforo estado={item.semaforo_actual} size="sm" />
                      ) : (
                        <Badge>{t('comun.plan.sin_semaforo')}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {item.cortes.map((c) => (
                          <div
                            key={c.corte}
                            className="flex flex-col items-center rounded border border-borde p-1 text-xs"
                          >
                            <span className="font-bold">{c.corte}</span>
                            {esEstadoSemaforo(c.semaforo) ? (
                              <Semaforo estado={c.semaforo} size="sm" />
                            ) : (
                              <span className="text-tinta-suave">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
