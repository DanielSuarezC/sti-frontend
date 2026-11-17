import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, usuarioDemo } from '@/test/utils';
import { ConsentGate, PublicOnly, RequireAuth, RootRedirect } from './guards';
import { FakeAuth } from '@/test/utils';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { messages } from '@/lib/i18n';
import type { Rol, Usuario } from '@/lib/types';

const rutas = (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route
      path="/login"
      element={
        <PublicOnly>
          <p>Pantalla de login</p>
        </PublicOnly>
      }
    />
    <Route path="/403" element={<p>Sin permiso</p>} />
    <Route
      path="/estudiante/consentimiento"
      element={
        <RequireAuth roles={['ESTUDIANTE']}>
          <p>Pantalla F0</p>
        </RequireAuth>
      }
    />
    <Route
      path="/estudiante"
      element={
        <RequireAuth roles={['ESTUDIANTE']}>
          <ConsentGate>
            <p>Inicio estudiante</p>
          </ConsentGate>
        </RequireAuth>
      }
    />
    <Route
      path="/bienestar"
      element={
        <RequireAuth roles={['BIENESTAR']}>
          <p>Inicio bienestar</p>
        </RequireAuth>
      }
    />
  </Routes>
);

describe('guards', () => {
  it('sin sesión, una ruta protegida lleva a /login', () => {
    renderWithProviders(rutas, { route: '/bienestar', user: null });
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('con otro rol lleva a /403', () => {
    renderWithProviders(rutas, { route: '/bienestar', user: usuarioDemo({ rol: 'ESTUDIANTE' }) });
    expect(screen.getByText('Sin permiso')).toBeInTheDocument();
  });

  it('con el rol correcto muestra la pantalla', () => {
    renderWithProviders(rutas, { route: '/bienestar', user: usuarioDemo({ rol: 'BIENESTAR' }) });
    expect(screen.getByText('Inicio bienestar')).toBeInTheDocument();
  });

  it('estudiante SIN F0 firmado es redirigido a /estudiante/consentimiento', () => {
    renderWithProviders(rutas, {
      route: '/estudiante',
      user: usuarioDemo({ consentimiento_firmado: false, estado: 'PENDIENTE_CONSENTIMIENTO' }),
    });
    expect(screen.getByText('Pantalla F0')).toBeInTheDocument();
    expect(screen.queryByText('Inicio estudiante')).not.toBeInTheDocument();
  });

  it('estudiante CON F0 firmado ve su inicio', () => {
    renderWithProviders(rutas, { route: '/estudiante', user: usuarioDemo() });
    expect(screen.getByText('Inicio estudiante')).toBeInTheDocument();
  });

  it('/ envía a cada rol a su inicio', () => {
    renderWithProviders(rutas, { route: '/', user: usuarioDemo({ rol: 'BIENESTAR' }) });
    expect(screen.getByText('Inicio bienestar')).toBeInTheDocument();
  });

  it('/ sin sesión envía a /login', () => {
    renderWithProviders(rutas, { route: '/', user: null });
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('con sesión, /login redirige al inicio del rol', () => {
    renderWithProviders(rutas, { route: '/login', user: usuarioDemo({ rol: 'BIENESTAR' }) });
    expect(screen.getByText('Inicio bienestar')).toBeInTheDocument();
  });

  it('mientras se restaura la sesión muestra "cargando" y no redirige', () => {
    const user: Usuario | null = null;
    render(
      <IntlProvider locale="es-CO" messages={messages}>
        <FakeAuth user={user} status="cargando">
          <MemoryRouter initialEntries={['/bienestar']}>{rutas}</MemoryRouter>
        </FakeAuth>
      </IntlProvider>,
    );
    expect(screen.getByText(/Abriendo tu sesión/)).toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
  });

  it.each<Rol>(['ESTUDIANTE', 'BIENESTAR'])(
    'el rol %s no puede entrar al árbol de otro rol',
    (rol) => {
      const otro = rol === 'ESTUDIANTE' ? '/bienestar' : '/estudiante';
      renderWithProviders(rutas, { route: otro, user: usuarioDemo({ rol }) });
      expect(screen.getByText('Sin permiso')).toBeInTheDocument();
    },
  );
});
