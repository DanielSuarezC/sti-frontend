import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { PlanView } from '@/features/_shared/PlanView';
import type { Plan } from '@/features/_shared/types';

export default function PlanConstructor() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Modal nuevo ajuste
  const [modalAjuste, setModalAjuste] = useState(false);
  const [nombreAjuste, setNombreAjuste] = useState('');
  const [descAjuste, setDescAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('PEDAGOGIA');
  const [detalleTipo, setDetalleTipo] = useState('MATERIALES_ANTICIPADOS');
  const [barreraId, setBarreraId] = useState<string>('');
  const [barrerasDisponibles, setBarrerasDisponibles] = useState<Array<{ id: number; descripcion_barrera: string }>>([]);

  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargarPlan = () => {
    if (!id) return;
    setCargando(true);
    setErrorCarga(null);
    api
      .get<{ items: Plan[] }>(`/estudiantes/${id}/planes`)
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const planId = data.items[0]!.id;
          return api.get<Plan>(`/planes/${planId}`);
        }
        return null;
      })
      .then((p) => {
        setPlan(p);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('bienestar.error_cargar_plan'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarPlan();
    // Cargar barreras para vincular a ajustes
    api
      .get<{ items: any[] }>(`/estudiantes/${id}/barreras`)
      .then((bData) => {
        setBarrerasDisponibles(bData.items || []);
        if (bData.items?.[0]) {
          setBarreraId(bData.items[0].id.toString());
        }
      })
      .catch(() => {});
  }, [id]);

  const handleCrearBorrador = async () => {
    setEjecutandoAccion(true);
    setMensajeAccion(null);
    setErrorAccion(null);

    try {
      await api.post(`/estudiantes/${id}/planes`, {
        incluir_sugerencias: true,
      });
      setMensajeAccion(t('bienestar.borrador_creado_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_crear_borrador'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  const handleCrearAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !barreraId) return;

    setEjecutandoAccion(true);
    setErrorAccion(null);

    try {
      await api.post(`/planes/${plan.id}/ajustes`, {
        nombre_ajuste: nombreAjuste.trim(),
        descripcion_ajuste: descAjuste.trim(),
        tipo_ajuste: tipoAjuste,
        detalle: { tipo: detalleTipo, descripcion: descAjuste.trim() },
        barrera_asociada_id: Number(barreraId),
      });

      setModalAjuste(false);
      setNombreAjuste('');
      setDescAjuste('');
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_crear_ajuste'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  const handleEnviarConcertacion = async () => {
    if (!plan) return;
    setEjecutandoAccion(true);
    try {
      await api.post(`/planes/${plan.id}/enviar-a-estudiante`);
      setMensajeAccion(t('bienestar.plan_enviado_estudiante_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_enviar_concertacion'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  const handleEnviarValidacion = async () => {
    if (!plan) return;
    setEjecutandoAccion(true);
    try {
      await api.post(`/planes/${plan.id}/enviar-a-validacion`);
      setMensajeAccion(t('bienestar.plan_enviado_validacion_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_enviar_validacion'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  const handleFirmarBienestar = async () => {
    if (!plan) return;
    setEjecutandoAccion(true);
    try {
      await api.post(`/planes/${plan.id}/firmar`, { confirmo: true });
      setMensajeAccion(t('bienestar.plan_firmado_bienestar_exito'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_firmar_bienestar'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  const handleIniciarImplementacion = async () => {
    if (!plan) return;
    setEjecutandoAccion(true);
    try {
      await api.post(`/planes/${plan.id}/iniciar-implementacion`);
      setMensajeAccion(t('bienestar.plan_implementacion_iniciada'));
      cargarPlan();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_iniciar_implementacion'));
    } finally {
      setEjecutandoAccion(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_plan')} />;
  }

  if (errorCarga) {
    return <EmptyState title={t('bienestar.error_titulo')} description={errorCarga} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.constructor_plan_titulo')}
          description={
            plan
              ? t('bienestar.constructor_plan_desc', {
                  estado: plan.estado,
                  version: plan.version,
                })
              : t('bienestar.sin_plan_creado_desc')
          }
        />
        <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
          {t('bienestar.volver_al_expediente')}
        </Button>
      </div>

      {mensajeAccion && (
        <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
          {mensajeAccion}
        </div>
      )}

      {errorAccion && (
        <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
          {errorAccion}
        </div>
      )}

      {!plan ? (
        <Card className="p-8 text-center space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('bienestar.crear_primer_plan_titulo')}</h3>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            {t('bienestar.crear_primer_plan_desc')}
          </p>
          <Button
            variant="primaria"
            onClick={handleCrearBorrador}
            loading={ejecutandoAccion}
          >
            {t('bienestar.boton_generar_borrador_asistido')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Barra de acciones de ciclo de vida */}
          <Card className="p-5 flex flex-wrap items-center justify-between gap-3 bg-papel">
            <div className="flex flex-wrap gap-2">
              {plan.estado === 'BORRADOR' && (
                <>
                  <Button variant="primaria" onClick={() => setModalAjuste(true)}>
                    {t('bienestar.boton_agregar_ajuste')}
                  </Button>
                  <Button
                    variant="secundaria"
                    onClick={handleEnviarConcertacion}
                    loading={ejecutandoAccion}
                  >
                    {t('bienestar.boton_enviar_concertacion')}
                  </Button>
                </>
              )}

              {plan.estado === 'EN_CONCERTACION' && (
                <>
                  <Button variant="secundaria" onClick={() => setModalAjuste(true)}>
                    {t('bienestar.boton_agregar_ajuste')}
                  </Button>
                  <Button
                    variant="primaria"
                    onClick={handleEnviarValidacion}
                    loading={ejecutandoAccion}
                  >
                    {t('bienestar.boton_enviar_validacion')}
                  </Button>
                </>
              )}

              {plan.estado === 'PENDIENTE_FIRMAS' && (
                <Button
                  variant="primaria"
                  onClick={handleFirmarBienestar}
                  loading={ejecutandoAccion}
                >
                  {t('bienestar.boton_firmar_plan')}
                </Button>
              )}

              {plan.estado === 'APROBADO' && (
                <Button
                  variant="primaria"
                  onClick={handleIniciarImplementacion}
                  loading={ejecutandoAccion}
                >
                  {t('bienestar.boton_iniciar_implementacion')}
                </Button>
              )}
            </div>

            <span className="rounded bg-cobalto-tinte px-3 py-1 font-titulo text-sm font-bold text-cobalto border border-cobalto">
              {plan.estado} · v{plan.version}
            </span>
          </Card>

          {/* Vista completa del Plan */}
          <PlanView plan={plan} />
        </div>
      )}

      {/* Modal Nuevo Ajuste */}
      <Dialog
        open={modalAjuste}
        onOpenChange={setModalAjuste}
        title={t('bienestar.modal_ajuste_titulo')}
        description={t('bienestar.modal_ajuste_desc')}
      >
        <form onSubmit={handleCrearAjuste} className="space-y-4 pt-2">
          <Input
            label={t('bienestar.campo_nombre_ajuste')}
            required
            value={nombreAjuste}
            onChange={(e) => setNombreAjuste(e.target.value)}
            placeholder="p. ej. Material anticipado con esquemas visuales"
          />

          <Textarea
            label={t('bienestar.campo_desc_ajuste')}
            required
            value={descAjuste}
            onChange={(e) => setDescAjuste(e.target.value)}
            placeholder="En qué consiste el ajuste y cómo se aplica..."
            rows={3}
          />

          <Select
            label={t('bienestar.campo_tipo_ajuste')}
            value={tipoAjuste}
            onChange={(e) => {
              setTipoAjuste(e.target.value);
              if (e.target.value === 'PEDAGOGIA') setDetalleTipo('MATERIALES_ANTICIPADOS');
              else if (e.target.value === 'COMUNICACION') setDetalleTipo('INSTRUCCIONES_ESCRITAS');
              else if (e.target.value === 'EVALUACION') setDetalleTipo('TIEMPO_EXTENDIDO');
              else if (e.target.value === 'AMBIENTE') setDetalleTipo('ESPACIO_TRANQUILO');
              else if (e.target.value === 'INTERACCION') setDetalleTipo('TRABAJO_INDIVIDUAL');
              else if (e.target.value === 'TECNOLOGIA') setDetalleTipo('SOFTWARE_ACCESIBILIDAD');
            }}
          >
            <option value="PEDAGOGIA">PEDAGOGIA</option>
            <option value="COMUNICACION">COMUNICACION</option>
            <option value="EVALUACION">EVALUACION</option>
            <option value="AMBIENTE">AMBIENTE</option>
            <option value="INTERACCION">INTERACCION</option>
            <option value="TECNOLOGIA">TECNOLOGIA</option>
          </Select>

          <Select
            label={t('bienestar.campo_barrera_asociada')}
            required
            value={barreraId}
            onChange={(e) => setBarreraId(e.target.value)}
          >
            {barrerasDisponibles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.descripcion_barrera.slice(0, 70)}...
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalAjuste(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button type="submit" variant="primaria" loading={ejecutandoAccion}>
              {t('bienestar.boton_guardar_ajuste')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
