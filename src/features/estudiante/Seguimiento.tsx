import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Semaforo,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import type { Plan } from '@/features/_shared/types';

interface CorteSeguimiento {
  corte: 'C1' | 'C2' | 'C3';
  fecha_corte: string;
  estado: 'FUTURO' | 'ABIERTO' | 'CERRADO';
  cerrado: boolean;
  semaforo_estado?: 'VERDE' | 'AMARILLO' | 'ROJO' | null;
}

interface SeguimientoRespuesta {
  plan_id: number;
  plan_estado: string;
  semestre: string;
  cortes: CorteSeguimiento[];
}

export default function SeguimientoEstudiante() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [seguimientoData, setSeguimientoData] = useState<SeguimientoRespuesta | null>(null);
  const [corteActivo, setCorteActivo] = useState<'C1' | 'C2' | 'C3'>('C1');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Registro de percepción
  const [percepciones, setPercepciones] = useState<
    Record<number, { valor: 'POSITIVA' | 'PARCIAL' | 'NEGATIVA'; comentario: string }>
  >({});
  const [guardandoPercepcion, setGuardandoPercepcion] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState<number | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .get<Plan>('/planes/mio')
      .then((p) => {
        if (!activo) return;
        setPlan(p);
        return api.get<SeguimientoRespuesta>(`/planes/${p.id}/seguimiento`);
      })
      .then((seg) => {
        if (!activo || !seg) return;
        setSeguimientoData(seg);
        const abierto = seg.cortes.find((c) => c.estado === 'ABIERTO');
        if (abierto) {
          setCorteActivo(abierto.corte);
        }
        setCargando(false);
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setErrorCarga(apiErr.detail || t('seguimiento.error_cargar'));
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleGuardarPercepcion = async (ajusteId: number) => {
    if (!plan) return;
    const item = percepciones[ajusteId];
    if (!item?.valor) return;

    setGuardandoPercepcion(ajusteId);
    try {
      await api.put(`/planes/${plan.id}/seguimiento/${corteActivo}/ajustes/${ajusteId}/percepcion`, {
        percepcion: item.valor,
        comentario_estudiante: item.comentario || null,
      });
      setMensajeExito(ajusteId);
      setTimeout(() => setMensajeExito(null), 3000);
    } catch {
      // Manejo de error
    } finally {
      setGuardandoPercepcion(null);
    }
  };

  if (cargando) {
    return <LoadingState label={t('seguimiento.cargando')} />;
  }

  if (errorCarga || !plan) {
    return (
      <EmptyState
        title={t('seguimiento.titulo')}
        description={errorCarga || t('seguimiento.sin_plan')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('seguimiento.titulo')}
        description={t('seguimiento.descripcion')}
      />

      {/* Selector de cortes */}
      {seguimientoData && (
        <div className="flex gap-3 border-b-2 border-borde pb-4">
          {seguimientoData.cortes.map((c) => (
            <button
              key={c.corte}
              type="button"
              onClick={() => setCorteActivo(c.corte)}
              className={`rounded-control border-2 px-4 py-2 font-titulo text-base font-semibold transition-colors ${
                corteActivo === c.corte
                  ? 'border-cobalto bg-cobalto text-blanco'
                  : 'border-borde bg-blanco hover:bg-papel'
              }`}
            >
              <span>{t('seguimiento.corte_nombre', { corte: c.corte })}</span>
              {c.semaforo_estado && (
                <span className="ml-2 inline-block">
                  <Semaforo estado={c.semaforo_estado} size="sm" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Ajustes a evaluar en el corte */}
      <div className="space-y-4">
        {plan.ajustes.map((ajuste) => {
          const item = percepciones[ajuste.id] || { valor: 'POSITIVA', comentario: '' };
          return (
            <Card key={ajuste.id} className="p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-titulo text-lg font-bold text-tinta">
                    {ajuste.nombre_ajuste}
                  </h3>
                  <p className="text-sm text-tinta-suave">{ajuste.descripcion_ajuste}</p>
                </div>
                {ajuste.semaforo && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-tinta-suave">
                      {t('seguimiento.semaforo_institucional')}:
                    </span>
                    <Semaforo estado={ajuste.semaforo.valor} size="sm" />
                  </div>
                )}
              </div>

              {/* Registro de mi percepción */}
              <div className="rounded-control border-2 border-borde p-4 bg-papel space-y-3">
                <p className="font-titulo text-sm font-bold text-tinta">
                  {t('seguimiento.como_te_funciona')}
                </p>

                <div className="flex flex-wrap gap-3">
                  {(['POSITIVA', 'PARCIAL', 'NEGATIVA'] as const).map((valor) => (
                    <label
                      key={valor}
                      className={`flex items-center gap-2 rounded-control border-2 px-3 py-2 text-sm cursor-pointer ${
                        item.valor === valor
                          ? 'border-cobalto bg-cobalto-tinte font-bold text-cobalto'
                          : 'border-borde bg-blanco'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`percepcion-${ajuste.id}`}
                        value={valor}
                        checked={item.valor === valor}
                        onChange={() =>
                          setPercepciones((prev) => ({
                            ...prev,
                            [ajuste.id]: { ...item, valor },
                          }))
                        }
                        className="size-4 text-cobalto focus:ring-cobalto"
                      />
                      <span>{t(`seguimiento.percepcion_${valor.toLowerCase()}`)}</span>
                    </label>
                  ))}
                </div>

                <Textarea
                  label={t('seguimiento.comentario_opcional')}
                  value={item.comentario}
                  onChange={(e) =>
                    setPercepciones((prev) => ({
                      ...prev,
                      [ajuste.id]: { ...item, comentario: e.target.value },
                    }))
                  }
                  placeholder={t('seguimiento.comentario_placeholder')}
                  rows={2}
                />

                <div className="flex items-center justify-between pt-2">
                  {mensajeExito === ajuste.id ? (
                    <span className="text-sm font-bold text-verde">
                      {t('seguimiento.guardado_exito')}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant="primaria"
                    size="md"
                    loading={guardandoPercepcion === ajuste.id}
                    onClick={() => handleGuardarPercepcion(ajuste.id)}
                  >
                    {t('seguimiento.boton_guardar_percepcion')}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
