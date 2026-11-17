import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
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

interface NegociacionItem {
  id: number;
  plan_id: number;
  estudiante_id: number;
  ajuste: {
    id: number;
    nombre_ajuste: string;
    tipo_ajuste: string;
  };
  tipo: string;
  estado: 'ABIERTA' | 'EN_CICLO' | 'ACORDADA' | 'ESCALADA_COMITE' | 'CERRADA';
  ciclo: number;
  max_ciclos: number;
  objecion_estudiante?: string;
  propuesta_bienestar?: string;
  siguiente_accion?: string;
}

export default function NegociacionBandeja() {
  const intl = useIntl();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [negociaciones, setNegociaciones] = useState<NegociacionItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Modal Contrapropuesta
  const [negociacionActiva, setNegociacionActiva] = useState<NegociacionItem | null>(null);
  const [contrapropuestaTexto, setContrapropuestaTexto] = useState('');
  const [enviandoContrapropuesta, setEnviandoContrapropuesta] = useState(false);
  const [errorContrapropuesta, setErrorContrapropuesta] = useState<string | null>(null);

  const cargarNegociaciones = () => {
    setCargando(true);
    api
      .get<{ items: NegociacionItem[] }>('/negociacion')
      .then((data) => {
        setNegociaciones(data.items || []);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('bienestar.error_cargar_negociaciones'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarNegociaciones();
  }, []);

  const handleEnviarContrapropuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negociacionActiva) return;

    if (contrapropuestaTexto.trim().length < 5) {
      setErrorContrapropuesta(t('bienestar.error_propuesta_corta'));
      return;
    }

    setEnviandoContrapropuesta(true);
    setErrorContrapropuesta(null);

    try {
      await api.post(`/negociacion/${negociacionActiva.id}/contrapropuesta`, {
        propuesta: contrapropuestaTexto.trim(),
      });
      setNegociacionActiva(null);
      setContrapropuestaTexto('');
      cargarNegociaciones();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorContrapropuesta(apiErr.detail || t('bienestar.error_enviar_contrapropuesta'));
    } finally {
      setEnviandoContrapropuesta(false);
    }
  };

  const handleCerrarAcordado = async (negId: number) => {
    try {
      await api.post(`/negociacion/${negId}/cerrar`, {
        resultado: 'ACORDADO',
        resolucion: 'Acordado en diálogo pedagógico con el estudiante.',
      });
      cargarNegociaciones();
    } catch {
      // Manejo de error
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_negociaciones')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('bienestar.negociaciones_titulo')}
        description={t('bienestar.negociaciones_descripcion')}
      />

      {errorCarga ? (
        <EmptyState title={t('bienestar.error_titulo')} description={errorCarga} />
      ) : negociaciones.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <h3 className="font-titulo text-lg font-bold">{t('bienestar.sin_negociaciones_titulo')}</h3>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            {t('bienestar.sin_negociaciones_desc')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {negociaciones.map((neg) => (
            <Card key={neg.id} className="p-6 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded bg-mandarina-tinte px-2 py-0.5 text-xs font-bold text-mandarina-oscuro">
                    {neg.estado} · Ciclo {neg.ciclo} de {neg.max_ciclos}
                  </span>
                  <h3 className="font-titulo text-lg font-bold text-tinta mt-1">
                    {neg.ajuste.nombre_ajuste}
                  </h3>
                </div>

                <div className="flex gap-2">
                  {neg.estado === 'ABIERTA' && (
                    <Button
                      variant="primaria"
                      size="md"
                      onClick={() => {
                        setNegociacionActiva(neg);
                        setContrapropuestaTexto('');
                      }}
                    >
                      {t('bienestar.boton_contraproponer')}
                    </Button>
                  )}
                  {neg.estado !== 'CERRADA' && (
                    <Button
                      variant="secundaria"
                      size="md"
                      onClick={() => handleCerrarAcordado(neg.id)}
                    >
                      {t('bienestar.boton_cerrar_acordado')}
                    </Button>
                  )}
                </div>
              </div>

              {neg.objecion_estudiante && (
                <div className="rounded bg-papel p-3 border border-borde text-sm">
                  <span className="font-bold text-xs uppercase text-rojo">
                    {t('bienestar.objecion_estudiante')}:
                  </span>
                  <p className="mt-1">{neg.objecion_estudiante}</p>
                </div>
              )}

              {neg.propuesta_bienestar && (
                <div className="rounded bg-cobalto-tinte p-3 border border-cobalto text-sm">
                  <span className="font-bold text-xs uppercase text-cobalto">
                    {t('bienestar.propuesta_bienestar')}:
                  </span>
                  <p className="mt-1">{neg.propuesta_bienestar}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Contrapropuesta */}
      {negociacionActiva && (
        <Dialog
          open={true}
          onOpenChange={(abierto) => {
            if (!abierto) setNegociacionActiva(null);
          }}
          title={t('bienestar.modal_contrapropuesta_titulo')}
          description={t('bienestar.modal_contrapropuesta_desc', {
            ajuste: negociacionActiva.ajuste.nombre_ajuste,
          })}
        >
          <form onSubmit={handleEnviarContrapropuesta} className="space-y-4 pt-2">
            {errorContrapropuesta && (
              <div
                role="alert"
                className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
              >
                {errorContrapropuesta}
              </div>
            )}

            <Textarea
              label={t('bienestar.campo_contrapropuesta_label')}
              required
              value={contrapropuestaTexto}
              onChange={(e) => setContrapropuestaTexto(e.target.value)}
              placeholder="Escribe la alternativa pedagógica o ajuste adaptado..."
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secundaria" onClick={() => setNegociacionActiva(null)}>
                {t('recuperar.volver')}
              </Button>
              <Button type="submit" variant="primaria" loading={enviandoContrapropuesta}>
                {t('bienestar.boton_enviar_propuesta')}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
