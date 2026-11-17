import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
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

export default function PlanDetalleCoordinador() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Acciones
  const [modalDevolver, setModalDevolver] = useState(false);
  const [comentariosDevolucion, setComentariosDevolucion] = useState('');
  const [ejecutando, setEjecutando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargarPlan = () => {
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
        setErrorCarga(apiErr.detail || t('coord.error_cargar_plan'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlan();
  }, [id]);

  const handleValidar = async () => {
    if (!plan) return;
    setEjecutando(true);
    setErrorAccion(null);

    try {
      await api.post(`/planes/${plan.id}/validar`, {
        comentario: 'Validado por Coordinación de Programa',
      });
      setMensajeExito(t('coord.plan_validado_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('coord.error_validar_plan'));
    } finally {
      setEjecutando(false);
    }
  };

  const handleDevolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || comentariosDevolucion.trim().length < 5) {
      setErrorAccion(t('coord.error_comentarios_cortos'));
      return;
    }

    setEjecutando(true);
    setErrorAccion(null);

    try {
      await api.post(`/planes/${plan.id}/devolver`, {
        comentarios: comentariosDevolucion.trim(),
      });
      setModalDevolver(false);
      setMensajeExito(t('coord.plan_devuelto_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('coord.error_devolver_plan'));
    } finally {
      setEjecutando(false);
    }
  };

  const handleFirmar = async () => {
    if (!plan) return;
    setEjecutando(true);
    setErrorAccion(null);

    try {
      await api.post(`/planes/${plan.id}/firmar`, {
        confirmo: true,
      });
      setMensajeExito(t('coord.plan_firmado_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('coord.error_firmar_plan'));
    } finally {
      setEjecutando(false);
    }
  };

  const handleExportar = async (formato: 'pdf' | 'docx' | 'html') => {
    if (!plan) return;
    try {
      await api.post(`/planes/${plan.id}/exportar?formato=${formato}`);
      alert(t('coord.exportacion_solicitada_exito'));
    } catch (err: any) {
      alert(err.detail || 'Error al solicitar exportación');
    }
  };

  if (cargando) {
    return <LoadingState label={t('coord.cargando_plan')} />;
  }

  if (errorCarga || !plan) {
    return <EmptyState title={t('coord.error_titulo')} description={errorCarga} />;
  }

  const enValidacion = plan.estado === 'PENDIENTE_VALIDACION';
  const enFirmas = plan.estado === 'PENDIENTE_FIRMAS';
  const yaFirmoCoord = plan.firmas?.some(
    (f) => f.rol_firmante === 'COORDINADOR' && f.estado === 'FIRMADA' && f.version === plan.version,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('coord.detalle_plan_titulo', { nombre: plan.estudiante.nombre_completo })}
          description={`${plan.semestre_academico} · ${plan.estudiante.programa ?? ''} · Versión ${plan.version}`}
        />
        <div className="flex gap-2">
          <Button variant="secundaria" onClick={() => navigate('/coordinador/planes')}>
            {t('coord.volver_a_planes')}
          </Button>
          <Button variant="secundaria" onClick={() => handleExportar('pdf')}>
            {t('coord.boton_exportar_pdf')}
          </Button>
        </div>
      </div>

      {mensajeExito && (
        <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
          {mensajeExito}
        </div>
      )}

      {errorAccion && (
        <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
          {errorAccion}
        </div>
      )}

      {/* Barra de validación y firma */}
      {(enValidacion || (enFirmas && !yaFirmoCoord)) && (
        <Card className="p-5 bg-papel flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-titulo text-lg font-bold text-tinta">
              {enValidacion
                ? t('coord.banner_validacion_titulo')
                : t('coord.banner_firmas_titulo')}
            </h3>
            <p className="text-sm text-tinta-suave">
              {enValidacion
                ? t('coord.banner_validacion_desc')
                : t('coord.banner_firmas_desc')}
            </p>
          </div>

          <div className="flex gap-3">
            {enValidacion && (
              <>
                <Button
                  variant="secundaria"
                  onClick={() => {
                    setModalDevolver(true);
                    setComentariosDevolucion('');
                  }}
                  disabled={ejecutando}
                >
                  {t('coord.boton_devolver_observaciones')}
                </Button>
                <Button variant="primaria" onClick={handleValidar} loading={ejecutando}>
                  {t('coord.boton_aprobar_validacion')}
                </Button>
              </>
            )}

            {enFirmas && !yaFirmoCoord && (
              <Button variant="primaria" onClick={handleFirmar} loading={ejecutando}>
                {t('coord.boton_firmar_coordinador')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Visualización del plan */}
      <PlanView plan={plan} />

      {/* Modal Devolver con Observaciones */}
      <Dialog
        open={modalDevolver}
        onOpenChange={setModalDevolver}
        title={t('coord.modal_devolver_titulo')}
        description={t('coord.modal_devolver_desc')}
      >
        <form onSubmit={handleDevolver} className="space-y-4 pt-2">
          <Textarea
            label={t('coord.campo_observaciones_devolucion')}
            required
            value={comentariosDevolucion}
            onChange={(e) => setComentariosDevolucion(e.target.value)}
            placeholder="Describe las observaciones o ajustes que deben revisarse antes de validar..."
            rows={4}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalDevolver(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button type="submit" variant="peligro" loading={ejecutando}>
              {t('coord.boton_confirmar_devolucion')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
