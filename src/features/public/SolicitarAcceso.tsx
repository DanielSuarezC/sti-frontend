import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { NarrowPage } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

interface ProgramaPublico {
  id: number;
  nombre: string;
}

export default function SolicitarAcceso() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);
  useDocumentTitle(t('solicitar.titulo'));

  const [programas, setProgramas] = useState<ProgramaPublico[]>([]);
  const [loadingProgramas, setLoadingProgramas] = useState(true);

  // Form state
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [programaId, setProgramaId] = useState<string>('');
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [sitioWeb, setSitioWeb] = useState(''); // Honeypot oculto

  const [enviando, setEnviando] = useState(false);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    api
      .get<{ items: ProgramaPublico[] }>('/solicitudes/programas')
      .then((data) => {
        if (activo) {
          setProgramas(data.items || []);
          setLoadingProgramas(false);
        }
      })
      .catch(() => {
        if (activo) setLoadingProgramas(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceptaPrivacidad) {
      setErrorMensaje(t('solicitar.error_privacidad'));
      return;
    }

    setEnviando(true);
    setErrorMensaje(null);

    try {
      const res = await api.post<{ detail: string }>('/solicitudes/publica', {
        codigo_estudiantil: codigo.trim(),
        email_institucional: email.trim(),
        nombre_completo: nombre.trim(),
        telefono: telefono.trim() || null,
        programa_id: programaId ? Number(programaId) : null,
        acepta_aviso_privacidad: true,
        sitio_web: sitioWeb || null,
      });

      setExitoMensaje(res.detail || t('solicitar.exito_mensaje'));
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorMensaje(apiErr.detail || t('solicitar.error_generico'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <NarrowPage>
      <PageHeader title={t('solicitar.titulo')} description={t('solicitar.descripcion')} />

      {exitoMensaje ? (
        <Card className="space-y-4 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-verde-tinte text-verde">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-titulo text-xl font-bold">{t('solicitar.exito_titulo')}</h2>
          <p className="text-base text-tinta-suave">{exitoMensaje}</p>
          <div className="pt-4">
            <Link to="/login">
              <Button variant="primaria">{t('recuperar.volver')}</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMensaje && (
              <div
                role="alert"
                className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
              >
                {errorMensaje}
              </div>
            )}

            {/* Honeypot field (oculto para humanos) */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="campo-extra">Sitio web</label>
              <input
                id="campo-extra"
                type="text"
                value={sitioWeb}
                onChange={(e) => setSitioWeb(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <Input
              label={t('solicitar.campo_codigo')}
              type="text"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="p. ej. 10203040"
            />

            <Input
              label={t('solicitar.campo_email')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="estudiante@unicordoba.edu.co"
            />

            <Input
              label={t('solicitar.campo_nombre')}
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
            />

            <Input
              label={t('solicitar.campo_telefono')}
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
            />

            <Select
              label={t('solicitar.campo_programa')}
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              disabled={loadingProgramas}
            >
              <option value="">{t('solicitar.seleccionar_programa')}</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  required
                  checked={aceptaPrivacidad}
                  onChange={(e) => setAceptaPrivacidad(e.target.checked)}
                  className="mt-1 size-4 rounded border-2 border-borde text-cobalto focus:ring-cobalto"
                />
                <span>
                  {t('solicitar.acepta_aviso')}{' '}
                  <Link
                    to="/privacidad"
                    target="_blank"
                    className="font-bold underline text-cobalto"
                  >
                    {t('privacidad.titulo')}
                  </Link>
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="text-sm font-bold text-cobalto hover:underline">
                {t('recuperar.volver')}
              </Link>
              <Button type="submit" variant="primaria" loading={enviando}>
                {t('solicitar.boton_enviar')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </NarrowPage>
  );
}
