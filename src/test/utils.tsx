import type { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { messages } from '@/lib/i18n';
import { AuthContext, type AuthStatus } from '@/lib/auth';
import type { Usuario } from '@/lib/types';

export const usuarioDemo = (over: Partial<Usuario> = {}): Usuario => ({
  id: 1,
  email: 'ana@universidad.edu.co',
  nombre_completo: 'Ana María Pérez',
  rol: 'ESTUDIANTE',
  estado: 'ACTIVO',
  consentimiento_firmado: true,
  programa_id: 1,
  preferencias_ui: null,
  ...over,
});

/** Proveedor de sesión falso para pruebas de guards y pantallas. */
export function FakeAuth({
  user,
  status,
  children,
}: {
  user: Usuario | null;
  status?: AuthStatus;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider
      value={{
        status: status ?? (user ? 'autenticado' : 'anonimo'),
        user,
        login: async () => user!,
        logout: async () => {},
        refreshUser: async () => user!,
        setUser: () => {},
        acceptSession: () => {},
        hasRole: (...r) => !!user && r.includes(user.rol),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Render con i18n (es-CO), router en memoria, React Query y sesión opcional. */
export function renderWithProviders(
  ui: ReactElement,
  opts: { route?: string; user?: Usuario | null } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <IntlProvider locale="es-CO" messages={messages}>
      <QueryClientProvider client={client}>
        <FakeAuth user={opts.user ?? null}>
          <MemoryRouter initialEntries={[opts.route ?? '/']}>{ui}</MemoryRouter>
        </FakeAuth>
      </QueryClientProvider>
    </IntlProvider>,
  );
}

/** Solo i18n (para componentes del sistema de diseño que no usan router ni sesión). */
export function renderIntl(ui: ReactElement) {
  return render(
    <IntlProvider locale="es-CO" messages={messages}>
      {ui}
    </IntlProvider>,
  );
}
