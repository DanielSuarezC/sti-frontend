import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { AccesoDialog, type AccesoCuenta } from '@/features/_shared/AccesoEntregado';

interface ProgramaOption {
  id: number;
  nombre: string;
}

export default function AltaEstudiante() {
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [programas, setProgramas] = useState<ProgramaOption[]>([]);
  const [cargandoProgramas, setCargandoProgramas] = useState(true);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [tipoCorreo, setTipoCorreo] = useState<'INSTITUCIONAL' | 'PERSONAL'>('INSTITUCIONAL');
  const [codigo, setCodigo] = useState('');
  const [programaId, setProgramaId] = useState('');
  const [telefono, setTelefono] = useState('');
  const [semestreActual, setSemestreActual] = useState('1');
  const [consentimientoVerbal, setConsentimientoVerbal] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [exito, setExito] = useState<{ id: number; detail: string; nombre: string } | null>(null);
  const [acceso, setAcceso] = useState<AccesoCuenta | null>(null);

  useEffect(() => {
    api
      .get<{ items: any[] }>('/usuarios/programas')
      .then((data) => {
        setProgramas(
          (data.items || []).map((p) => ({
            id: p.id,
            nombre: p.nombre_programa || p.nombre,
          })),
        );
        setCargandoProgramas(false);
      })
      .catch(() => setCargandoProgramas(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programaId) {
      setErrorEnvio(t('bienestar.error_programa_requerido'));
      return;
    }
    if (!consentimientoVerbal) {
      setErrorEnvio('Debes confirmar que cuentas con el consentimiento verbal informado del estudiante.');
      return;
    }

    setGuardando(true);
    setErrorEnvio(null);

    try {
      const res = await api.post<{ estudiante_id: number; detail: string; acceso?: AccesoCuenta | null }>('/usuarios/estudiantes', {
        nombre_completo: nombre.trim(),
        email: email.trim(),
        cedula: codigo.trim(),
        codigo_estudiante: codigo.trim(),
        tipo_correo: tipoCorreo,
        es_correo_personal: tipoCorreo === 'PERSONAL',
        programa_id: Number(programaId),
        telefono: telefono.trim() || null,
        semestre_actual: Number(semestreActual) || 1,
        consentimiento_verbal_declarado: true,
      });

      setExito({ id: res.estudiante_id, detail: res.detail, nombre: nombre.trim() });
      setAcceso(res.acceso ?? null);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorEnvio(apiErr.detail || t('bienestar.error_crear_estudiante'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={t('bienestar.alta_titulo')}
        description={t('bienestar.alta_descripcion')}
      />

      {exito ? (
        <Card className="p-6 text-center space-y-4">
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
          <h2 className="font-titulo text-xl font-bold">{t('bienestar.alta_exito_titulo')}</h2>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">{exito.detail}</p>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            Entregue a {exito.nombre} sus datos de acceso. Al iniciar sesión por primera vez, firmará el consentimiento informado (F0).
          </p>
          <div className="flex justify-center gap-3 pt-3">
            <Button variant="secundaria" onClick={() => navigate('/bienestar/tablero')}>
              {t('bienestar.volver_al_tablero')}
            </Button>
            <Button
              variant="primaria"
              onClick={() => navigate(`/bienestar/estudiantes/${exito.id}`)}
            >
              {t('bienestar.ir_al_expediente')}
            </Button>
          </div>
          <AccesoDialog
            acceso={acceso}
            nombre={exito.nombre}
            titulo="Estudiante registrado: entregue su acceso"
            onClose={() => setAcceso(null)}
          />
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorEnvio && (
              <div
                role="alert"
                className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
              >
                {errorEnvio}
              </div>
            )}

            <Input
              label={t('bienestar.campo_nombre_estudiante')}
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellidos completos"
            />

            <Input
              label="Cédula / Documento de identidad"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Número de cédula o documento de identidad"
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Tipo de correo del estudiante</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCorreo"
                    value="INSTITUCIONAL"
                    checked={tipoCorreo === 'INSTITUCIONAL'}
                    onChange={() => setTipoCorreo('INSTITUCIONAL')}
                  />
                  <span>Institucional (@unicordoba.edu.co)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCorreo"
                    value="PERSONAL"
                    checked={tipoCorreo === 'PERSONAL'}
                    onChange={() => setTipoCorreo('PERSONAL')}
                  />
                  <span>Personal (Gmail, Outlook, etc.)</span>
                </label>
              </div>
              <p className="text-xs text-tinta-suave">
                {tipoCorreo === 'PERSONAL'
                  ? 'Permite registrar estudiantes de primer semestre que aún no cuentan con correo institucional asignado.'
                  : 'Correo oficial asignado por la Universidad de Córdoba.'}
              </p>
            </div>

            <Input
              label={tipoCorreo === 'PERSONAL' ? 'Correo electrónico personal' : 'Correo electrónico institucional'}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tipoCorreo === 'PERSONAL' ? 'estudiante@gmail.com' : 'usuario@unicordoba.edu.co'}
            />

            <Select
              label={t('bienestar.campo_programa_academico')}
              required
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              disabled={cargandoProgramas}
            >
              <option value="">{t('bienestar.selecciona_programa')}</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('bienestar.campo_telefono')}
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="3001234567"
              />

              <Input
                label={t('bienestar.campo_semestre_actual')}
                type="number"
                min={1}
                max={20}
                value={semestreActual}
                onChange={(e) => setSemestreActual(e.target.value)}
              />
            </div>

            {/* Consentimiento verbal informado */}
            <div className="rounded-control border-2 border-cobalto bg-cobalto-tinte p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentimientoVerbal}
                  onChange={(e) => setConsentimientoVerbal(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-2 border-borde text-cobalto focus:ring-cobalto"
                />
                <span className="text-sm font-semibold text-tinta">
                  Declaro que he informado al estudiante sobre el modelo MAAR-TEA y he obtenido su{' '}
                  <span className="text-cobalto font-bold underline">consentimiento verbal informado</span> para
                  iniciar su expediente. Al terminar el registro recibiré sus datos de acceso para entregárselos.
                </span>
              </label>
              <p className="text-xs text-tinta-suave pl-7">
                El consentimiento verbal autoriza la apertura del expediente en Bienestar. El estudiante deberá firmar el Formato F0 digital en su primer inicio de sesión. El sistema no envía correos: usted le entrega el acceso.
              </p>
            </div>

            <div className="rounded-control border-2 border-limon bg-limon-tinte p-3 text-xs font-medium text-tinta">
              <p className="font-bold">{t('bienestar.aviso_via1_titulo')}</p>
              <p className="mt-1">
                Al registrar, el sistema muestra una sola vez el correo y la contraseña provisional del estudiante. Entrégueselos
                por un medio seguro; él deberá firmar el formato F0 al ingresar.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secundaria" onClick={() => navigate('/bienestar/tablero')}>
                {t('recuperar.volver')}
              </Button>
              <Button type="submit" variant="primaria" loading={guardando}>
                {t('bienestar.boton_registrar_estudiante')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
