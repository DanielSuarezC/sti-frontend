import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface CaracterizacionF1 {
  existe: boolean;
  version: number;
  estado: string;
  autodescripcion_estudiante?: string;
  resumen_ejecutivo?: string;
  comunicacion?: Array<{ tipo_comunicacion: string; descripcion: string }>;
  sensorial?: Array<{ tipo_sensorial: string; descripcion_experiencia: string }>;
  autonomia?: Array<{ contexto_autonomia: string; nivel_autonomia: string }>;
  preferencias?: Array<{ tipo_preferencia: string; descripcion: string }>;
}

interface FortalezasF2 {
  existe: boolean;
  fortalezas?: Array<{ nombre_fortaleza: string; descripcion_detallada?: string }>;
  intereses?: Array<{ nombre_interes: string; descripcion?: string }>;
  metas?: Array<{ descripcion: string; prioridad?: string }>;
}

export default function MiPerfil() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [estudianteId, setEstudianteId] = useState<number | null>(null);
  const [f1, setF1] = useState<CaracterizacionF1 | null>(null);
  const [f2, setF2] = useState<FortalezasF2 | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Voz del estudiante (autodescripción)
  const [autodescripcion, setAutodescripcion] = useState('');
  const [guardandoVoz, setGuardandoVoz] = useState(false);
  const [mensajeExitoVoz, setMensajeExitoVoz] = useState(false);

  useEffect(() => {
    let activo = true;

    // Primero obtenemos el estudiante_id de mi-ruta
    api
      .get<{ estudiante_id?: number; id?: number }>('/estudiantes/mi-ruta')
      .then((ruta) => {
        const eid = (ruta as any)?.estudiante_id || (ruta as any)?.id || 1;
        if (!activo) return;
        setEstudianteId(eid);

        return Promise.all([
          api.get<CaracterizacionF1>(`/estudiantes/${eid}/caracterizacion`).catch(() => null),
          api.get<FortalezasF2>(`/estudiantes/${eid}/fortalezas`).catch(() => null),
        ]);
      })
      .then((results) => {
        if (!activo || !results) return;
        const [f1Data, f2Data] = results;
        if (f1Data) {
          setF1(f1Data);
          setAutodescripcion(f1Data.autodescripcion_estudiante || '');
        }
        if (f2Data) {
          setF2(f2Data);
        }
        setCargando(false);
      })
      .catch((err: any) => {
        if (activo) {
          const apiErr = err as ApiError;
          setErrorCarga(apiErr.detail || t('perfil.error_cargar'));
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleGuardarAutodescripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteId) return;

    setGuardandoVoz(true);
    setMensajeExitoVoz(false);

    try {
      await api.patch(`/estudiantes/${estudianteId}/caracterizacion/autodescripcion`, {
        autodescripcion_estudiante: autodescripcion.trim(),
      });
      setMensajeExitoVoz(true);
      setTimeout(() => setMensajeExitoVoz(false), 4000);
    } catch {
      // Manejo de error
    } finally {
      setGuardandoVoz(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('perfil.cargando')} />;
  }

  if (errorCarga) {
    return (
      <EmptyState
        title={t('perfil.error_titulo')}
        description={errorCarga}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('perfil.titulo')}
        description={t('perfil.descripcion')}
      />

      {/* Mi voz: autodescripción editable */}
      <Card className="p-6">
        <form onSubmit={handleGuardarAutodescripcion} className="space-y-4">
          <h3 className="font-titulo text-xl font-bold">{t('perfil.mi_voz_titulo')}</h3>
          <p className="text-sm text-tinta-suave">{t('perfil.mi_voz_descripcion')}</p>

          <Textarea
            label={t('perfil.mi_voz_etiqueta')}
            value={autodescripcion}
            onChange={(e) => setAutodescripcion(e.target.value)}
            placeholder={t('perfil.mi_voz_placeholder')}
            rows={4}
          />

          <div className="flex items-center justify-between pt-2">
            {mensajeExitoVoz ? (
              <span className="text-sm font-bold text-verde">
                {t('perfil.guardado_exito')}
              </span>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primaria" loading={guardandoVoz}>
              {t('perfil.boton_guardar_voz')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Fortalezas (F2) */}
      <Card className="p-6 space-y-4">
        <h3 className="font-titulo text-xl font-bold">{t('perfil.fortalezas_titulo')}</h3>
        {f2?.fortalezas && f2.fortalezas.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {f2.fortalezas.map((f, idx) => (
              <li
                key={idx}
                className="rounded-control border-2 border-borde bg-verde-tinte p-4"
              >
                <p className="font-bold text-verde-oscuro">{f.nombre_fortaleza}</p>
                {f.descripcion_detallada && (
                  <p className="mt-1 text-sm text-tinta">{f.descripcion_detallada}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-tinta-suave">{t('perfil.sin_fortalezas')}</p>
        )}
      </Card>

      {/* Perfil Sensorial y Comunicación (F1) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-lg font-bold">{t('perfil.sensorial_titulo')}</h3>
          {f1?.sensorial && f1.sensorial.length > 0 ? (
            <ul className="space-y-3">
              {f1.sensorial.map((s, idx) => (
                <li key={idx} className="rounded-control border-2 border-borde p-3 bg-papel">
                  <p className="text-xs font-bold uppercase text-cobalto">{s.tipo_sensorial}</p>
                  <p className="mt-1 text-sm text-tinta">{s.descripcion_experiencia}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tinta-suave">{t('perfil.sin_sensorial')}</p>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-titulo text-lg font-bold">{t('perfil.comunicacion_titulo')}</h3>
          {f1?.comunicacion && f1.comunicacion.length > 0 ? (
            <ul className="space-y-3">
              {f1.comunicacion.map((c, idx) => (
                <li key={idx} className="rounded-control border-2 border-borde p-3 bg-papel">
                  <p className="text-xs font-bold uppercase text-cobalto">{c.tipo_comunicacion}</p>
                  <p className="mt-1 text-sm text-tinta">{c.descripcion}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tinta-suave">{t('perfil.sin_comunicacion')}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
