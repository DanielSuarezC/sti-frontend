import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  LoadingState,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { PlanView } from '@/features/_shared/PlanView';
import type { Plan } from '@/features/_shared/types';

export default function MiPlan() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estados de concertación
  const [ajusteSeleccionado, setAjusteSeleccionado] = useState<number | null>(null);
  const [accionConcertar, setAccionConcertar] = useState<'MODIFICACION_PROPUESTA' | 'OBJETADO' | null>(null);
  const [comentarioConcertar, setComentarioConcertar] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);

  // Firma
  const [firmando, setFirmando] = useState(false);
  const [mensajeFirma, setMensajeFirma] = useState<string | null>(null);

  const cargarPlan = () => {
    setCargando(true);
    setErrorCarga(null);
    api
      .get<Plan>('/planes/mio')
      .then((data) => {
        setPlan(data);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        if (apiErr.status === 404) {
          setErrorCarga(t('miplan.sin_plan'));
        } else {
          setErrorCarga(apiErr.detail || t('miplan.error_cargar'));
        }
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlan();
  }, []);

  const handleAceptarAjuste = async (ajusteId: number) => {
    if (!plan) return;
    try {
      await api.post(`/planes/${plan.id}/ajustes/${ajusteId}/respuesta-estudiante`, {
        respuesta: 'ACEPTADO',
      });
      cargarPlan();
    } catch {
      // Manejo de error
    }
  };

  const handleEnviarConcertacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !ajusteSeleccionado || !accionConcertar) return;

    if (comentarioConcertar.trim().length < 5) {
      setErrorRespuesta(t('miplan.error_comentario_corto'));
      return;
    }

    setEnviandoRespuesta(true);
    setErrorRespuesta(null);

    try {
      await api.post(`/planes/${plan.id}/ajustes/${ajusteSeleccionado}/respuesta-estudiante`, {
        respuesta: accionConcertar,
        comentario: comentarioConcertar.trim(),
      });
      setAjusteSeleccionado(null);
      setAccionConcertar(null);
      setComentarioConcertar('');
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorRespuesta(apiErr.detail || t('miplan.error_enviar_respuesta'));
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const handleFirmarPlan = async () => {
    if (!plan) return;
    setFirmando(true);
    setMensajeFirma(null);

    try {
      await api.post(`/planes/${plan.id}/firmar`, {
        confirmo: true,
      });
      setMensajeFirma(t('miplan.firma_exitosa'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setMensajeFirma(apiErr.detail || t('miplan.error_firmar'));
    } finally {
      setFirmando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('miplan.cargando')} />;
  }

  if (errorCarga || !plan) {
    return (
      <EmptyState
        title={t('miplan.titulo')}
        description={errorCarga || t('miplan.sin_plan')}
      />
    );
  }

  const enConcertacion = plan.estado === 'EN_CONCERTACION' || plan.estado === 'EN_NEGOCIACION';
  const enFirmas = plan.estado === 'PENDIENTE_FIRMAS';
  const yaFirmoEstudiante = plan.firmas?.some(
    (f) => f.rol_firmante === 'ESTUDIANTE' && f.estado === 'FIRMADA' && f.version === plan.version,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('miplan.titulo')}
        description={t('miplan.descripcion', { semestre: plan.semestre_academico, version: plan.version })}
      />

      {/* Banner de firmas */}
      {enFirmas && !yaFirmoEstudiante && (
        <Card className="border-2 border-verde bg-verde-tinte p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-titulo text-lg font-bold text-verde-oscuro">
                {t('miplan.banner_firmas_titulo')}
              </h3>
              <p className="text-sm text-tinta">
                {t('miplan.banner_firmas_desc')}
              </p>
            </div>
            <Button
              variant="primaria"
              onClick={handleFirmarPlan}
              loading={firmando}
            >
              {t('miplan.boton_firmar')}
            </Button>
          </div>
          {mensajeFirma && <p className="mt-2 text-sm font-bold text-tinta">{mensajeFirma}</p>}
        </Card>
      )}

      {/* Acciones de concertación por ajuste */}
      {enConcertacion && (
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('miplan.concertacion_titulo')}</h3>
          <p className="text-sm text-tinta-suave">
            {t('miplan.concertacion_desc')}
          </p>

          <div className="space-y-3">
            {plan.ajustes.map((ajuste) => {
              const resp = ajuste.respuesta_estudiante?.respuesta;
              return (
                <div
                  key={ajuste.id}
                  className="flex flex-col gap-3 rounded-control border-2 border-borde p-4 sm:flex-row sm:items-center sm:justify-between bg-papel"
                >
                  <div>
                    <p className="font-bold text-tinta">{ajuste.nombre_ajuste}</p>
                    <p className="text-sm text-tinta-suave">{ajuste.descripcion_ajuste}</p>
                    {resp && (
                      <span className="mt-1 inline-block text-xs font-bold text-cobalto">
                        {t('miplan.tu_respuesta')}: {resp}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      variant={resp === 'ACEPTADO' ? 'secundaria' : 'primaria'}
                      size="md"
                      onClick={() => handleAceptarAjuste(ajuste.id)}
                    >
                      {t('miplan.aceptar')}
                    </Button>
                    <Button
                      variant="secundaria"
                      size="md"
                      onClick={() => {
                        setAjusteSeleccionado(ajuste.id);
                        setAccionConcertar('MODIFICACION_PROPUESTA');
                        setComentarioConcertar('');
                      }}
                    >
                      {t('miplan.proponer_cambio')}
                    </Button>
                    <Button
                      variant="peligro"
                      size="md"
                      onClick={() => {
                        setAjusteSeleccionado(ajuste.id);
                        setAccionConcertar('OBJETADO');
                        setComentarioConcertar('');
                      }}
                    >
                      {t('miplan.objetar')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modal para objeción o propuesta de cambio */}
      {ajusteSeleccionado !== null && accionConcertar !== null && (
        <Dialog
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) {
              setAjusteSeleccionado(null);
              setAccionConcertar(null);
            }
          }}
          title={
            accionConcertar === 'OBJETADO'
              ? t('miplan.modal_objetar_titulo')
              : t('miplan.modal_proponer_titulo')
          }
          description={
            accionConcertar === 'OBJETADO'
              ? t('miplan.modal_objetar_desc')
              : t('miplan.modal_proponer_desc')
          }
        >
          <form onSubmit={handleEnviarConcertacion} className="space-y-4 pt-2">
            {errorRespuesta && (
              <div
                role="alert"
                className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
              >
                {errorRespuesta}
              </div>
            )}

            <Textarea
              label={t('miplan.modal_comentario_label')}
              required
              value={comentarioConcertar}
              onChange={(e) => setComentarioConcertar(e.target.value)}
              placeholder={t('miplan.modal_comentario_placeholder')}
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secundaria"
                onClick={() => {
                  setAjusteSeleccionado(null);
                  setAccionConcertar(null);
                }}
              >
                {t('recuperar.volver')}
              </Button>
              <Button
                type="submit"
                variant={accionConcertar === 'OBJETADO' ? 'peligro' : 'primaria'}
                loading={enviandoRespuesta}
              >
                {t('miplan.modal_boton_enviar')}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Vista completa del Plan MAAR-TEA */}
      <PlanView plan={plan} />
    </div>
  );
}
