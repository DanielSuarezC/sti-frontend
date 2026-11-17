import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  EmptyState,
  LoadingState,
  MiRuta as MiRutaComponent,
  PageHeader,
  type EstadoPaso,
  type MiRutaPaso,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface PasoApi {
  numero: number;
  nombre: string;
  estado: EstadoPaso;
  detalle?: string;
  ruta_frontend?: string;
}

interface RutaApiResponse {
  paso_actual: number;
  porcentaje_avance: number;
  pasos: PasoApi[];
  siguiente_accion?: {
    titulo: string;
    descripcion: string;
    ruta_frontend: string;
    boton_texto: string;
  } | null;
}

export default function MiRuta() {
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [rutaData, setRutaData] = useState<RutaApiResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .get<RutaApiResponse>('/estudiantes/mi-ruta')
      .then((data) => {
        if (activo) {
          setRutaData(data);
          setCargando(false);
        }
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setError(apiErr.detail || t('miruta.error_cargar'));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return <LoadingState label={t('miruta.cargando')} />;
  }

  if (error || !rutaData) {
    return (
      <EmptyState
        title={t('miruta.error_titulo')}
        description={error || t('miruta.error_cargar')}
      />
    );
  }

  const pasosTransformados: MiRutaPaso[] = rutaData.pasos.map((p) => ({
    n: p.numero,
    estado: p.estado,
    onSelect: p.ruta_frontend ? () => navigate(p.ruta_frontend!) : undefined,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('miruta.titulo')}
        description={t('miruta.descripcion')}
      />

      {rutaData.siguiente_accion && (
        <Card className="border-2 border-cobalto bg-cobalto-tinte p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cobalto">
                {t('miruta.siguiente_paso')}
              </p>
              <h2 className="font-titulo text-lg font-bold text-tinta">
                {rutaData.siguiente_accion.titulo}
              </h2>
              <p className="text-sm text-tinta-suave">
                {rutaData.siguiente_accion.descripcion}
              </p>
            </div>
            {rutaData.siguiente_accion.ruta_frontend && (
              <button
                type="button"
                onClick={() => navigate(rutaData.siguiente_accion!.ruta_frontend)}
                className="shrink-0 rounded-control bg-cobalto px-4 py-2 font-titulo text-sm font-semibold text-blanco hover:bg-cobalto-oscuro"
              >
                {rutaData.siguiente_accion.boton_texto || t('miruta.continuar')}
              </button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between border-b-2 border-borde pb-4">
          <div>
            <h3 className="font-titulo text-xl font-bold">{t('miruta.avance_general')}</h3>
            <p className="text-sm text-tinta-suave">
              {t('miruta.paso_actual_de', { actual: rutaData.paso_actual, total: 12 })}
            </p>
          </div>
          <div className="text-right">
            <span className="font-titulo text-2xl font-bold text-cobalto">
              {rutaData.porcentaje_avance}%
            </span>
          </div>
        </div>

        <MiRutaComponent pasos={pasosTransformados} showLegend={true} />
      </Card>
    </div>
  );
}
