import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import type { Plan } from '@/features/_shared/types';

export default function EvaluacionF9F10() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Formulario F9
  const [efectividadGeneral, setEfectividadGeneral] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('ALTA');
  const [observacionesF9, setObservacionesF9] = useState('');
  const [decisionesAjustes, setDecisionesAjustes] = useState<
    Record<number, { decision: 'MANTENER' | 'MODIFICAR' | 'RETIRAR'; justificacion: string }>
  >({});

  // F10 Nota de continuidad
  const [notaRecomendaciones, setNotaRecomendaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    if (!id) return;

    api
      .get<{ items: Plan[] }>(`/estudiantes/${id}/planes`)
      .then((data) => {
        if (!activo) return;
        if (data.items && data.items.length > 0) {
          const planId = data.items[0]!.id;
          return api.get<Plan>(`/planes/${planId}`);
        }
        return null;
      })
      .then((p) => {
        if (!activo) return;
        setPlan(p ?? null);
        setCargando(false);
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setErrorCarga(apiErr.detail || t('bienestar.error_cargar_evaluacion'));
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const handleGuardarEvaluacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    setGuardando(true);
    setMensajeExito(null);

    try {
      const itemsDecisiones = plan.ajustes.map((a) => {
        const d = decisionesAjustes[a.id] || { decision: 'MANTENER', justificacion: 'Ajuste adecuado' };
        return {
          ajuste_id: a.id,
          decision: d.decision,
          justificacion: d.justificacion.trim() || 'Evaluado en cierre semestral',
        };
      });

      await api.post(`/planes/${plan.id}/evaluacion`, {
        efectividad_general: efectividadGeneral,
        observaciones_generales: observacionesF9.trim() || null,
        decisiones: itemsDecisiones,
      });

      if (notaRecomendaciones.trim()) {
        await api.post(`/estudiantes/${id}/continuidad`, {
          recomendaciones_siguiente_semestre: notaRecomendaciones.trim(),
        });
      }

      setMensajeExito(t('bienestar.evaluacion_guardada_exito'));
    } catch (err: any) {
      alert(err.detail || 'Ocurrió un error al guardar la evaluación.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_evaluacion')} />;
  }

  if (errorCarga || !plan) {
    return (
      <EmptyState
        title={t('bienestar.evaluacion_titulo')}
        description={errorCarga || t('bienestar.sin_plan_evaluacion_desc')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.evaluacion_titulo')}
          description={t('bienestar.evaluacion_descripcion')}
        />
        <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
          {t('bienestar.volver_al_expediente')}
        </Button>
      </div>

      {mensajeExito && (
        <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
          {mensajeExito}
        </div>
      )}

      <form onSubmit={handleGuardarEvaluacion} className="space-y-6">
        {/* Evaluación general F9 */}
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('bienestar.f9_evaluacion_general_titulo')}</h3>

          <Select
            label={t('bienestar.campo_efectividad_general')}
            value={efectividadGeneral}
            onChange={(e) => setEfectividadGeneral(e.target.value as any)}
          >
            <option value="ALTA">ALTA (Los ajustes permitieron plena participación)</option>
            <option value="MEDIA">MEDIA (Se lograron mejoras parciales con apoyos adicionales)</option>
            <option value="BAJA">BAJA (Persistieron barreras significativas)</option>
          </Select>

          <Textarea
            label={t('bienestar.campo_observaciones_f9')}
            value={observacionesF9}
            onChange={(e) => setObservacionesF9(e.target.value)}
            placeholder="Síntesis de los logros académicos y barreras superadas en el semestre..."
            rows={3}
          />
        </Card>

        {/* Decisiones por ajuste */}
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('bienestar.decisiones_ajustes_titulo')}</h3>
          <p className="text-sm text-tinta-suave">
            {t('bienestar.decisiones_ajustes_desc')}
          </p>

          <div className="space-y-3">
            {plan.ajustes.map((ajuste) => {
              const d = decisionesAjustes[ajuste.id] || { decision: 'MANTENER', justificacion: '' };
              return (
                <div
                  key={ajuste.id}
                  className="rounded-control border-2 border-borde p-4 bg-papel space-y-2"
                >
                  <p className="font-bold text-tinta">{ajuste.nombre_ajuste}</p>
                  <div className="grid gap-3 sm:grid-cols-2 pt-1">
                    <Select
                      label={t('bienestar.decision_ajuste_label')}
                      value={d.decision}
                      onChange={(e) =>
                        setDecisionesAjustes((prev) => ({
                          ...prev,
                          [ajuste.id]: { ...d, decision: e.target.value as any },
                        }))
                      }
                    >
                      <option value="MANTENER">MANTENER (Continuar el próximo semestre)</option>
                      <option value="MODIFICAR">MODIFICAR (Ajustar intensidad o alcance)</option>
                      <option value="RETIRAR">RETIRAR (Barrera superada o no aplicable)</option>
                    </Select>

                    <Input
                      label={t('bienestar.justificacion_decision_label')}
                      value={d.justificacion}
                      onChange={(e) =>
                        setDecisionesAjustes((prev) => ({
                          ...prev,
                          [ajuste.id]: { ...d, justificacion: e.target.value },
                        }))
                      }
                      placeholder="Motivo de la decisión..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Nota de Continuidad F10 */}
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('bienestar.f10_continuidad_titulo')}</h3>
          <p className="text-sm text-tinta-suave">
            {t('bienestar.f10_continuidad_desc')}
          </p>

          <Textarea
            label={t('bienestar.campo_recomendaciones_siguiente')}
            value={notaRecomendaciones}
            onChange={(e) => setNotaRecomendaciones(e.target.value)}
            placeholder="Recomendaciones clave para el equipo de docentes y bienestar del siguiente semestre..."
            rows={3}
          />
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primaria" loading={guardando}>
            {t('bienestar.boton_guardar_evaluacion_final')}
          </Button>
        </div>
      </form>
    </div>
  );
}
