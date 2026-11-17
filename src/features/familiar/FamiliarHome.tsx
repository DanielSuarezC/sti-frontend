import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { PlanesTable } from '@/features/_shared/PlanesTable';
import type { Pagina } from '@/lib/types';
import type { PlanItem } from '@/features/_shared/types';

export default function FamiliarHome() {
  const intl = useIntl();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [pagina, setPagina] = useState<Pagina<PlanItem> | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarPlanes = (numPagina = 1) => {
    setCargando(true);
    api
      .get<Pagina<PlanItem>>('/planes', { query: { page: numPagina, page_size: 20 } })
      .then((data) => {
        setPagina(data);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('familiar.error_cargar_planes'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlanes(page);
  }, [page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('familiar.planes_titulo')}
        description={t('familiar.planes_descripcion')}
      />

      {cargando ? (
        <LoadingState label={t('familiar.cargando_planes')} />
      ) : error ? (
        <EmptyState title={t('familiar.error_titulo')} description={error} />
      ) : (
        <PlanesTable
          data={pagina}
          loading={cargando}
          error={error}
          page={page}
          onPageChange={setPage}
          basePath="/familiar/planes"
          caption={t('familiar.tabla_caption')}
          emptyTitle={t('familiar.sin_planes_titulo')}
          emptyDescription={t('familiar.sin_planes_desc')}
        />
      )}
    </div>
  );
}
