import { useEffect, useState } from 'react';
import { CheckCircle2, History, PlusCircle, Sparkles, BookOpen } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Semaforo,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useEnum, useFmt } from '@/lib/useT';
import type { EstadoSemaforo } from '@/lib/types';
import type {
  AjusteDocente,
  EstrategiaDocente,
  ImplementacionHistorial,
  MisAjustesResponse,
} from './types';

function esEstadoSemaforo(val: string | null): val is EstadoSemaforo {
  return val === 'VERDE' || val === 'AMARILLO' || val === 'ROJO';
}

export default function MisAjustes() {
  const t = useT();
  const e = useEnum();
  const f = useFmt();

  const [data, setData] = useState<MisAjustesResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal registrar ajuste
  const [ajusteSeleccionado, setAjusteSeleccionado] = useState<AjusteDocente | null>(null);
  const [implementado, setImplementado] = useState(true);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Modal historial ajuste
  const [historialAjuste, setHistorialAjuste] = useState<AjusteDocente | null>(null);
  const [historialItems, setHistorialItems] = useState<ImplementacionHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Modal registrar estrategia DUA
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState<EstrategiaDocente | null>(null);
  const [estadoEstrategia, setEstadoEstrategia] = useState<'INICIADA' | 'IMPLEMENTADA'>('IMPLEMENTADA');
  const [notaEstrategia, setNotaEstrategia] = useState('');
  const [guardandoEstrategia, setGuardandoEstrategia] = useState(false);

  const cargarDatos = () => {
    setCargando(true);
    api
      .get<MisAjustesResponse>('/docente/mis-ajustes')
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('docente.error_cargar_ajustes'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalAjuste = (ajuste: AjusteDocente) => {
    setAjusteSeleccionado(ajuste);
    setImplementado(true);
    setFecha(new Date().toISOString().split('T')[0]);
    setNota('');
    setErrorModal(null);
  };

  const abrirHistorial = (ajuste: AjusteDocente) => {
    setHistorialAjuste(ajuste);
    setCargandoHistorial(true);
    api
      .get<ImplementacionHistorial[]>(`/docente/ajustes/${ajuste.id}/implementacion`)
      .then((res) => {
        setHistorialItems(res);
        setCargandoHistorial(false);
      })
      .catch(() => {
        setHistorialItems([]);
        setCargandoHistorial(false);
      });
  };

  const handleGuardarImplementacion = async () => {
    if (!ajusteSeleccionado) return;
    setGuardando(true);
    setErrorModal(null);
    try {
      await api.post(`/docente/ajustes/${ajusteSeleccionado.id}/implementacion`, {
        implementado,
        fecha,
        nota: nota.trim() ? nota.trim() : null,
      });
      setAjusteSeleccionado(null);
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorModal(apiErr.detail || t('docente.error_guardar_implementacion'));
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEstrategia = async () => {
    if (!estrategiaSeleccionada) return;
    setGuardandoEstrategia(true);
    try {
      await api.post(`/docente/estrategias/${estrategiaSeleccionada.id}/implementacion`, {
        estado: estadoEstrategia,
        fecha: new Date().toISOString().split('T')[0],
        nota: notaEstrategia.trim() ? notaEstrategia.trim() : null,
      });
      setEstrategiaSeleccionada(null);
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('docente.error_guardar_estrategia'));
    } finally {
      setGuardandoEstrategia(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('docente.cargando_ajustes')} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title={t('docente.error_titulo')}
        description={error ?? t('docente.error_cargar_ajustes')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('docente.mis_ajustes_titulo')}
        description={t('docente.mis_ajustes_desc')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 bg-cobalto-claro/20 p-4">
          <BookOpen className="h-8 w-8 text-cobalto" />
          <div>
            <p className="text-sm font-semibold text-tinta-suave">{t('docente.total_ajustes')}</p>
            <p className="font-titulo text-2xl font-bold">{data.total_ajustes}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-mandarina-claro/20 p-4">
          <Sparkles className="h-8 w-8 text-mandarina" />
          <div>
            <p className="text-sm font-semibold text-tinta-suave">{t('docente.total_estrategias')}</p>
            <p className="font-titulo text-2xl font-bold">{data.total_estrategias}</p>
          </div>
        </Card>
      </div>

      {data.asignaturas.length === 0 ? (
        <EmptyState
          title={t('docente.sin_asignaturas_titulo')}
          description={t('docente.sin_asignaturas_desc')}
        />
      ) : (
        data.asignaturas.map((grupo, idx) => (
          <Card key={idx} className="space-y-4">
            <div className="border-b-2 border-borde pb-3">
              <CardTitle className="text-xl">
                {grupo.asignatura
                  ? `${grupo.asignatura.codigo} — ${grupo.asignatura.nombre}`
                  : t('docente.asignatura_general')}
              </CardTitle>
            </div>

            {grupo.estudiantes.length === 0 ? (
              <p className="text-tinta-suave">{t('docente.sin_estudiantes_en_asignatura')}</p>
            ) : (
              grupo.estudiantes.map((est) => (
                <div key={est.alias} className="space-y-4 rounded-control border border-borde p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalto text-sm font-bold text-blanco">
                      {est.iniciales ?? est.alias.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="font-bold">{est.alias}</h4>
                      <p className="text-xs text-tinta-suave">{t('docente.estudiante_identificador_anonimizado')}</p>
                    </div>
                  </div>

                  {/* Ajustes razonables */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-tinta-suave uppercase tracking-wider">
                      {t('docente.seccion_ajustes')} ({est.ajustes.length})
                    </h5>
                    {est.ajustes.length === 0 ? (
                      <p className="text-sm text-tinta-suave">{t('docente.sin_ajustes_estudiante')}</p>
                    ) : (
                      <ul className="space-y-3">
                        {est.ajustes.map((ajuste) => (
                          <li
                            key={ajuste.id}
                            className="rounded-control border border-borde bg-blanco p-3 space-y-2"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h6 className="font-semibold">{ajuste.nombre_ajuste}</h6>
                                <p className="text-sm text-tinta">{ajuste.descripcion}</p>
                              </div>
                              {esEstadoSemaforo(ajuste.semaforo_actual) ? (
                                <Semaforo estado={ajuste.semaforo_actual} size="sm" />
                              ) : (
                                <Badge>{t('comun.plan.sin_semaforo')}</Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-tinta-suave">
                              <span>{t('docente.tipo_ajuste')}: {e('detalle_ajuste', ajuste.tipo_ajuste)}</span>
                              {ajuste.frecuencia && <span>· {ajuste.frecuencia}</span>}
                              {ajuste.indicador_efectividad && (
                                <span>· {t('docente.indicador')}: {ajuste.indicador_efectividad}</span>
                              )}
                            </div>

                            {ajuste.ultima_implementacion && (
                              <div className="rounded bg-fondo-suave p-2 text-xs text-tinta-suave">
                                <span className="font-semibold">{t('docente.ultima_implementacion')}: </span>
                                {f.fecha(ajuste.ultima_implementacion.fecha)} —{' '}
                                {ajuste.ultima_implementacion.implementado
                                  ? t('docente.implementado_si')
                                  : t('docente.implementado_no')}
                                {ajuste.ultima_implementacion.nota && (
                                  <p className="italic mt-1">"{ajuste.ultima_implementacion.nota}"</p>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-borde">
                              <Button
                                variant="primaria"
                                onClick={() => abrirModalAjuste(ajuste)}
                              >
                                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                                {t('docente.boton_registrar_seguimiento')}
                              </Button>
                              <Button
                                variant="fantasma"
                                onClick={() => abrirHistorial(ajuste)}
                              >
                                <History className="mr-1 h-3.5 w-3.5" />
                                {t('docente.boton_ver_historial')}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Estrategias DUA */}
                  {est.estrategias_dua.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h5 className="font-semibold text-sm text-tinta-suave uppercase tracking-wider">
                        {t('docente.seccion_estrategias_dua')} ({est.estrategias_dua.length})
                      </h5>
                      <ul className="space-y-2">
                        {est.estrategias_dua.map((estDua) => (
                          <li
                            key={estDua.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-borde bg-blanco p-3"
                          >
                            <div className="space-y-1 max-w-xl">
                              <p className="font-semibold text-sm">{estDua.nombre_estrategia}</p>
                              <p className="text-xs text-tinta-suave">{estDua.descripcion}</p>
                              <div className="flex gap-2 text-xs">
                                <Badge color="cobalto">{estDua.dimension_dua}</Badge>
                                {estDua.implementada && (
                                  <Badge color="limon">{t('docente.estado_implementada')}</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={estDua.implementada ? 'secundaria' : 'primaria'}
                              onClick={() => {
                                setEstrategiaSeleccionada(estDua);
                                setEstadoEstrategia(estDua.implementada ? 'IMPLEMENTADA' : 'INICIADA');
                                setNotaEstrategia(estDua.nota_implementacion ?? '');
                              }}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              {estDua.implementada
                                ? t('docente.actualizar_estrategia')
                                : t('docente.marcar_estrategia')}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        ))
      )}

      {/* Modal Registrar Implementación Ajuste */}
      <Dialog
        open={!!ajusteSeleccionado}
        onOpenChange={(open) => !open && setAjusteSeleccionado(null)}
        title={t('docente.modal_implementacion_titulo')}
        description={ajusteSeleccionado?.nombre_ajuste}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setAjusteSeleccionado(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardando}
              onClick={handleGuardarImplementacion}
            >
              {t('comun.guardar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          {errorModal && (
            <div className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">
              {errorModal}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">
              {t('docente.pregunta_implementado')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="implementado"
                  checked={implementado}
                  onChange={() => setImplementado(true)}
                />
                <span>{t('comun.si')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="implementado"
                  checked={!implementado}
                  onChange={() => setImplementado(false)}
                />
                <span>{t('comun.no')}</span>
              </label>
            </div>
          </div>

          <Input
            type="date"
            label={t('docente.campo_fecha')}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <Textarea
            label={t('docente.campo_nota')}
            placeholder={t('docente.campo_nota_placeholder')}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={3}
          />
        </div>
      </Dialog>

      {/* Modal Historial Implementación */}
      <Dialog
        open={!!historialAjuste}
        onOpenChange={(open) => !open && setHistorialAjuste(null)}
        title={t('docente.historial_titulo')}
        description={historialAjuste?.nombre_ajuste}
        footer={
          <div className="flex justify-end w-full">
            <Button variant="fantasma" onClick={() => setHistorialAjuste(null)}>
              {t('comun.cerrar')}
            </Button>
          </div>
        }
      >
        <div className="p-4">
          {cargandoHistorial ? (
            <LoadingState label={t('docente.cargando_historial')} />
          ) : historialItems.length === 0 ? (
            <p className="text-center text-tinta-suave py-4">{t('docente.sin_historial')}</p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {historialItems.map((h) => (
                <li key={h.id} className="rounded border border-borde p-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>{f.fecha(h.fecha)}</span>
                    <Badge color={h.implementado ? 'limon' : 'mandarina'}>
                      {h.implementado ? t('docente.implementado_si') : t('docente.implementado_no')}
                    </Badge>
                  </div>
                  {h.nota && <p className="mt-1 text-tinta-suave">{h.nota}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>

      {/* Modal Estrategia DUA */}
      <Dialog
        open={!!estrategiaSeleccionada}
        onOpenChange={(open) => !open && setEstrategiaSeleccionada(null)}
        title={t('docente.modal_estrategia_titulo')}
        description={estrategiaSeleccionada?.nombre_estrategia}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setEstrategiaSeleccionada(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardandoEstrategia}
              onClick={handleGuardarEstrategia}
            >
              {t('comun.guardar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              {t('docente.campo_estado_estrategia')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estadoEst"
                  checked={estadoEstrategia === 'INICIADA'}
                  onChange={() => setEstadoEstrategia('INICIADA')}
                />
                <span>{t('docente.estrategia_iniciada')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="estadoEst"
                  checked={estadoEstrategia === 'IMPLEMENTADA'}
                  onChange={() => setEstadoEstrategia('IMPLEMENTADA')}
                />
                <span>{t('docente.estrategia_implementada')}</span>
              </label>
            </div>
          </div>

          <Textarea
            label={t('docente.campo_nota')}
            placeholder={t('docente.campo_nota_estrategia_placeholder')}
            value={notaEstrategia}
            onChange={(e) => setNotaEstrategia(e.target.value)}
            rows={3}
          />
        </div>
      </Dialog>
    </div>
  );
}
