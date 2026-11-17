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
  const [codigo, setCodigo] = useState('');
  const [programaId, setProgramaId] = useState('');
  const [telefono, setTelefono] = useState('');
  const [semestreActual, setSemestreActual] = useState('1');

  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [exito, setExito] = useState<{ id: number; detail: string } | null>(null);

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

    setGuardando(true);
    setErrorEnvio(null);

    try {
      const res = await api.post<{ estudiante_id: number; detail: string }>('/usuarios/estudiantes', {
        nombre_completo: nombre.trim(),
        email: email.trim(),
        codigo_estudiante: codigo.trim(),
        programa_id: Number(programaId),
        telefono: telefono.trim() || null,
        semestre_actual: Number(semestreActual) || 1,
      });

      setExito({ id: res.estudiante_id, detail: res.detail });
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
              label={t('bienestar.campo_codigo_estudiante')}
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="p. ej. 10203040"
            />

            <Input
              label={t('bienestar.campo_email_institucional')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@unicordoba.edu.co"
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

            <div className="rounded-control border-2 border-limon bg-limon-tinte p-3 text-xs font-medium text-tinta">
              <p className="font-bold">{t('bienestar.aviso_via1_titulo')}</p>
              <p className="mt-1">{t('bienestar.aviso_via1_desc')}</p>
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
