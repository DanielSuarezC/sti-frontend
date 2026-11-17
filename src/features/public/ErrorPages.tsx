import { Link, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Ban, SearchX, TriangleAlert } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, buttonClasses } from '@/components/ui';
import { useAuth, rutaPostLogin } from '@/lib/auth';
import { NarrowPage, PublicLayout } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

function ErrorPage({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Ban;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  useDocumentTitle(title);
  return (
    <NarrowPage>
      <div className="rounded-tarjeta border-2 border-borde bg-blanco p-8 text-center shadow-plano-mandarina sm:p-10">
        <span
          aria-hidden
          className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border-2 border-borde bg-mandarina text-mandarina-on"
        >
          <Icon className="size-8" />
        </span>
        <h1 id="titulo-pagina" tabIndex={-1} className="text-2xl sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 text-lg">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </NarrowPage>
  );
}

/** Botón "Ir a mi inicio" (o al login si no hay sesión). */
function GoHome() {
  const intl = useIntl();
  const { user } = useAuth();
  return (
    <Link to={user ? rutaPostLogin(user) : '/login'} className={buttonClasses('primaria', 'lg')}>
      {intl.formatMessage({ id: user ? 'error.ir_inicio' : 'error.ir_login' })}
    </Link>
  );
}

/** 404. Dentro del shell de un rol o en el marco público (el router decide). */
export function NotFound() {
  const intl = useIntl();
  return (
    <ErrorPage
      icon={SearchX}
      title={intl.formatMessage({ id: 'error.404_titulo' })}
      description={intl.formatMessage({ id: 'error.404_desc' })}
    >
      <GoHome />
    </ErrorPage>
  );
}

/** 403: la persona no tiene permiso para esta pantalla. */
export function Forbidden() {
  const intl = useIntl();
  return (
    <ErrorPage
      icon={Ban}
      title={intl.formatMessage({ id: 'error.403_titulo' })}
      description={intl.formatMessage({ id: 'error.403_desc' })}
    >
      <GoHome />
    </ErrorPage>
  );
}

/** Error inesperado de la aplicación (errorElement del router). Siempre ofrece una salida. */
export function GlobalError() {
  const intl = useIntl();
  const navigate = useNavigate();
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const body = is404 ? (
    <NotFound />
  ) : (
    <ErrorPage
      icon={TriangleAlert}
      title={intl.formatMessage({ id: 'error.global_titulo' })}
      description={intl.formatMessage({ id: 'error.global_desc' })}
    >
      <Button onClick={() => window.location.reload()}>
        {intl.formatMessage({ id: 'ui.reintentar' })}
      </Button>
      <Button variant="secundaria" onClick={() => navigate('/')}>
        {intl.formatMessage({ id: 'error.ir_inicio' })}
      </Button>
    </ErrorPage>
  );
  return <PublicLayout>{body}</PublicLayout>;
}
