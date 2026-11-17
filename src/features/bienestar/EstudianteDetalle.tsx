import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  MiRuta as MiRutaComponent,
  PageHeader,
  Semaforo,
  type MiRutaPaso,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface EstudianteDetalleData {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  email: string;
  codigo_estudiante: string;
  programa_id: number;
  programa_nombre?: string;
  semestre_actual?: number;
  estado_cuenta: string;
  estado_academico: string;
  via_ingreso: string;
  consentimiento_firmado?: boolean;
  semaforo_actual?: 'VERDE' | 'AMARILLO' | 'ROJO' | null;
  ruta?: {
    paso_actual: number;
    porcentaje_avance: number;
    pasos: Array<{
      numero: number;
      nombre: string;
      estado: 'hecho' | 'actual' | 'pendiente';
      ruta_frontend?: string;
    }>;
    siguiente_accion?: {
      titulo: string;
      descripcion: string;
      ruta_frontend: string;
      boton_texto: string;
    } | null;
  };
}

export default function EstudianteDetalle() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [estudiante, setEstudiante] = useState<EstudianteDetalleData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .get<EstudianteDetalleData>(`/estudiantes/${id}`)
      .then((data) => {
        if (activo) {
          setEstudiante(data);
          setCargando(false);
        }
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setError(apiErr.detail || t('bienestar.error_cargar_estudiante'));
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_expediente')} />;
  }

  if (error || !estudiante) {
    return (
      <EmptyState
        title={t('bienestar.error_titulo')}
        description={error || t('bienestar.error_cargar_estudiante')}
      />
    );
  }

  const pasosTransformados: MiRutaPaso[] = (estudiante.ruta?.pasos || []).map((p) => ({
    n: p.numero,
    estado: p.estado,
    onSelect: p.ruta_frontend ? () => navigate(p.ruta_frontend!) : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={estudiante.nombre_completo}
          description={`${estudiante.codigo_estudiante} · ${estudiante.email}`}
        />
        <Button variant="secundaria" onClick={() => navigate('/bienestar/tablero')}>
          {t('bienestar.volver_al_tablero')}
        </Button>
      </div>

      {/* Resumen institucional */}
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('bienestar.col_programa')}</p>
            <p className="font-semibold text-tinta">{estudiante.programa_nombre || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('bienestar.col_semestre')}</p>
            <p className="font-semibold text-tinta">{estudiante.semestre_actual ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('bienestar.col_estado_cuenta')}</p>
            <span className="inline-block rounded bg-papel px-2 py-0.5 text-xs font-bold border border-borde">
              {estudiante.estado_cuenta}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('bienestar.col_semaforo')}</p>
            {estudiante.semaforo_actual ? (
              <Semaforo estado={estudiante.semaforo_actual} size="sm" />
            ) : (
              <span className="text-sm text-tinta-suave">{t('bienestar.sin_semaforo')}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Acciones rápidas de módulos MAAR-TEA */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to={`/bienestar/estudiantes/${id}/aq10`}
          className="rounded-tarjeta border-2 border-borde bg-mandarina-tinte p-4 hover:border-mandarina transition-colors"
        >
          <p className="font-titulo text-base font-bold text-mandarina-oscuro">
            {t('bienestar.modulo_aq10_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_aq10_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/caracterizacion`}
          className="rounded-tarjeta border-2 border-borde bg-cobalto-tinte p-4 hover:border-cobalto transition-colors"
        >
          <p className="font-titulo text-base font-bold text-cobalto">
            {t('bienestar.modulo_caracterizacion_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_caracterizacion_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/contexto-barreras`}
          className="rounded-tarjeta border-2 border-borde bg-turquesa-tinte p-4 hover:border-turquesa transition-colors"
        >
          <p className="font-titulo text-base font-bold text-turquesa-oscuro">
            {t('bienestar.modulo_barreras_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_barreras_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/sugerencias`}
          className="rounded-tarjeta border-2 border-borde bg-limon-tinte p-4 hover:border-limon transition-colors"
        >
          <p className="font-titulo text-base font-bold text-tinta">
            {t('bienestar.modulo_sugerencias_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_sugerencias_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/plan`}
          className="rounded-tarjeta border-2 border-borde bg-verde-tinte p-4 hover:border-verde transition-colors"
        >
          <p className="font-titulo text-base font-bold text-verde-oscuro">
            {t('bienestar.modulo_plan_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_plan_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/seguimiento`}
          className="rounded-tarjeta border-2 border-borde bg-cobalto-tinte p-4 hover:border-cobalto transition-colors"
        >
          <p className="font-titulo text-base font-bold text-cobalto">
            {t('bienestar.modulo_seguimiento_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_seguimiento_desc')}</p>
        </Link>

        <Link
          to={`/bienestar/estudiantes/${id}/evaluacion`}
          className="rounded-tarjeta border-2 border-borde bg-uva-tinte p-4 hover:border-uva transition-colors"
        >
          <p className="font-titulo text-base font-bold text-uva">
            {t('bienestar.modulo_evaluacion_titulo')}
          </p>
          <p className="text-xs text-tinta-suave mt-1">{t('bienestar.modulo_evaluacion_desc')}</p>
        </Link>
      </div>

      {/* Ruta de 12 pasos */}
      {estudiante.ruta && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between border-b-2 border-borde pb-4">
            <div>
              <h3 className="font-titulo text-xl font-bold">{t('miruta.avance_general')}</h3>
              <p className="text-sm text-tinta-suave">
                {t('miruta.paso_actual_de', {
                  actual: estudiante.ruta.paso_actual,
                  total: 12,
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="font-titulo text-2xl font-bold text-cobalto">
                {estudiante.ruta.porcentaje_avance}%
              </span>
            </div>
          </div>

          <MiRutaComponent pasos={pasosTransformados} showLegend={true} />
        </Card>
      )}
    </div>
  );
}
