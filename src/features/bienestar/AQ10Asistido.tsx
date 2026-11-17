import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface ItemAQ10 {
  numero: number;
  texto: string;
}

interface OpcionAQ10 {
  valor: number;
  etiqueta: string;
}

interface FormularioAQ10 {
  cuestionario_id: number;
  nombre: string;
  items: ItemAQ10[];
  opciones: OpcionAQ10[];
  instrucciones: string;
  mensaje_tamizaje: string;
}

interface ResultadoAQ10 {
  id: number;
  puntaje: number;
  supera_umbral: boolean;
  mensaje: string;
  mensaje_tamizaje: string;
}

export default function AQ10Asistido() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [form, setForm] = useState<FormularioAQ10 | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAQ10 | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .get<FormularioAQ10>('/aq10/formulario')
      .then((data) => {
        if (activo) {
          setForm(data);
          setCargando(false);
        }
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setErrorCarga(apiErr.detail || t('aq10.error_cargar'));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleSeleccion = (numero: number, valor: number) => {
    setRespuestas((prev) => ({
      ...prev,
      [numero.toString()]: valor,
    }));
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;

    if (Object.keys(respuestas).length < form.items.length) {
      setErrorEnvio(t('aq10.error_incompleto', { respondidos: Object.keys(respuestas).length, total: form.items.length }));
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
      const res = await api.post<ResultadoAQ10>(`/estudiantes/${id}/aq10`, {
        respuestas,
      });
      setResultado(res);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorEnvio(apiErr.detail || t('aq10.error_enviar'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('aq10.cargando')} />;
  }

  if (errorCarga || !form) {
    return (
      <EmptyState
        title={t('aq10.error_titulo')}
        description={errorCarga || t('aq10.error_cargar')}
      />
    );
  }

  if (resultado) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader
          title={t('bienestar.aq10_asistido_completado_titulo')}
          description={t('bienestar.aq10_asistido_completado_desc')}
        />

        <Card className="p-6 space-y-4">
          <div className="rounded-control border-2 border-verde bg-verde-tinte p-4">
            <p className="font-bold text-verde">
              {resultado.supera_umbral
                ? t('bienestar.aq10_supera_umbral', { puntaje: resultado.puntaje })
                : t('bienestar.aq10_no_supera_umbral', { puntaje: resultado.puntaje })}
            </p>
            <p className="mt-2 text-sm">{resultado.mensaje}</p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="secundaria"
              onClick={() => navigate(`/bienestar/estudiantes/${id}`)}
            >
              {t('bienestar.volver_al_expediente')}
            </Button>
            <Button
              variant="primaria"
              onClick={() => navigate(`/bienestar/estudiantes/${id}/caracterizacion`)}
            >
              {t('bienestar.continuar_caracterizacion')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.aq10_asistido_titulo')}
          description={t('bienestar.aq10_asistido_desc')}
        />
        <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
          {t('bienestar.volver_al_expediente')}
        </Button>
      </div>

      <div
        role="note"
        className="rounded-control border-2 border-limon bg-limon-tinte p-4 text-sm font-medium"
      >
        <p className="font-bold">{t('aq10.mensaje_tamizaje_titulo')}</p>
        <p className="mt-1">{form.mensaje_tamizaje}</p>
      </div>

      <form onSubmit={handleEnviar} className="space-y-6">
        {errorEnvio && (
          <div
            role="alert"
            className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
          >
            {errorEnvio}
          </div>
        )}

        <div className="space-y-4">
          {form.items.map((item) => {
            const valorActual = respuestas[item.numero.toString()];
            return (
              <Card key={item.numero} className="p-5">
                <fieldset className="space-y-3">
                  <legend className="font-titulo text-base font-semibold text-tinta">
                    <span className="mr-2 font-bold text-cobalto">{item.numero}.</span>
                    {item.texto}
                  </legend>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {form.opciones.map((op) => {
                      const seleccionada = valorActual === op.valor;
                      return (
                        <label
                          key={op.valor}
                          className={`flex items-center gap-3 rounded-control border-2 p-3 text-sm cursor-pointer transition-colors ${
                            seleccionada
                              ? 'border-cobalto bg-cobalto-tinte font-bold text-cobalto'
                              : 'border-borde bg-blanco hover:bg-papel'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pregunta-${item.numero}`}
                            value={op.valor}
                            checked={seleccionada}
                            onChange={() => handleSeleccion(item.numero, op.valor)}
                            className="size-4 text-cobalto focus:ring-cobalto"
                          />
                          <span>{op.etiqueta}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            variant="primaria"
            loading={enviando}
            disabled={Object.keys(respuestas).length < form.items.length}
          >
            {t('bienestar.boton_registrar_aq10_asistido')}
          </Button>
        </div>
      </form>
    </div>
  );
}
