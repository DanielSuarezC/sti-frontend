import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SolicitudArcoItem {
  id: number;
  radicado: string;
  tipo: 'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION';
  descripcion: string;
  estado: 'RECIBIDA' | 'EN_TRAMITE' | 'RESUELTA' | 'RECHAZADA';
  fecha_radicacion: string;
  fecha_limite: string;
  respuesta?: string | null;
}

export default function DerechosArco() {
  const intl = useIntl();
  const { logout } = useAuth();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [solicitudes, setSolicitudes] = useState<SolicitudArcoItem[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario nueva solicitud
  const [tipo, setTipo] = useState<'ACCESO' | 'RECTIFICACION' | 'CANCELACION' | 'OPOSICION'>('ACCESO');
  const [descripcion, setDescripcion] = useState('');
  const [radicando, setRadicando] = useState(false);
  const [mensajeExitoRadicado, setMensajeExitoRadicado] = useState<string | null>(null);
  const [errorRadicado, setErrorRadicado] = useState<string | null>(null);

  // Descargar mis datos
  const [descargando, setDescargando] = useState(false);

  // Revocación F0
  const [modalRevocar, setModalRevocar] = useState(false);
  const [motivoRevocacion, setMotivoRevocacion] = useState('');
  const [confirmarRevocacion, setConfirmarRevocacion] = useState(false);
  const [revocando, setRevocando] = useState(false);
  const [errorRevocacion, setErrorRevocacion] = useState<string | null>(null);

  const cargarSolicitudes = () => {
    api
      .get<{ items: SolicitudArcoItem[] }>('/arco/mis-solicitudes')
      .then((data) => {
        setSolicitudes(data.items || []);
        setCargando(false);
      })
      .catch(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleRadicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcion.trim().length < 10) {
      setErrorRadicado(t('arco.error_descripcion_corta'));
      return;
    }

    setRadicando(true);
    setErrorRadicado(null);
    setMensajeExitoRadicado(null);

    try {
      const res = await api.post<SolicitudArcoItem>('/arco/solicitudes', {
        tipo,
        descripcion: descripcion.trim(),
      });
      setMensajeExitoRadicado(t('arco.radicado_exito', { radicado: res.radicado }));
      setDescripcion('');
      cargarSolicitudes();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorRadicado(apiErr.detail || t('arco.error_radicar'));
    } finally {
      setRadicando(false);
    }
  };

  const handleDescargarDatos = async () => {
    setDescargando(true);
    try {
      const data = await api.get<any>('/arco/exportar-mis-datos');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis-datos-sti-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Manejo de error
    } finally {
      setDescargando(false);
    }
  };

  const handleRevocarConsentimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmarRevocacion) return;

    setRevocando(true);
    setErrorRevocacion(null);

    try {
      await api.post('/consentimiento/revocar', {
        confirmar: true,
        motivo: motivoRevocacion.trim() || undefined,
      });
      setModalRevocar(false);
      await logout();
      window.location.href = '/login';
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorRevocacion(apiErr.detail || t('arco.error_revocar'));
      setRevocando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('arco.cargando')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('arco.titulo')}
        description={t('arco.descripcion')}
      />

      {/* Descargar mis datos (Derecho de Acceso y Portabilidad) */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-titulo text-lg font-bold">{t('arco.portabilidad_titulo')}</h3>
            <p className="text-sm text-tinta-suave max-w-medida">
              {t('arco.portabilidad_desc')}
            </p>
          </div>
          <Button variant="secundaria" onClick={handleDescargarDatos} loading={descargando}>
            {t('arco.boton_descargar_datos')}
          </Button>
        </div>
      </Card>

      {/* Radicar solicitud ARCO */}
      <Card className="p-6">
        <form onSubmit={handleRadicar} className="space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('arco.radicar_titulo')}</h3>
          <p className="text-sm text-tinta-suave">{t('arco.radicar_desc')}</p>

          {mensajeExitoRadicado && (
            <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
              {mensajeExitoRadicado}
            </div>
          )}

          {errorRadicado && (
            <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
              {errorRadicado}
            </div>
          )}

          <Select
            label={t('arco.campo_tipo')}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
          >
            <option value="ACCESO">{t('arco.tipo_acceso')}</option>
            <option value="RECTIFICACION">{t('arco.tipo_rectificacion')}</option>
            <option value="CANCELACION">{t('arco.tipo_cancelacion')}</option>
            <option value="OPOSICION">{t('arco.tipo_oposicion')}</option>
          </Select>

          <Textarea
            label={t('arco.campo_descripcion')}
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={t('arco.descripcion_placeholder')}
            rows={3}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primaria" loading={radicando}>
              {t('arco.boton_radicar')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Mis solicitudes radicadas */}
      <Card className="p-6 space-y-4">
        <h3 className="font-titulo text-xl font-bold">{t('arco.mis_solicitudes_titulo')}</h3>
        {solicitudes.length === 0 ? (
          <EmptyState
            title={t('arco.sin_solicitudes_titulo')}
            description={t('arco.sin_solicitudes_desc')}
          />
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s) => (
              <div
                key={s.id}
                className="rounded-control border-2 border-borde p-4 bg-papel space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cobalto">{s.radicado}</span>
                  <span className="rounded bg-blanco px-2 py-0.5 text-xs font-bold border border-borde">
                    {s.estado}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase text-tinta-suave">{s.tipo}</p>
                <p className="text-sm text-tinta">{s.descripcion}</p>
                {s.respuesta && (
                  <div className="rounded bg-blanco p-3 border border-borde text-sm">
                    <p className="font-bold text-xs uppercase text-verde-oscuro">{t('arco.respuesta_titulo')}:</p>
                    <p className="mt-1">{s.respuesta}</p>
                  </div>
                )}
                <p className="text-xs text-tinta-suave">
                  {t('arco.fecha_radicacion')}: {new Date(s.fecha_radicacion).toLocaleDateString()} ·{' '}
                  {t('arco.fecha_limite')}: {new Date(s.fecha_limite).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Zona de peligro: Revocar consentimiento */}
      <Card className="border-2 border-rojo p-6 bg-rojo-tinte space-y-3">
        <h3 className="font-titulo text-xl font-bold text-rojo">{t('arco.zona_peligro_titulo')}</h3>
        <p className="text-sm text-tinta">{t('arco.zona_peligro_desc')}</p>
        <div>
          <Button variant="peligro" onClick={() => setModalRevocar(true)}>
            {t('arco.boton_revocar_consentimiento')}
          </Button>
        </div>
      </Card>

      {/* Modal confirmar revocación */}
      <Dialog
        open={modalRevocar}
        onOpenChange={setModalRevocar}
        title={t('arco.modal_revocar_titulo')}
        description={t('arco.modal_revocar_desc')}
      >
        <form onSubmit={handleRevocarConsentimiento} className="space-y-4 pt-2">
          {errorRevocacion && (
            <div className="rounded-control border-2 border-rojo bg-blanco p-3 text-sm text-rojo font-bold">
              {errorRevocacion}
            </div>
          )}

          <Textarea
            label={t('arco.motivo_revocacion_label')}
            value={motivoRevocacion}
            onChange={(e) => setMotivoRevocacion(e.target.value)}
            placeholder={t('arco.motivo_revocacion_placeholder')}
            rows={2}
          />

          <label className="flex items-start gap-3 cursor-pointer text-sm">
            <input
              type="checkbox"
              required
              checked={confirmarRevocacion}
              onChange={(e) => setConfirmarRevocacion(e.target.checked)}
              className="mt-1 size-4 rounded border-2 border-rojo text-rojo focus:ring-rojo"
            />
            <span className="font-bold text-rojo">
              {t('arco.confirmar_revocacion_check')}
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalRevocar(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button
              type="submit"
              variant="peligro"
              loading={revocando}
              disabled={!confirmarRevocacion}
            >
              {t('arco.boton_confirmar_revocacion')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
