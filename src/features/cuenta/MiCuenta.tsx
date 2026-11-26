import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleAlert, CircleCheck, KeyRound, RefreshCw } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, Card, CardTitle, Input, PageHeader } from '@/components/ui';
import { getErrorMessage, post } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CampoCopiable, descargarTexto } from '@/features/_shared/AccesoEntregado';
import { useDocumentTitle } from '@/features/public/useDocumentTitle';
import { ROL_LABEL_ID } from '@/app/nav';

function ErrorCaja({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-control border-2 border-borde bg-rojo-tinte p-4"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-6 shrink-0 text-rojo" />
      <p className="font-bold">{children}</p>
    </div>
  );
}

/** Cambiar contraseña: cierra todas las sesiones y pide entrar de nuevo. */
function CambiarClave() {
  const intl = useIntl();
  const t = (id: string, v?: Record<string, string | number>) => intl.formatMessage({ id }, v);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          actual: z.string().min(1, t('validacion.clave_requerida')),
          nueva: z
            .string()
            .min(10, t('validacion.clave_min', { n: 10 }))
            .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, t('registro.v_clave_letra'))
            .regex(/\d/, t('registro.v_clave_numero')),
          confirm: z.string().min(1, t('validacion.clave_confirmar')),
        })
        .refine((v) => v.nueva === v.confirm, {
          path: ['confirm'],
          message: t('validacion.clave_no_coincide'),
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl],
  );
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { actual: '', nueva: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      await post('/auth/change-password', { password_actual: v.actual, password_nueva: v.nueva });
      await logout();
      navigate('/login', { replace: true });
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  return (
    <Card color="cobalto" padding="lg">
      <CardTitle>Cambiar mi contraseña</CardTitle>
      <p className="mt-2 text-base text-tinta-suave">
        Al cambiarla cerramos tus sesiones abiertas y tendrás que entrar de nuevo con la contraseña
        nueva.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="mt-5 space-y-5">
        {serverError && <ErrorCaja>{serverError}</ErrorCaja>}
        <Input
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          required
          error={formState.errors.actual?.message}
          {...register('actual')}
        />
        <Input
          label={t('clave.nueva')}
          help={t('clave.requisitos', { n: 10 })}
          type="password"
          autoComplete="new-password"
          required
          error={formState.errors.nueva?.message}
          {...register('nueva')}
        />
        <Input
          label={t('clave.repetir')}
          type="password"
          autoComplete="new-password"
          required
          error={formState.errors.confirm?.message}
          {...register('confirm')}
        />
        <div className="flex justify-end border-t-2 border-borde pt-5">
          <Button
            type="submit"
            loading={formState.isSubmitting}
            rightIcon={<KeyRound className="size-5" />}
          >
            Guardar contraseña nueva
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Genera un código de recuperación nuevo (el anterior deja de servir). */
function CodigoRecuperacion({ email }: { email: string }) {
  const intl = useIntl();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<{ password: string }>({
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      const r = await post<{ codigo_recuperacion: string }>('/auth/recovery-code/regenerate', {
        password,
      });
      setCodigo(r.codigo_recuperacion);
      reset();
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  return (
    <Card color="turquesa" padding="lg">
      <CardTitle>Mi código de recuperación</CardTitle>
      <p className="mt-2 text-base text-tinta-suave">
        Con este código puedes crear una contraseña nueva si la olvidas, sin necesitar correo. Por
        seguridad no lo podemos volver a mostrar: si lo perdiste, genera uno nuevo (el anterior
        dejará de servir).
      </p>
      {codigo ? (
        <div role="status" className="mt-5 space-y-4">
          <div className="flex items-start gap-3">
            <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-verde" />
            <p className="font-bold">Este es tu código nuevo. Guárdalo ahora.</p>
          </div>
          <CampoCopiable etiqueta="Código de recuperación" valor={codigo} />
          <Button
            type="button"
            variant="secundaria"
            onClick={() =>
              descargarTexto(
                'codigo-recuperacion-sti.txt',
                `Sistema Tutor Inteligente (STI)\nCorreo: ${email}\nCódigo de recuperación: ${codigo}\n`,
              )
            }
          >
            Descargar como archivo
          </Button>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-5">
          {serverError && <ErrorCaja>{serverError}</ErrorCaja>}
          <Input
            label="Tu contraseña actual"
            help="La pedimos para confirmar que eres tú."
            type="password"
            autoComplete="current-password"
            required
            {...register('password', { required: true })}
          />
          <div className="flex justify-end border-t-2 border-borde pt-5">
            <Button
              type="submit"
              variant="secundaria"
              loading={formState.isSubmitting}
              rightIcon={<RefreshCw className="size-5" />}
            >
              Generar código nuevo
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function MiCuenta() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const { user } = useAuth();
  useDocumentTitle(t('cuenta.titulo'));
  if (!user) return null;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title={t('cuenta.titulo')} description={t('cuenta.descripcion')} />
      <Card padding="lg">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-tinta-suave">Nombre</dt>
            <dd className="text-base font-bold">{user.nombre_completo}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-tinta-suave">Correo para entrar</dt>
            <dd className="break-all text-base font-bold">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-tinta-suave">Tipo de cuenta</dt>
            <dd className="text-base font-bold">{t(ROL_LABEL_ID[user.rol])}</dd>
          </div>
        </dl>
      </Card>
      <CambiarClave />
      <CodigoRecuperacion email={user.email} />
    </div>
  );
}
