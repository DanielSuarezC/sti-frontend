import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Semaforo,
  Stat,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface DashboardReporte {
  k_minimo: number;
  nota_privacidad: string;
  totales: {
    planes_activos: number;
    semaforo: {
      VERDE: number;
      AMARILLO: number;
      ROJO: number;
      SIN_REGISTRO: number;
    };
    permanencia?: {
      continuan: number;
      no_continuan: number;
      tasa_permanencia_pct?: number;
    };
  };
  programas: Array<{
    programa_id: number;
    programa: string;
    planes_activos: number;
    semaforo: {
      VERDE: number;
      AMARILLO: number;
      ROJO: number;
    };
  }>;
}

interface AjustesFrecuentesReporte {
  categorias: Array<{
    categoria: string;
    estudiantes: number;
    ajustes: number;
  }>;
}

export default function DashboardMetricas() {
  const intl = useIntl();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [dashboard, setDashboard] = useState<DashboardReporte | null>(null);
  const [ajustesFrecuentes, setAjustesFrecuentes] = useState<AjustesFrecuentesReporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      api.get<DashboardReporte>('/reportes/dashboard').catch(() => null),
      api.get<AjustesFrecuentesReporte>('/reportes/ajustes-frecuentes').catch(() => null),
    ])
      .then(([dashData, ajustesData]) => {
        if (!activo) return;
        setDashboard(dashData);
        setAjustesFrecuentes(ajustesData);
        setCargando(false);
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setErrorCarga(apiErr.detail || t('coord.error_cargar_metricas'));
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleExportar = async (tipo: string) => {
    try {
      window.open(`/api/v1/reportes/${tipo}/export?formato=xlsx`, '_blank');
    } catch {
      // Manejo de error
    }
  };

  if (cargando) {
    return <LoadingState label={t('coord.cargando_metricas')} />;
  }

  if (errorCarga || !dashboard) {
    return <EmptyState title={t('coord.error_titulo')} description={errorCarga} />;
  }

  const { totales } = dashboard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('coord.metricas_titulo')}
          description={t('coord.metricas_descripcion')}
        />
        <div className="flex gap-2">
          <Button variant="secundaria" onClick={() => handleExportar('dashboard')}>
            {t('coord.boton_exportar_excel')}
          </Button>
        </div>
      </div>

      {dashboard.nota_privacidad && (
        <div
          role="note"
          className="rounded-control border-2 border-limon bg-limon-tinte p-3 text-xs font-medium text-tinta"
        >
          <span className="font-bold">{t('coord.privacidad_k_titulo')}: </span>
          {dashboard.nota_privacidad}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <Stat
            value={totales.planes_activos}
            label={t('coord.stat_planes_activos')}
          />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('coord.stat_semaforo_verde')}</p>
            <p className="font-titulo text-3xl font-bold text-verde">{totales.semaforo.VERDE}</p>
          </div>
          <Semaforo estado="VERDE" size="lg" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('coord.stat_semaforo_amarillo')}</p>
            <p className="font-titulo text-3xl font-bold text-mandarina-oscuro">{totales.semaforo.AMARILLO}</p>
          </div>
          <Semaforo estado="AMARILLO" size="lg" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-tinta-suave">{t('coord.stat_semaforo_rojo')}</p>
            <p className="font-titulo text-3xl font-bold text-rojo">{totales.semaforo.ROJO}</p>
          </div>
          <Semaforo estado="ROJO" size="lg" />
        </Card>
      </div>

      {/* Distribución por programas */}
      <Card className="p-6 space-y-4">
        <h3 className="font-titulo text-xl font-bold">{t('coord.programas_monitoreados_titulo')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-borde font-titulo text-xs uppercase text-tinta-suave">
              <tr>
                <th className="py-2">{t('coord.col_programa_nombre')}</th>
                <th className="py-2 text-center">{t('coord.col_planes')}</th>
                <th className="py-2 text-center">{t('semaforo.VERDE')}</th>
                <th className="py-2 text-center">{t('semaforo.AMARILLO')}</th>
                <th className="py-2 text-center">{t('semaforo.ROJO')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {dashboard.programas.map((prog) => (
                <tr key={prog.programa_id}>
                  <td className="py-3 font-semibold text-tinta">{prog.programa}</td>
                  <td className="py-3 text-center">{prog.planes_activos}</td>
                  <td className="py-3 text-center font-bold text-verde">{prog.semaforo.VERDE}</td>
                  <td className="py-3 text-center font-bold text-mandarina-oscuro">{prog.semaforo.AMARILLO}</td>
                  <td className="py-3 text-center font-bold text-rojo">{prog.semaforo.ROJO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ajustes más frecuentes */}
      {ajustesFrecuentes && (
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('coord.ajustes_frecuentes_titulo')}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ajustesFrecuentes.categorias.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-control border-2 border-borde p-4 bg-papel space-y-1"
              >
                <p className="font-bold text-cobalto">{cat.categoria}</p>
                <p className="text-xs text-tinta-suave">
                  {t('coord.n_ajustes_n_estudiantes', {
                    ajustes: cat.ajustes,
                    estudiantes: cat.estudiantes,
                  })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
