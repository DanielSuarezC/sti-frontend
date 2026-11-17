import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  LoadingState,
  PageHeader,
  SignaturePad,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SeccionF0 {
  id: string;
  titulo: string;
  parrafos: string[];
}

interface AceptacionF0 {
  clave: string;
  obligatoria: boolean;
  texto: string;
}

interface TextoF0 {
  version_texto: string;
  titulo: string;
  texto_hash: string;
  revision_juridica_pendiente: boolean;
  aviso_revision?: string;
  secciones: SeccionF0[];
  aceptaciones: AceptacionF0[];
  normativa: string[];
}

interface EstadoMioF0 {
  estudiante_id: number;
  estado: 'PENDIENTE' | 'FIRMADO' | 'REVOCADO';
  firmado: boolean;
  firmado_at?: string;
  nombre_firmante?: string;
}

export default function Consentimiento() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [textoF0, setTextoF0] = useState<TextoF0 | null>(null);
  const [mioF0, setMioF0] = useState<EstadoMioF0 | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Formulario
  const [nombreFirmante, setNombreFirmante] = useState('');
  const [aceptaGeneral, setAceptaGeneral] = useState(false);
  const [aceptaSensibles, setAceptaSensibles] = useState(false);
  const [aceptaDocentes, setAceptaDocentes] = useState(true);

  const [firmando, setFirmando] = useState(false);
  const [errorFirma, setErrorFirma] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      api.get<TextoF0>('/consentimiento/texto'),
      api.get<EstadoMioF0>('/consentimiento/mio'),
    ])
      .then(([texto, mio]) => {
        if (activo) {
          setTextoF0(texto);
          setMioF0(mio);
          if (user?.nombre_completo) {
            setNombreFirmante(user.nombre_completo);
          }
          setCargando(false);
        }
      })
      .catch((err: any) => {
        if (activo) {
          setErrorCarga(err.detail || t('f0.error_cargar'));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [user]);

  const handleFirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoF0) return;

    if (!aceptaGeneral || !aceptaSensibles) {
      setErrorFirma(t('f0.error_aceptaciones_obligatorias'));
      return;
    }

    if (!nombreFirmante.trim() || nombreFirmante.trim().length < 3) {
      setErrorFirma(t('firma.error_no_coincide'));
      return;
    }

    setFirmando(true);
    setErrorFirma(null);

    try {
      await api.post('/consentimiento/firmar', {
        version_texto: textoF0.version_texto,
        texto_hash: textoF0.texto_hash,
        nombre_firmante: nombreFirmante.trim(),
        acepta_tratamiento_general: aceptaGeneral,
        acepta_datos_sensibles_salud: aceptaSensibles,
        acepta_compartir_ajustes_docentes: aceptaDocentes,
        estudiante_id: null,
      });

      await refreshUser();
      navigate('/estudiante', { replace: true });
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorFirma(apiErr.detail || t('f0.error_firmar'));
    } finally {
      setFirmando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('f0.cargando')} />;
  }

  if (errorCarga || !textoF0) {
    return (
      <EmptyState
        title={t('f0.error_titulo')}
        description={errorCarga || t('f0.error_cargar')}
        action={
          <Button variant="secundaria" onClick={() => window.location.reload()}>
            {t('ui.reintentar')}
          </Button>
        }
      />
    );
  }

  // Si ya está firmado
  if (mioF0?.firmado) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader title={textoF0.titulo} description={t('f0.firmado_descripcion')} />
        <Card className="p-6 space-y-4">
          <div className="rounded-control border-2 border-verde bg-verde-tinte p-4 text-base">
            <p className="font-bold text-verde">
              {t('f0.firmado_exito', {
                nombre: mioF0.nombre_firmante,
                fecha: mioF0.firmado_at ? new Date(mioF0.firmado_at).toLocaleDateString() : '',
              })}
            </p>
          </div>
          <Button variant="primaria" onClick={() => navigate('/estudiante')}>
            {t('f0.ir_a_inicio')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title={textoF0.titulo}
        description={t('f0.descripcion')}
      />

      {textoF0.revision_juridica_pendiente && textoF0.aviso_revision && (
        <div
          role="note"
          className="rounded-control border-2 border-limon bg-limon-tinte p-4 text-sm font-medium"
        >
          <p className="font-bold">{t('f0.aviso_revision_titulo')}</p>
          <p className="mt-1">{textoF0.aviso_revision}</p>
        </div>
      )}

      {/* Lectura guiada por secciones */}
      <div className="space-y-4">
        {textoF0.secciones.map((sec) => (
          <Card key={sec.id} className="p-5">
            <h3 className="font-titulo text-lg font-bold">{sec.titulo}</h3>
            <div className="mt-2 space-y-2 text-base text-tinta">
              {sec.parrafos.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Formulario de aceptación y firma */}
      <Card className="p-6">
        <form onSubmit={handleFirmar} className="space-y-6">
          <h3 className="font-titulo text-xl font-bold">{t('f0.declaracion_titulo')}</h3>

          {errorFirma && (
            <div
              role="alert"
              className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
            >
              {errorFirma}
            </div>
          )}

          <div className="space-y-4 rounded-control border-2 border-borde p-4 bg-papel">
            <Checkbox
              id="f0-acepta-general"
              label={t('f0.acepta_general')}
              checked={aceptaGeneral}
              onCheckedChange={setAceptaGeneral}
              required
            />

            <Checkbox
              id="f0-acepta-sensibles"
              label={t('f0.acepta_sensibles')}
              checked={aceptaSensibles}
              onCheckedChange={setAceptaSensibles}
              required
            />

            <Checkbox
              id="f0-acepta-docentes"
              label={t('f0.acepta_docentes')}
              checked={aceptaDocentes}
              onCheckedChange={setAceptaDocentes}
            />
          </div>

          <div className="pt-2">
            <SignaturePad
              value={nombreFirmante}
              onChange={setNombreFirmante}
              label={t('firma.etiqueta_nombre')}
              help={
                user?.nombre_completo
                  ? t('firma.ayuda_nombre_esperado', { nombre: user.nombre_completo })
                  : undefined
              }
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primaria"
              loading={firmando}
              disabled={!aceptaGeneral || !aceptaSensibles}
              fullWidth
            >
              {t('f0.boton_firmar')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
