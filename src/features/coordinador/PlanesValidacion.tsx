import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { PlanesTable } from '@/features/_shared/PlanesTable';
import type { Pagina } from '@/lib/types';
import type { PlanItem } from '@/features/_shared/types';

export default function PlanesValidacion() {
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [pagina, setPagina] = useState<Pagina<PlanItem> | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPlanes = (numPagina = 1) => {
    setCargando(true);
    const query: Record<string, any> = { page: numPagina, page_size: 20 };
    if (estadoFiltro) query.estado = estadoFiltro;

    api
      .get<Pagina<PlanItem>>('/planes', { query })
      .then((data) => {
        setPagina(data);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('coord.error_cargar_planes'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlanes(page);
  }, [page, estadoFiltro]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('coord.planes_titulo')}
          description={t('coord.planes_descripcion')}
        />
        <Button variant="secundaria" onClick={() => navigate('/coordinador/metricas')}>
          {t('coord.ver_metricas_m9')}
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <Select
              label={t('coord.filtro_estado')}
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('coord.todos_los_estados')}</option>
              <option value="PENDIENTE_VALIDACION">{t('coord.estado_pendiente_validacion')}</option>
              <option value="PENDIENTE_FIRMAS">{t('coord.estado_pendiente_firmas')}</option>
              <option value="APROBADO">{t('coord.estado_aprobado')}</option>
              <option value="IMPLEMENTACION">{t('coord.estado_implementacion')}</option>
              <option value="SEGUIMIENTO">{t('coord.estado_seguimiento')}</option>
            </Select>
          </div>
        </div>
      </Card>

      {cargando ? (
        <LoadingState label={t('coord.cargando_planes')} />
      ) : error ? (
        <EmptyState title={t('coord.error_titulo')} description={error} />
      ) : (
        <PlanesTable
          data={pagina}
          loading={cargando}
          error={error}
          page={page}
          onPageChange={setPage}
          basePath="/coordinador/planes"
          caption={t('coord.tabla_caption')}
          emptyTitle={t('coord.sin_planes_titulo')}
          emptyDescription={t('coord.sin_planes_desc')}
        />
      )}
    </div>
  );
}
