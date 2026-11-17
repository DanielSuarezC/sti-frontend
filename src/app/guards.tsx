import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useAuth, rutaPostLogin } from '@/lib/auth';
import type { Rol } from '@/lib/types';
import { LoadingState } from '@/components/ui';

export const RUTA_CONSENTIMIENTO = '/estudiante/consentimiento';

function Cargando() {
  const intl = useIntl();
  return (
    <div className="mx-auto max-w-xl p-8">
      <LoadingState label={intl.formatMessage({ id: 'auth.restaurando' })} />
    </div>
  );
}

/** Exige sesión. Sin sesión -> /login (recordando a dónde iba). Con otro rol -> /403. */
export function RequireAuth({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'cargando') return <Cargando />;
  if (status === 'anonimo' || !user)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

/**
 * Gate de consentimiento F0 (RF-05): un estudiante que aún no firmó solo puede ver
 * `/estudiante/consentimiento`. Cualquier otra ruta de /estudiante/* lo redirige allí.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user && user.rol === 'ESTUDIANTE' && !user.consentimiento_firmado) {
    return <Navigate to={RUTA_CONSENTIMIENTO} replace />;
  }
  return <>{children}</>;
}

/** Páginas públicas de entrada (login): si ya hay sesión, va a su inicio. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  if (status === 'cargando') return <Cargando />;
  if (status === 'autenticado' && user) return <Navigate to={rutaPostLogin(user)} replace />;
  return <>{children}</>;
}

/** `/` -> inicio del rol o login. */
export function RootRedirect() {
  const { status, user } = useAuth();
  if (status === 'cargando') return <Cargando />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={rutaPostLogin(user)} replace />;
}
