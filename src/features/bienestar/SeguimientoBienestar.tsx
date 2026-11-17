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
  Semaforo,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import type { Plan } from '@/features/_shared/types';

interface CorteInfo {
  corte: 'C1' | 'C2' | 'C3';
  fecha_corte: string;
  estado: 'FUTURO' | 'ABIERTO' | 'CERRADO';
  cerrado: boolean;
  semaforo_estado?: 'VERDE' | 'AMARILLO' | 'ROJO' | null;
  puede_abrir?: boolean;
}

interface SeguimientoResponse {
  plan_id: number;
  plan_estado: string;
  semestre: string;
  cortes: CorteInfo[];
}

export default function SeguimientoBienestar() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [seguimiento, setSeguimiento] = useState<SeguimientoResponse | null>(null);
  const [corteActivo, setCorteActivo] = useState<'C1' | 'C2' | 'C3'>('C1');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Valoración de semáforo
  const [valoraciones, setValoraciones] = useState<
    Record<number, { semaforo: 'VERDE' | 'AMARILLO' | 'ROJO'; resultado: string }>
  >({});
  const [guardandoAjuste, setGuardandoAjuste] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal rediseño (ROJO)
  const [ajusteRediseno, setAjusteRediseno] = useState<number | null>(null);
  const [nuevoDisenoTexto, setNuevoDisenoTexto] = useState('');
  const [guardandoRediseno, setGuardandoRediseno] = useState(false);

  const cargarDatos = async () => {
    if (!id) return;
    setCargando(true);
    try {
      const data = await api.get<{ items: Plan[] }>(`/estudiantes/${id}/planes`);
      if (data.items && data.items.length > 0) {
        const planId = data.items[0]!.id;
        const [planData, segData] = await Promise.all([
          api.get<Plan>(`/planes/${planId}`),
          api.get<SeguimientoResponse>(`/planes/${planId}/seguimiento`),
        ]);
        setPlan(planData);
        setSeguimiento(segData);
        if (segData?.cortes) {
          const abierto = segData.cortes.find((c: CorteInfo) => c.estado === 'ABIERTO');
          if (abierto) setCorteActivo(abierto.corte);
        }
      }
      setCargando(false);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorCarga(apiErr.detail || t('bienestar.error_cargar_seguimiento'));
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const handleAbrirCorte = async (corte: 'C1' | 'C2' | 'C3') => {
    if (!plan) return;
    try {
      await api.post(`/planes/${plan.id}/seguimiento/${corte}`);
      cargarDatos();
    } catch {
      // Manejo de error
    }
  };

  const handleCerrarCorte = async (corte: 'C1' | 'C2' | 'C3') => {
    if (!plan) return;
    try {
      await api.post(`/planes/${plan.id}/seguimiento/${corte}/cerrar`);
      cargarDatos();
    } catch (err: any) {
      alert(err.detail || 'No se puede cerrar el corte aún.');
    }
  };

  const handleGuardarValoracion = async (ajusteId: number) => {
    if (!plan) return;
    const v = valoraciones[ajusteId] || { semaforo: 'VERDE', resultado: 'Efectivo sin novedades' };
    setGuardandoAjuste(ajusteId);

    try {
      await api.put(`/planes/${plan.id}/seguimiento/${corteActivo}/ajustes/${ajusteId}`, {
        semaforo: v.semaforo,
        resultado_observado: v.resultado.trim() || 'Evaluado en seguimiento por Bienestar',
      });
      setMensajeExito(`Ajuste ${ajusteId} calificado en ${v.semaforo}`);
      setTimeout(() => setMensajeExito(null), 3000);
      cargarDatos();
    } catch (err: any) {
      alert(err.detail || 'Error al guardar semáforo');
    } finally {
      setGuardandoAjuste(null);
    }
  };

  const handleRegistrarRediseno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !ajusteRediseno || nuevoDisenoTexto.trim().length < 5) return;

    setGuardandoRediseno(true);
    try {
      await api.post(`/planes/${plan.id}/seguimiento/${corteActivo}/ajustes/${ajusteRediseno}/rediseno`, {
        nuevo_diseno: nuevoDisenoTexto.trim(),
      });
      setAjusteRediseno(null);
      setNuevoDisenoTexto('');
      cargarDatos();
    } catch {
      // Manejo de error
    } finally {
      setGuardandoRediseno(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_seguimiento')} />;
  }

  if (errorCarga || !plan || !seguimiento) {
    return (
      <EmptyState
        title={t('bienestar.seguimiento_titulo')}
        description={errorCarga || t('bienestar.sin_seguimiento_desc')}
      />
    );
  }

  const corteInfoActual = seguimiento.cortes.find((c) => c.corte === corteActivo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.seguimiento_titulo')}
          description={t('bienestar.seguimiento_descripcion')}
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

      {/* Selector de cortes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-borde pb-4">
        <div className="flex gap-2">
          {seguimiento.cortes.map((c) => (
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
              <span>{c.corte}</span>
              <span className="ml-2 text-xs font-normal opacity-90">({c.estado})</span>
            </button>
          ))}
        </div>

        <div>
          {corteInfoActual?.estado === 'FUTURO' && (
            <Button variant="primaria" onClick={() => handleAbrirCorte(corteActivo)}>
              {t('bienestar.boton_abrir_corte', { corte: corteActivo })}
            </Button>
          )}
          {corteInfoActual?.estado === 'ABIERTO' && (
            <Button variant="secundaria" onClick={() => handleCerrarCorte(corteActivo)}>
              {t('bienestar.boton_cerrar_corte', { corte: corteActivo })}
            </Button>
          )}
        </div>
      </div>

      {/* Lista de ajustes a evaluar */}
      <div className="space-y-4">
        {plan.ajustes.map((ajuste) => {
          const val = valoraciones[ajuste.id] || {
            semaforo: (ajuste.semaforo?.valor as any) || 'VERDE',
            resultado: '',
          };
          return (
            <Card key={ajuste.id} className="p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-titulo text-lg font-bold text-tinta">{ajuste.nombre_ajuste}</h3>
                  <p className="text-sm text-tinta-suave">{ajuste.descripcion_ajuste}</p>
                </div>
                {ajuste.semaforo && <Semaforo estado={ajuste.semaforo.valor} size="sm" />}
              </div>

              {corteInfoActual?.estado === 'ABIERTO' && (
                <div className="rounded-control border-2 border-borde p-4 bg-papel space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      label={t('bienestar.campo_semaforo')}
                      value={val.semaforo}
                      onChange={(e) =>
                        setValoraciones((prev) => ({
                          ...prev,
                          [ajuste.id]: { ...val, semaforo: e.target.value as any },
                        }))
                      }
                    >
                      <option value="VERDE">VERDE (Efectivo - mantener)</option>
                      <option value="AMARILLO">AMARILLO (Parcial - concertar)</option>
                      <option value="ROJO">ROJO (Inefectivo - rediseño obligatorio)</option>
                    </Select>

                    <Input
                      label={t('bienestar.campo_resultado_observado')}
                      value={val.resultado}
                      onChange={(e) =>
                        setValoraciones((prev) => ({
                          ...prev,
                          [ajuste.id]: { ...val, resultado: e.target.value },
                        }))
                      }
                      placeholder="Observaciones de avance o dificultad..."
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {val.semaforo === 'ROJO' ? (
                      <Button
                        variant="peligro"
                        size="md"
                        onClick={() => {
                          setAjusteRediseno(ajuste.id);
                          setNuevoDisenoTexto('');
                        }}
                      >
                        {t('bienestar.boton_registrar_rediseno')}
                      </Button>
                    ) : (
                      <span />
                    )}

                    <Button
                      variant="primaria"
                      size="md"
                      loading={guardandoAjuste === ajuste.id}
                      onClick={() => handleGuardarValoracion(ajuste.id)}
                    >
                      {t('bienestar.boton_guardar_semaforo')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal Rediseño */}
      {ajusteRediseno !== null && (
        <Dialog
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) setAjusteRediseno(null);
          }}
          title={t('bienestar.modal_rediseno_titulo')}
          description={t('bienestar.modal_rediseno_desc')}
        >
          <form onSubmit={handleRegistrarRediseno} className="space-y-4 pt-2">
            <Textarea
              label={t('bienestar.campo_nuevo_diseno')}
              required
              value={nuevoDisenoTexto}
              onChange={(e) => setNuevoDisenoTexto(e.target.value)}
              placeholder="Describe el nuevo ajuste o modificación acordada..."
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secundaria" onClick={() => setAjusteRediseno(null)}>
                {t('recuperar.volver')}
              </Button>
              <Button type="submit" variant="peligro" loading={guardandoRediseno}>
                {t('bienestar.boton_guardar_rediseno')}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
