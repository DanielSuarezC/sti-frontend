import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useEnum, useFmt } from '@/lib/useT';
import type { Pagina } from '@/lib/types';

interface LogItem {
  id: number;
  created_at: string;
  actor_id?: number;
  actor_rol?: string;
  accion: string;
  entidad: string;
  entidad_id?: number;
  estudiante_id?: number;
  ip?: string;
  detalle?: Record<string, any>;
}

export default function AuditoriaAdmin() {
  const t = useT();
  const e = useEnum();
  const f = useFmt();

  const [data, setData] = useState<Pagina<LogItem> | null>(null);
  const [page, setPage] = useState(1);
  const [accionesDisponibles, setAccionesDisponibles] = useState<string[]>([]);
  const [accionFiltro, setAccionFiltro] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: string[] }>('/admin/auditoria/acciones')
      .then((res) => setAccionesDisponibles(res.items))
      .catch(() => {});
  }, []);

  const cargarLogs = (numPagina = 1) => {
    setCargando(true);
    const params: Record<string, any> = { page: numPagina, page_size: 20 };
    if (accionFiltro) params.accion = accionFiltro;
    if (rolFiltro) params.actor_rol = rolFiltro;

    api
      .get<Pagina<LogItem>>('/admin/auditoria', { query: params })
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.auditoria.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarLogs(page);
  }, [page, accionFiltro, rolFiltro]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.auditoria.titulo')}
        description={t('admin.auditoria.descripcion')}
      />

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-56">
            <Select
              label={t('admin.auditoria.filtro_rol')}
              value={rolFiltro}
              onChange={(e) => {
                setRolFiltro(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('comun.todos')}</option>
              <option value="ESTUDIANTE">{e('rol', 'ESTUDIANTE')}</option>
              <option value="DOCENTE">{e('rol', 'DOCENTE')}</option>
              <option value="COORDINADOR">{e('rol', 'COORDINADOR')}</option>
              <option value="BIENESTAR">{e('rol', 'BIENESTAR')}</option>
              <option value="ADMIN">{e('rol', 'ADMIN')}</option>
              <option value="FAMILIAR">{e('rol', 'FAMILIAR')}</option>
            </Select>
          </div>

          <div className="w-64">
            <Select
              label={t('admin.auditoria.filtro_accion')}
              value={accionFiltro}
              onChange={(e) => {
                setAccionFiltro(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('comun.todos')}</option>
              {accionesDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {cargando ? (
        <LoadingState label={t('admin.auditoria.cargando')} />
      ) : error || !data ? (
        <EmptyState
          title={t('admin.auditoria.error_titulo')}
          description={error ?? t('admin.auditoria.error_cargar')}
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          title={t('admin.auditoria.sin_logs_titulo')}
          description={t('admin.auditoria.sin_logs_desc')}
        />
      ) : (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b-2 border-borde font-sans uppercase text-tinta-suave">
                <tr>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_fecha')}</th>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_actor')}</th>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_accion')}</th>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_entidad')}</th>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_ip')}</th>
                  <th className="py-3 px-3">{t('admin.auditoria.columna_detalle')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-fondo-suave/50">
                    <td className="py-2.5 px-3 text-tinta-suave whitespace-nowrap">
                      {f.fecha(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-sans">
                        <Badge color="cobalto">
                          {log.actor_rol ? e('rol', log.actor_rol) : 'SISTEMA'}
                        </Badge>
                      </span>
                      {log.actor_id && <span className="ml-1 text-tinta-suave">#{log.actor_id}</span>}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-tinta">{log.accion}</td>
                    <td className="py-2.5 px-3">
                      {log.entidad}
                      {log.entidad_id && ` #${log.entidad_id}`}
                    </td>
                    <td className="py-2.5 px-3 text-tinta-suave">{log.ip ?? '—'}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-tinta-suave">
                      {log.detalle ? JSON.stringify(log.detalle) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-borde">
            <span className="text-xs text-tinta-suave">
              Página {data.page} ({data.total} eventos)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secundaria"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secundaria"
                disabled={data.page * data.page_size >= data.total}
                onClick={() => setPage(data.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
