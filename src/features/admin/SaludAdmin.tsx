import { useEffect, useState } from 'react';
import { Mail, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT } from '@/lib/useT';

interface SaludData {
  estado: string;
  version?: string;
  checks?: Record<string, any>;
  outbox?: {
    pendientes: number;
    errores: number;
    enviados: number;
  };
  [key: string]: any;
}

export default function SaludAdmin() {
  const t = useT();

  const [data, setData] = useState<SaludData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reintentandoCorreo, setReintentandoCorreo] = useState(false);
  const [resultadoCorreo, setResultadoCorreo] = useState<string | null>(null);

  const [ejecutandoJobs, setEjecutandoJobs] = useState(false);
  const [resultadoJobs, setResultadoJobs] = useState<any>(null);

  const cargarSalud = () => {
    setCargando(true);
    api
      .get<SaludData>('/admin/salud')
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.salud.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarSalud();
  }, []);

  const handleReintentarCorreo = async () => {
    setReintentandoCorreo(true);
    setResultadoCorreo(null);
    try {
      const res = await api.post<any>('/admin/email-outbox/reintentar', {});
      setResultadoCorreo(res.detail || t('admin.salud.correo_reintentado'));
      cargarSalud();
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.salud.error_correo'));
    } finally {
      setReintentandoCorreo(false);
    }
  };

  const handleEjecutarJobs = async () => {
    setEjecutandoJobs(true);
    setResultadoJobs(null);
    try {
      const res = await api.post<any>('/admin/jobs/run-daily', {});
      setResultadoJobs(res);
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.salud.error_jobs'));
    } finally {
      setEjecutandoJobs(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('admin.salud.cargando')} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title={t('admin.salud.error_titulo')}
        description={error ?? t('admin.salud.error_cargar')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.salud.titulo')}
          description={t('admin.salud.descripcion')}
        />
        <Button variant="secundaria" onClick={cargarSalud}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.salud.boton_refrescar')}
        </Button>
      </div>

      {/* Estado General */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-l-4 border-l-semaforo-verde">
          <p className="text-sm font-semibold text-tinta-suave">{t('admin.salud.estado_sistema')}</p>
          <div className="mt-1 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-semaforo-verde" />
            <span className="font-titulo text-xl font-bold uppercase">{data.estado ?? 'OK'}</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-tinta-suave">{t('admin.salud.cola_correo')}</p>
          <div className="mt-2 flex gap-4 text-xs">
            <div>
              <span className="font-bold">{data.outbox?.pendientes ?? 0}</span> {t('admin.salud.pendientes')}
            </div>
            <div>
              <span className="font-bold text-alerta">{data.outbox?.errores ?? 0}</span> {t('admin.salud.con_error')}
            </div>
            <div>
              <span className="font-bold text-semaforo-verde">{data.outbox?.enviados ?? 0}</span> {t('admin.salud.enviados')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-semibold text-tinta-suave">{t('admin.salud.version_aplicacion')}</p>
          <p className="mt-1 font-mono text-lg font-bold">{data.version ?? '1.0.0-sti'}</p>
        </Card>
      </div>

      {/* Acciones de Operación */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-cobalto" />
            <div>
              <CardTitle>{t('admin.salud.gestion_correo_titulo')}</CardTitle>
              <p className="text-xs text-tinta-suave">{t('admin.salud.gestion_correo_desc')}</p>
            </div>
          </div>

          {resultadoCorreo && (
            <p className="text-xs font-semibold text-semaforo-verde">{resultadoCorreo}</p>
          )}

          <Button
            variant="secundaria"
            loading={reintentandoCorreo}
            onClick={handleReintentarCorreo}
          >
            {t('admin.salud.boton_reintentar_correo')}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Play className="h-6 w-6 text-mandarina" />
            <div>
              <CardTitle>{t('admin.salud.jobs_titulo')}</CardTitle>
              <p className="text-xs text-tinta-suave">{t('admin.salud.jobs_desc')}</p>
            </div>
          </div>

          {resultadoJobs && (
            <div className="rounded bg-fondo-suave p-2 text-xs font-mono space-y-1">
              <p className="font-bold">{t('admin.salud.jobs_ejecutados')}:</p>
              <pre className="overflow-x-auto text-[11px]">{JSON.stringify(resultadoJobs.resultados, null, 2)}</pre>
            </div>
          )}

          <Button
            variant="primaria"
            loading={ejecutandoJobs}
            onClick={handleEjecutarJobs}
          >
            {t('admin.salud.boton_ejecutar_jobs')}
          </Button>
        </Card>
      </div>

      {/* Chequeos de componentes */}
      {data.checks && (
        <Card className="space-y-4">
          <CardTitle>{t('admin.salud.diagnosticos_titulo')}</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(data.checks).map(([nombre, val]) => (
              <div key={nombre} className="flex items-center justify-between rounded border border-borde p-3 text-sm">
                <span className="font-semibold">{nombre}</span>
                <Badge color={val === 'ok' || val === true ? 'limon' : 'mandarina'}>
                  {String(val)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
