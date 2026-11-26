import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleAlert, Download, UserPlus } from 'lucide-react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Checkbox,
  Input,
  PageHeader,
  RadioGroup,
  Select,
} from '@/components/ui';
import { get, getErrorMessage, post } from '@/lib/api';
import { rutaPostLogin, useAuth } from '@/lib/auth';
import type { AuthResponse, Rol } from '@/lib/types';
import {
  CampoCopiable,
  descargarTexto,
} from '@/features/_shared/AccesoEntregado';
import { NarrowPage } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

interface Opciones {
  registro_abierto: boolean;
  roles: Rol[];
  requiere_codigo_personal: Rol[];
  min_password_length: number;
}
interface ProgramaPublico {
  id: number;
  nombre: string;
}
interface RegistroResponse extends AuthResponse {
  codigo_recuperacion: string;
}

const ROLES_ORDEN: Rol[] = ['ESTUDIANTE', 'FAMILIAR', 'DOCENTE', 'BIENESTAR', 'COORDINADOR'];
const ETIQUETA_ROL: Record<string, string> = {
  ESTUDIANTE: 'Soy estudiante',
  FAMILIAR: 'Soy familiar de un estudiante',
  DOCENTE: 'Soy docente',
  BIENESTAR: 'Soy de Bienestar Universitario',
  COORDINADOR: 'Soy coordinador de programa',
};
const AYUDA_ROL: Record<string, string> = {
  ESTUDIANTE: 'Verás tu ruta, tu perfil y tu Plan MAAR-TEA.',
  FAMILIAR: 'Necesitas el código que te dio el estudiante en «Mi familia».',
  DOCENTE: 'Verás los ajustes de las asignaturas que te asignen.',
  BIENESTAR: 'Necesitas el código de acceso del personal.',
  COORDINADOR: 'Necesitas el código de acceso del personal.',
};

export default function Registro() {
  const intl = useIntl();
  const t = (id: string, v?: Record<string, string | number>) => intl.formatMessage({ id }, v);
  const navigate = useNavigate();
  const { status, user, acceptSession } = useAuth();
  useDocumentTitle(t('registro.titulo'));

  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [programas, setProgramas] = useState<ProgramaPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegistroResponse | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let vivo = true;
    Promise.allSettled([
      get<Opciones>('/auth/registro/opciones', { anonymous: true }),
      get<{ items: ProgramaPublico[] }>('/solicitudes/programas', { anonymous: true }),
    ]).then(([o, p]) => {
      if (!vivo) return;
      if (o.status === 'fulfilled') setOpciones(o.value);
      if (p.status === 'fulfilled') setProgramas(p.value.items ?? []);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const minClave = opciones?.min_password_length ?? 10;
  const schema = useMemo(
    () =>
      z
        .object({
          rol: z.string().min(1),
          nombre_completo: z.string().trim().min(3, t('registro.v_nombre')),
          email: z
            .string()
            .min(1, t('validacion.correo_requerido'))
            .email(t('validacion.correo_invalido')),
          password: z
            .string()
            .min(minClave, t('validacion.clave_min', { n: minClave }))
            .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, t('registro.v_clave_letra'))
            .regex(/\d/, t('registro.v_clave_numero')),
          confirm: z.string().min(1, t('validacion.clave_confirmar')),
          codigo_estudiante: z.string().trim().optional(),
          programa_id: z.string().optional(),
          codigo_acceso: z.string().trim().optional(),
          codigo_vinculacion: z.string().trim().optional(),
          acepta: z.boolean().refine((v) => v, t('registro.v_privacidad')),
        })
        .superRefine((v, ctx) => {
          const req = (campo: keyof typeof v, msg: string) => {
            if (!v[campo]) ctx.addIssue({ code: 'custom', path: [campo], message: msg });
          };
          if (v.password !== v.confirm)
            ctx.addIssue({
              code: 'custom',
              path: ['confirm'],
              message: t('validacion.clave_no_coincide'),
            });
          if (v.rol === 'ESTUDIANTE') {
            req('codigo_estudiante', t('registro.v_codigo_estudiante'));
            req('programa_id', t('registro.v_programa'));
          }
          if (v.rol === 'FAMILIAR') req('codigo_vinculacion', t('registro.v_codigo_vinculacion'));
          if (v.rol === 'BIENESTAR' || v.rol === 'COORDINADOR')
            req('codigo_acceso', t('registro.v_codigo_acceso'));
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl, minClave],
  );
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, control, watch, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      rol: 'ESTUDIANTE',
      nombre_completo: '',
      email: '',
      password: '',
      confirm: '',
      codigo_estudiante: '',
      programa_id: '',
      codigo_acceso: '',
      codigo_vinculacion: '',
      acepta: false,
    },
  });
  const rol = watch('rol');

  if (status === 'autenticado' && user && !resultado) {
    return <Navigate to={rutaPostLogin(user)} replace />;
  }

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      const r = await post<RegistroResponse>(
        '/auth/register',
        {
          rol: v.rol,
          nombre_completo: v.nombre_completo.trim(),
          email: v.email.trim(),
          password: v.password,
          codigo_estudiante: v.rol === 'ESTUDIANTE' ? v.codigo_estudiante : null,
          programa_id: v.programa_id ? Number(v.programa_id) : null,
          codigo_acceso: v.codigo_acceso || null,
          codigo_vinculacion: v.rol === 'FAMILIAR' ? v.codigo_vinculacion : null,
          acepta_aviso_privacidad: v.acepta,
        },
        { anonymous: true },
      );
      setResultado(r);
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  /* ---- Paso 2: guardar el código de recuperación ---- */
  if (resultado) {
    const continuar = () => {
      acceptSession(resultado);
      navigate(rutaPostLogin(resultado.user), { replace: true });
    };
    return (
      <NarrowPage>
        <PageHeader title={t('registro.listo_titulo')} description={t('registro.listo_desc')} />
        <Card color="turquesa" padding="lg">
          <div className="space-y-5">
            <p className="text-base">{t('registro.codigo_explica')}</p>
            <CampoCopiable
              etiqueta={t('registro.codigo_etiqueta')}
              valor={resultado.codigo_recuperacion}
            />
            <Button
              type="button"
              variant="secundaria"
              leftIcon={<Download className="size-5" />}
              onClick={() =>
                descargarTexto(
                  'codigo-recuperacion-sti.txt',
                  `Sistema Tutor Inteligente (STI)\nCorreo: ${resultado.user.email}\nCódigo de recuperación: ${resultado.codigo_recuperacion}\n\nGuárdelo en un lugar seguro: sirve para recuperar su contraseña sin correo.`,
                )
              }
            >
              {t('registro.codigo_descargar')}
            </Button>
            <Checkbox
              label={t('registro.codigo_confirmo')}
              checked={guardado}
              onCheckedChange={setGuardado}
            />
            <div className="flex justify-end border-t-2 border-borde pt-5">
              <Button size="lg" disabled={!guardado} onClick={continuar}>
                {t('registro.continuar')}
              </Button>
            </div>
          </div>
        </Card>
      </NarrowPage>
    );
  }

  /* ---- Paso 1: formulario ---- */
  const rolesDisponibles = ROLES_ORDEN.filter((r) => opciones?.roles.includes(r));
  const cerrado = opciones !== null && !opciones.registro_abierto;
  const necesitaPrograma = rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'COORDINADOR';

  return (
    <NarrowPage>
      <PageHeader title={t('registro.titulo')} description={t('registro.descripcion')} />
      {cerrado ? (
        <Card color="limon" padding="lg">
          <p role="status" className="text-base font-bold">
            {t('registro.cerrado')}
          </p>
        </Card>
      ) : (
        <Card color="cobalto" padding="lg">
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-control border-2 border-borde bg-rojo-tinte p-4"
              >
                <CircleAlert aria-hidden className="mt-0.5 size-6 shrink-0 text-rojo" />
                <p className="font-bold">{serverError}</p>
              </div>
            )}
            <Controller
              control={control}
              name="rol"
              render={({ field }) => (
                <RadioGroup
                  legend={t('registro.quien_eres')}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={(rolesDisponibles.length ? rolesDisponibles : (['ESTUDIANTE'] as Rol[])).map(
                    (r) => ({ value: r, label: ETIQUETA_ROL[r], description: AYUDA_ROL[r] }),
                  )}
                />
              )}
            />
            <Input
              label={t('registro.nombre')}
              autoComplete="name"
              required
              error={formState.errors.nombre_completo?.message}
              {...register('nombre_completo')}
            />
            <Input
              label={t('registro.correo')}
              help={t('registro.correo_ayuda')}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              error={formState.errors.email?.message}
              {...register('email')}
            />
            {rol === 'ESTUDIANTE' && (
              <Input
                label={t('registro.codigo_estudiante')}
                help={t('registro.codigo_estudiante_ayuda')}
                required
                error={formState.errors.codigo_estudiante?.message}
                {...register('codigo_estudiante')}
              />
            )}
            {necesitaPrograma && (
              <Select
                label={t('registro.programa')}
                required={rol === 'ESTUDIANTE'}
                disabled={cargando}
                error={formState.errors.programa_id?.message}
                {...register('programa_id')}
              >
                <option value="">{t('registro.programa_elegir')}</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            )}
            {rol === 'FAMILIAR' && (
              <Input
                label={t('registro.codigo_vinculacion')}
                help={t('registro.codigo_vinculacion_ayuda')}
                required
                autoComplete="off"
                error={formState.errors.codigo_vinculacion?.message}
                {...register('codigo_vinculacion')}
              />
            )}
            {(rol === 'BIENESTAR' || rol === 'COORDINADOR') && (
              <Input
                label={t('registro.codigo_acceso')}
                help={t('registro.codigo_acceso_ayuda')}
                type="password"
                required
                autoComplete="off"
                error={formState.errors.codigo_acceso?.message}
                {...register('codigo_acceso')}
              />
            )}
            <Input
              label={t('clave.nueva')}
              help={t('registro.clave_ayuda', { n: minClave })}
              type="password"
              autoComplete="new-password"
              required
              error={formState.errors.password?.message}
              {...register('password')}
            />
            <Input
              label={t('clave.repetir')}
              type="password"
              autoComplete="new-password"
              required
              error={formState.errors.confirm?.message}
              {...register('confirm')}
            />
            <Controller
              control={control}
              name="acepta"
              render={({ field }) => (
                <Checkbox
                  label={
                    <>
                      {t('registro.acepto')}{' '}
                      <Link to="/privacidad" target="_blank" className="font-bold">
                        {t('registro.aviso_privacidad')}
                      </Link>
                    </>
                  }
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  error={formState.errors.acepta?.message}
                />
              )}
            />
            <div className="flex flex-col-reverse gap-4 border-t-2 border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="inline-flex min-h-tactil items-center font-bold">
                {t('registro.ya_tengo')}
              </Link>
              <Button
                type="submit"
                size="lg"
                loading={formState.isSubmitting}
                loadingText={t('registro.creando')}
                rightIcon={<UserPlus className="size-5" />}
              >
                {t('registro.crear')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </NarrowPage>
  );
}
