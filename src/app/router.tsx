import { createBrowserRouter, createMemoryRouter, type RouteObject } from 'react-router-dom';
import type { Rol } from '@/lib/types';
import { AppShell } from './shell/AppShell';
import { ConsentGate, PublicOnly, RequireAuth, RootRedirect } from './guards';
import { PublicLayout } from '@/features/public/PublicLayout';
import Login from '@/features/public/Login';
import { ActivarCuenta, RecuperarClave, RestablecerClave } from '@/features/public/PasswordPages';
import Privacidad from '@/features/public/Privacidad';
import SolicitarAcceso from '@/features/public/SolicitarAcceso';
import Registro from '@/features/public/Registro';
import MiCuenta from '@/features/cuenta/MiCuenta';
import { useAuth } from '@/lib/auth';
import { Forbidden, GlobalError, NotFound } from '@/features/public/ErrorPages';
import Consentimiento from '@/features/estudiante/Consentimiento';
import { estudianteRoutes } from '@/features/estudiante/routes';
import { bienestarRoutes } from '@/features/bienestar/routes';
import { coordinadorRoutes } from '@/features/coordinador/routes';
import { docenteRoutes } from '@/features/docente/routes';
import { familiarRoutes } from '@/features/familiar/routes';
import { adminRoutes } from '@/features/admin/routes';

/** Cada rol: prefijo de URL, rol del guard y rutas hijas (definidas en `features/<rol>/routes.tsx`). */
const ROLES: { path: string; rol: Rol; children: RouteObject[] }[] = [
  { path: 'estudiante', rol: 'ESTUDIANTE', children: estudianteRoutes },
  { path: 'bienestar', rol: 'BIENESTAR', children: bienestarRoutes },
  { path: 'coordinador', rol: 'COORDINADOR', children: coordinadorRoutes },
  { path: 'docente', rol: 'DOCENTE', children: docenteRoutes },
  { path: 'familiar', rol: 'FAMILIAR', children: familiarRoutes },
  { path: 'admin', rol: 'ADMIN', children: adminRoutes },
];

/** `/cuenta`: misma pantalla para todos los roles, dentro del marco de su rol (sin riel si aún falta el F0). */
function CuentaShell() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell rol={user.rol} minimal={user.rol === 'ESTUDIANTE' && !user.consentimiento_firmado} />
  );
}

export const routes: RouteObject[] = [
  {
    errorElement: <GlobalError />,
    children: [
      { path: '/', element: <RootRedirect /> },

      // Páginas públicas
      {
        element: <PublicLayout />,
        children: [
          {
            path: 'login',
            element: (
              <PublicOnly>
                <Login />
              </PublicOnly>
            ),
          },
          { path: 'activar', element: <ActivarCuenta /> },
          { path: 'recuperar', element: <RecuperarClave /> },
          { path: 'restablecer', element: <RestablecerClave /> },
          { path: 'privacidad', element: <Privacidad /> },
          { path: 'registro', element: <Registro /> },
          { path: 'solicitar-acceso', element: <SolicitarAcceso /> },
          // Galería del sistema de diseño: solo en desarrollo (se elimina del build de producción).
          ...(import.meta.env.DEV
            ? [
                {
                  path: '__galeria',
                  lazy: async () => ({
                    Component: (await import('@/features/dev/Galeria')).default,
                  }),
                },
              ]
            : []),
          { path: '403', element: <Forbidden /> },
          { path: '404', element: <NotFound /> },
          { path: '*', element: <NotFound /> },
        ],
      },

      // F0 del estudiante: pantalla sin riel (una sola tarea). Alcanzable aunque F0 esté pendiente.
      {
        path: 'estudiante/consentimiento',
        element: (
          <RequireAuth roles={['ESTUDIANTE']}>
            <AppShell rol="ESTUDIANTE" minimal />
          </RequireAuth>
        ),
        children: [{ index: true, element: <Consentimiento /> }],
      },

      {
        path: 'cuenta',
        element: (
          <RequireAuth>
            <CuentaShell />
          </RequireAuth>
        ),
        children: [{ index: true, element: <MiCuenta /> }],
      },

      // Un árbol por rol con su shell y guard.
      ...ROLES.map(({ path, rol, children }): RouteObject => {
        const shell = <AppShell rol={rol} />;
        return {
          path,
          element: (
            <RequireAuth roles={[rol]}>
              {rol === 'ESTUDIANTE' ? <ConsentGate>{shell}</ConsentGate> : shell}
            </RequireAuth>
          ),
          children: [...children, { path: '*', element: <NotFound /> }],
        };
      }),
    ],
  },
];

const future = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_skipActionErrorRevalidation: true,
} as const;

export const createAppRouter = () => createBrowserRouter(routes, { future });
export const createTestRouter = (initialEntries: string[]) =>
  createMemoryRouter(routes, { initialEntries, future });
