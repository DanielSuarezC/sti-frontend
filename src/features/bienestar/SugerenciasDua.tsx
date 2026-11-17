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

interface SugerenciaItem {
  id: number;
  estudiante_id: number;
  barrera_id: number;
  tipo_barrera: string;
  escenario?: string;
  principio_dua: string;
  origen: string;
  puntaje: number;
  justificacion: string;
  estado: 'PROPUESTA' | 'ACEPTADA' | 'MODIFICADA' | 'RECHAZADA';
  texto_modificado?: string | null;
  estrategia: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion_pedagogica: string;
    principio: string;
    pauta: number;
    pauta_nombre: string;
    punto_verificacion: string;
  };
}

export default function SugerenciasDua() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [sugerencias, setSugerencias] = useState<SugerenciaItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [generando, setGenerando] = useState(false);
  const [mensajeGenerar, setMensajeGenerar] = useState<string | null>(null);

  // Modales de decisión
  const [sugerenciaActiva, setSugerenciaActiva] = useState<SugerenciaItem | null>(null);
  const [accionDecision, setAccionDecision] = useState<'MODIFICAR' | 'RECHAZAR' | null>(null);
  const [textoModificado, setTextoModificado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [guardandoDecision, setGuardandoDecision] = useState(false);
  const [errorDecision, setErrorDecision] = useState<string | null>(null);

  const cargarSugerencias = () => {
    setCargando(true);
    api
      .get<{ items: SugerenciaItem[] }>(`/estudiantes/${id}/sugerencias`)
      .then((data) => {
        setSugerencias(data.items || []);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('bienestar.error_cargar_sugerencias'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarSugerencias();
  }, [id]);

  const handleGenerar = async () => {
    setGenerando(true);
    setMensajeGenerar(null);
    try {
      const res = await api.post<{ detail: string }>(`/estudiantes/${id}/sugerencias/generar`, {
        max_por_barrera: 3,
      });
      setMensajeGenerar(res.detail || t('bienestar.sugerencias_generadas_exito'));
      cargarSugerencias();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setMensajeGenerar(apiErr.detail || t('bienestar.error_generar_sugerencias'));
    } finally {
      setGenerando(false);
    }
  };

  const handleAceptar = async (sugId: number) => {
    try {
      await api.post(`/sugerencias/${sugId}/aceptar`);
      cargarSugerencias();
    } catch {
      // Manejo de error
    }
  };

  const handleEnviarDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugerenciaActiva || !accionDecision) return;

    setGuardandoDecision(true);
    setErrorDecision(null);

    try {
      if (accionDecision === 'MODIFICAR') {
        if (textoModificado.trim().length < 5) {
          setErrorDecision(t('bienestar.error_texto_corto'));
          setGuardandoDecision(false);
          return;
        }
        await api.post(`/sugerencias/${sugerenciaActiva.id}/modificar`, {
          texto_modificado: textoModificado.trim(),
        });
      } else {
        if (motivoRechazo.trim().length < 5) {
          setErrorDecision(t('bienestar.error_motivo_corto'));
          setGuardandoDecision(false);
          return;
        }
        await api.post(`/sugerencias/${sugerenciaActiva.id}/rechazar`, {
          motivo: motivoRechazo.trim(),
        });
      }

      setSugerenciaActiva(null);
      setAccionDecision(null);
      setTextoModificado('');
      setMotivoRechazo('');
      cargarSugerencias();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorDecision(apiErr.detail || t('bienestar.error_decision_sugerencia'));
    } finally {
      setGuardandoDecision(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_sugerencias')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.sugerencias_dua_titulo')}
          description={t('bienestar.sugerencias_dua_desc')}
        />
        <div className="flex gap-3">
          <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
            {t('bienestar.volver_al_expediente')}
          </Button>
          <Button variant="primaria" onClick={handleGenerar} loading={generando}>
            {t('bienestar.boton_generar_sugerencias')}
          </Button>
        </div>
      </div>

      {mensajeGenerar && (
        <div className="rounded-control border-2 border-cobalto bg-cobalto-tinte p-3 text-sm text-cobalto font-bold">
          {mensajeGenerar}
        </div>
      )}

      {errorCarga ? (
        <EmptyState title={t('bienestar.error_titulo')} description={errorCarga} />
      ) : sugerencias.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <h3 className="font-titulo text-lg font-bold">{t('bienestar.sin_sugerencias_titulo')}</h3>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            {t('bienestar.sin_sugerencias_desc')}
          </p>
          <div className="pt-2">
            <Button variant="primaria" onClick={handleGenerar} loading={generando}>
              {t('bienestar.boton_generar_sugerencias')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sugerencias.map((sug) => (
            <Card key={sug.id} className="p-6 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-cobalto-tinte px-2 py-0.5 text-xs font-bold text-cobalto">
                      {sug.estrategia.codigo}
                    </span>
                    <span className="rounded bg-papel px-2 py-0.5 text-xs font-semibold text-tinta-suave border border-borde">
                      {sug.principio_dua} · Pauta {sug.estrategia.pauta}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        sug.estado === 'ACEPTADA'
                          ? 'bg-verde-tinte text-verde'
                          : sug.estado === 'RECHAZADA'
                            ? 'bg-rojo-tinte text-rojo'
                            : sug.estado === 'MODIFICADA'
                              ? 'bg-mandarina-tinte text-mandarina-oscuro'
                              : 'bg-limon-tinte text-tinta'
                      }`}
                    >
                      {sug.estado}
                    </span>
                  </div>
                  <h3 className="font-titulo text-lg font-bold text-tinta mt-1">
                    {sug.estrategia.nombre}
                  </h3>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-tinta-suave shrink-0">
                  <span>Relevancia:</span>
                  <span className="rounded bg-papel px-2 py-1 border border-borde text-cobalto">
                    {(sug.puntaje * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-tinta">{sug.estrategia.descripcion_pedagogica}</p>

              {sug.texto_modificado && (
                <div className="rounded bg-mandarina-tinte p-3 border border-mandarina text-sm">
                  <p className="font-bold text-xs uppercase text-mandarina-oscuro">
                    {t('bienestar.adaptacion_bienestar')}:
                  </p>
                  <p className="mt-1">{sug.texto_modificado}</p>
                </div>
              )}

              <div className="rounded-control bg-papel p-3 text-xs text-tinta-suave border border-borde">
                <span className="font-bold">{t('bienestar.justificacion_sugerencia')}: </span>
                {sug.justificacion}
              </div>

              {sug.estado === 'PROPUESTA' && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secundaria" size="md" onClick={() => handleAceptar(sug.id)}>
                    {t('bienestar.boton_aceptar_sugerencia')}
                  </Button>
                  <Button
                    variant="secundaria"
                    size="md"
                    onClick={() => {
                      setSugerenciaActiva(sug);
                      setAccionDecision('MODIFICAR');
                      setTextoModificado(sug.estrategia.descripcion_pedagogica);
                    }}
                  >
                    {t('bienestar.boton_modificar_sugerencia')}
                  </Button>
                  <Button
                    variant="peligro"
                    size="md"
                    onClick={() => {
                      setSugerenciaActiva(sug);
                      setAccionDecision('RECHAZAR');
                      setMotivoRechazo('');
                    }}
                  >
                    {t('bienestar.boton_rechazar_sugerencia')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Modificar / Rechazar */}
      {sugerenciaActiva && accionDecision && (
        <Dialog
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) {
              setSugerenciaActiva(null);
              setAccionDecision(null);
            }
          }}
          title={
            accionDecision === 'MODIFICAR'
              ? t('bienestar.modal_modificar_sug_titulo')
              : t('bienestar.modal_rechazar_sug_titulo')
          }
          description={
            accionDecision === 'MODIFICAR'
              ? t('bienestar.modal_modificar_sug_desc')
              : t('bienestar.modal_rechazar_sug_desc')
          }
        >
          <form onSubmit={handleEnviarDecision} className="space-y-4 pt-2">
            {errorDecision && (
              <div
                role="alert"
                className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
              >
                {errorDecision}
              </div>
            )}

            {accionDecision === 'MODIFICAR' ? (
              <Textarea
                label={t('bienestar.campo_texto_adaptado')}
                required
                value={textoModificado}
                onChange={(e) => setTextoModificado(e.target.value)}
                rows={4}
              />
            ) : (
              <Textarea
                label={t('bienestar.campo_motivo_rechazo')}
                required
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Explica pedagógicamente por qué esta estrategia no aplica..."
                rows={3}
              />
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secundaria"
                onClick={() => {
                  setSugerenciaActiva(null);
                  setAccionDecision(null);
                }}
              >
                {t('recuperar.volver')}
              </Button>
              <Button
                type="submit"
                variant={accionDecision === 'RECHAZAR' ? 'peligro' : 'primaria'}
                loading={guardandoDecision}
              >
                {t('bienestar.boton_confirmar_decision')}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
