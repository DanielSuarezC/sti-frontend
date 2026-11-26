import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleCheck, KeyRound } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, Card, ErrorState, Input, PageHeader, buttonClasses } from '@/components/ui';
import { getErrorMessage, post } from '@/lib/api';
import { CampoCopiable } from '@/features/_shared/AccesoEntregado';
import { NarrowPage } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

/** Mensaje de éxito con botón para ir al login. */
function Hecho({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  const intl = useIntl();
  return (
    <Card color="turquesa" padding="lg">
      <div role="status" className="flex items-start gap-4">
        <CircleCheck aria-hidden className="mt-1 size-8 shrink-0 text-verde" />
        <div>
          <h2 className="text-xl">{titulo}</h2>
          <p className="mt-2 text-base">{descripcion}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end border-t-2 border-borde pt-5">
        <Link to="/login" className={buttonClasses('primaria', 'lg')}>
          {intl.formatMessage({ id: 'clave.ir_login' })}
        </Link>
      </div>
    </Card>
  );
}

interface SetPasswordProps {
  endpoint: '/auth/activate' | '/auth/reset-password';
  tituloId: string;
  descId: string;
  botonId: string;
  hechoTituloId: string;
  hechoDescId: string;
}

/** Formulario de nueva contraseña con token del enlace (activar cuenta y restablecer). */
function SetPasswordPage({
  endpoint,
  tituloId,
  descId,
  botonId,
  hechoTituloId,
  hechoDescId,
}: SetPasswordProps) {
  const intl = useIntl();
  const t = (id: string, v?: Record<string, string | number>) => intl.formatMessage({ id }, v);
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  useDocumentTitle(t(tituloId));

  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(10, t('validacion.clave_min', { n: 10 })),
          confirm: z.string().min(1, t('validacion.clave_confirmar')),
        })
        .refine((v) => v.password === v.confirm, {
          path: ['confirm'],
          message: t('validacion.clave_no_coincide'),
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl],
  );
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  if (!token) {
    return (
      <NarrowPage>
        <PageHeader title={t(tituloId)} />
        <ErrorState
          title={t('clave.enlace_invalido_titulo')}
          description={t('clave.enlace_invalido_desc')}
        />
        <p className="mt-6">
          <Link to="/recuperar" className="font-bold">
            {t('clave.pedir_nuevo')}
          </Link>
        </p>
      </NarrowPage>
    );
  }

  if (done) {
    return (
      <NarrowPage>
        <PageHeader title={t(tituloId)} />
        <Hecho titulo={t(hechoTituloId)} descripcion={t(hechoDescId)} />
      </NarrowPage>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      await post(endpoint, { token, password }, { anonymous: true });
      setDone(true);
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  return (
    <NarrowPage>
      <PageHeader title={t(tituloId)} description={t(descId)} />
      <Card color="cobalto" padding="lg">
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
          {serverError && (
            <p
              role="alert"
              className="rounded-control border-2 border-borde bg-rojo-tinte p-4 font-bold"
            >
              {serverError}
            </p>
          )}
          <Input
            label={t('clave.nueva')}
            help={t('clave.requisitos', { n: 10 })}
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
          <div className="flex justify-end border-t-2 border-borde pt-5">
            <Button
              type="submit"
              size="lg"
              loading={formState.isSubmitting}
              rightIcon={<KeyRound className="size-5" />}
            >
              {t(botonId)}
            </Button>
          </div>
        </form>
      </Card>
    </NarrowPage>
  );
}

export function ActivarCuenta() {
  return (
    <SetPasswordPage
      endpoint="/auth/activate"
      tituloId="activar.titulo"
      descId="activar.descripcion"
      botonId="activar.boton"
      hechoTituloId="activar.hecho_titulo"
      hechoDescId="activar.hecho_desc"
    />
  );
}

export function RestablecerClave() {
  return (
    <SetPasswordPage
      endpoint="/auth/reset-password"
      tituloId="restablecer.titulo"
      descId="restablecer.descripcion"
      botonId="restablecer.boton"
      hechoTituloId="restablecer.hecho_titulo"
      hechoDescId="restablecer.hecho_desc"
    />
  );
}

export function RecuperarClave() {
  const intl = useIntl();
  const t = (id: string, v?: Record<string, string | number>) => intl.formatMessage({ id }, v);
  const [nuevoCodigo, setNuevoCodigo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  useDocumentTitle(t('recuperar.titulo'));

  const schema = useMemo(
    () =>
      z
        .object({
          email: z
            .string()
            .min(1, t('validacion.correo_requerido'))
            .email(t('validacion.correo_invalido')),
          codigo: z.string().trim().min(8, t('recuperar.codigo_ayuda')),
          password: z
            .string()
            .min(10, t('validacion.clave_min', { n: 10 }))
            .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, t('registro.v_clave_letra'))
            .regex(/\d/, t('registro.v_clave_numero')),
          confirm: z.string().min(1, t('validacion.clave_confirmar')),
        })
        .refine((v) => v.password === v.confirm, {
          path: ['confirm'],
          message: t('validacion.clave_no_coincide'),
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl],
  );
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', codigo: '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async ({ email, codigo, password }) => {
    setServerError(null);
    try {
      const r = await post<{ codigo_recuperacion: string }>(
        '/auth/recover',
        { email: email.trim(), codigo_recuperacion: codigo.trim(), password },
        { anonymous: true },
      );
      setNuevoCodigo(r.codigo_recuperacion);
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  return (
    <NarrowPage>
      <PageHeader title={t('recuperar.titulo')} description={t('recuperar.descripcion')} />
      {nuevoCodigo ? (
        <Card color="turquesa" padding="lg">
          <div role="status" className="space-y-5">
            <div className="flex items-start gap-4">
              <CircleCheck aria-hidden className="mt-1 size-8 shrink-0 text-verde" />
              <div>
                <h2 className="text-xl">{t('recuperar.hecho_titulo')}</h2>
                <p className="mt-2 text-base">{t('recuperar.hecho_desc')}</p>
              </div>
            </div>
            <CampoCopiable etiqueta={t('recuperar.codigo_nuevo')} valor={nuevoCodigo} />
          </div>
          <div className="mt-6 flex justify-end border-t-2 border-borde pt-5">
            <Link to="/login" className={buttonClasses('primaria', 'lg')}>
              {t('clave.ir_login')}
            </Link>
          </div>
        </Card>
      ) : (
        <Card color="cobalto" padding="lg">
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
            {serverError && (
              <p
                role="alert"
                className="rounded-control border-2 border-borde bg-rojo-tinte p-4 font-bold"
              >
                {serverError}
              </p>
            )}
            <Input
              label={t('login.correo')}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              error={formState.errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('recuperar.codigo')}
              help={t('recuperar.codigo_ayuda')}
              autoComplete="off"
              required
              error={formState.errors.codigo?.message}
              {...register('codigo')}
            />
            <Input
              label={t('clave.nueva')}
              help={t('clave.requisitos', { n: 10 })}
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
            <p className="text-sm text-tinta-suave">{t('recuperar.sin_codigo')}</p>
            <div className="flex flex-col-reverse gap-4 border-t-2 border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="inline-flex min-h-tactil items-center font-bold">
                {t('recuperar.volver')}
              </Link>
              <Button
                type="submit"
                size="lg"
                loading={formState.isSubmitting}
                rightIcon={<KeyRound className="size-5" />}
              >
                {t('recuperar.boton')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </NarrowPage>
  );
}
