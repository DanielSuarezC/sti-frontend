import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
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

interface ProtocoloBienvenida {
  titulo: string;
  pasos: string[];
  ayuda: string;
}

interface FormularioAQ10 {
  cuestionario_id: number;
  version: string;
  nombre: string;
  items: ItemAQ10[];
  opciones: OpcionAQ10[];
  instrucciones: string;
  mensaje_tamizaje: string;
  protocolo_bienvenida: ProtocoloBienvenida;
}

interface ResultadoAQ10 {
  id: number;
  puntaje: number;
  supera_umbral: boolean;
  mensaje: string;
  mensaje_tamizaje: string;
  ruta_maar_tea_activada: boolean;
}

export default function AQ10() {
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [form, setForm] = useState<FormularioAQ10 | null>(null);
  const [estudianteId, setEstudianteId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estado de respuestas: { [numero]: valor }
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAQ10 | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      api.get<FormularioAQ10>('/aq10/formulario'),
      api.get<{ estudiante_id?: number; id?: number }>('/estudiantes/mi-ruta').catch(() => null),
    ])
      .then(([formData, rutaData]) => {
        if (activo) {
          setForm(formData);
          // Si rutaData tiene estudiante_id o id
          const id = (rutaData as any)?.estudiante_id || (rutaData as any)?.id || 1;
          setEstudianteId(id);
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
    if (!form) return;

    // Verificar que los 10 estén respondidos
    const respondidos = Object.keys(respuestas).length;
    if (respondidos < form.items.length) {
      setErrorEnvio(t('aq10.error_incompleto', { respondidos, total: form.items.length }));
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);

    try {
      // Endpoint: POST /estudiantes/{id}/aq10
      const res = await api.post<ResultadoAQ10>(`/estudiantes/${estudianteId}/aq10`, {
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
          title={t('aq10.resultado_titulo')}
          description={t('aq10.resultado_descripcion')}
        />

        <Card className="p-6 space-y-4">
          <div className="rounded-control border-2 border-verde bg-verde-tinte p-4">
            <h3 className="font-titulo text-lg font-bold text-verde">
              {t('aq10.gracias')}
            </h3>
            <p className="mt-2 text-base">{resultado.mensaje}</p>
          </div>

          <div className="rounded-control border-2 border-borde bg-papel p-4 text-sm text-tinta-suave">
            <p className="font-bold">{t('aq10.recordatorio_importante')}</p>
            <p className="mt-1">{resultado.mensaje_tamizaje}</p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primaria" onClick={() => navigate('/estudiante/mi-ruta')}>
              {t('aq10.ver_mi_ruta')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title={form.nombre}
        description={form.instrucciones}
      />

      {/* Protocolo de bienvenida */}
      {form.protocolo_bienvenida && (
        <Card className="border-2 border-cobalto bg-cobalto-tinte p-5 space-y-3">
          <h3 className="font-titulo text-lg font-bold text-cobalto">
            {form.protocolo_bienvenida.titulo}
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-tinta">
            {form.protocolo_bienvenida.pasos.map((paso, idx) => (
              <li key={idx}>{paso}</li>
            ))}
          </ul>
          {form.protocolo_bienvenida.ayuda && (
            <p className="text-xs text-tinta-suave italic">{form.protocolo_bienvenida.ayuda}</p>
          )}
        </Card>
      )}

      {/* Mensaje de tamizaje */}
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
            {t('aq10.boton_enviar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
