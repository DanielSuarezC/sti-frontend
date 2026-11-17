import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { buttonClasses, EmptyState, LoadingState, PageHeader } from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { PlanView } from '@/features/_shared/PlanView';
import type { Plan } from '@/features/_shared/types';
import { useT } from '@/lib/useT';

export default function PlanDetalleFamiliar() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    api
      .get<Plan>(`/planes/${id}`)
      .then((data) => {
        setPlan(data);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('familiar.error_cargar_plan'));
        setCargando(false);
      });
  }, [id, t]);

  if (cargando) {
    return <LoadingState label={t('familiar.cargando_plan')} />;
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <Link to="/familiar/planes" className={buttonClasses('fantasma')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('familiar.volver_lista')}
        </Link>
        <EmptyState
          title={t('familiar.error_titulo')}
          description={error ?? t('familiar.error_cargar_plan')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/familiar/planes" className={buttonClasses('fantasma')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('familiar.volver_lista')}
        </Link>
      </div>

      <PageHeader
        title={t('familiar.detalle_titulo', { codigo: `${plan.semestre_academico} - v${plan.version}` })}
        description={t('familiar.detalle_descripcion')}
      />

      <PlanView plan={plan} />
    </div>
  );
}
