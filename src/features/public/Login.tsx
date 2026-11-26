import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CircleAlert, LogIn } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, Card, Input, PageHeader } from '@/components/ui';
import { getErrorMessage } from '@/lib/api';
import { rutaPostLogin, useAuth } from '@/lib/auth';
import { NarrowPage } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

export default function Login() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [serverError, setServerError] = useState<string | null>(null);
  useDocumentTitle(t('login.titulo'));

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .min(1, t('validacion.correo_requerido'))
          .email(t('validacion.correo_invalido')),
        password: z.string().min(1, t('validacion.clave_requerida')),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl],
  );
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    try {
      const user = await login(email.trim(), password);
      const destino =
        from && from !== '/login' && from.startsWith(`/${user.rol.toLowerCase()}`)
          ? from
          : rutaPostLogin(user);
      navigate(destino, { replace: true });
    } catch (e) {
      setServerError(getErrorMessage(e, intl));
    }
  });

  return (
    <NarrowPage>
      <PageHeader title={t('login.titulo')} description={t('login.descripcion')} />
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
          <Input
            label={t('login.correo')}
            help={t('login.correo_ayuda')}
            type="email"
            autoComplete="username"
            inputMode="email"
            required
            error={formState.errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('login.clave')}
            type="password"
            autoComplete="current-password"
            required
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <div className="flex flex-col-reverse gap-4 border-t-2 border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/recuperar" className="inline-flex min-h-tactil items-center font-bold">
              {t('login.olvide')}
            </Link>
            <Button
              type="submit"
              size="lg"
              loading={formState.isSubmitting}
              loadingText={t('login.entrando')}
              rightIcon={<LogIn className="size-5" />}
            >
              {t('login.entrar')}
            </Button>
          </div>
        </form>
      </Card>
      <p className="mt-6 text-base">
        {t('login.sin_cuenta')}{' '}
        <Link to="/registro" className="font-bold">
          {t('login.solicitar')}
        </Link>
      </p>
    </NarrowPage>
  );
}
