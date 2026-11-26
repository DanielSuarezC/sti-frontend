import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Ellipsis, LogOut, Route as RouteIcon, SlidersHorizontal, UserCog } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, Dialog, buttonClasses } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/lib/auth';
import type { Rol } from '@/lib/types';
import { NAV, ROL_LABEL_ID, type NavItem } from '../nav';
import { NotificationBell } from './NotificationBell';
import { SensoryPanel, SensoryPanelContext } from './SensoryPanel';

/** Enlace "Saltar al contenido": primer elemento enfocable de la página. */
export function SkipLink() {
  const intl = useIntl();
  return (
    <a
      href="#contenido"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('contenido');
        main?.focus();
        main?.scrollIntoView?.();
      }}
      className="sr-only z-[70] rounded-control border-2 border-borde bg-limon px-4 py-3 font-titulo font-bold text-limon-on no-underline focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      {intl.formatMessage({ id: 'shell.saltar' })}
    </a>
  );
}

export function Brand({ className }: { className?: string }) {
  const intl = useIntl();
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-control border-2 border-borde bg-cobalto text-cobalto-on shadow-plano-limon"
      >
        <RouteIcon className="size-6" />
      </span>
      <span className="leading-tight">
        <span className="block font-titulo text-lg font-bold">
          {intl.formatMessage({ id: 'app.nombre_corto' })}
        </span>
        <span className="block text-xs text-tinta-suave">
          {intl.formatMessage({ id: 'app.subtitulo' })}
        </span>
      </span>
    </div>
  );
}

const itemClase = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-tactil items-center gap-3 rounded-control border-2 px-3 py-2 font-titulo text-base font-semibold no-underline',
    isActive
      ? 'border-borde bg-cobalto text-cobalto-on shadow-plano-tinta'
      : 'border-transparent text-tinta hover:border-borde hover:bg-papel',
  );

function SideRail({
  items,
  onSensory,
  onLogout,
}: {
  items: NavItem[];
  onSensory: () => void;
  onLogout: () => void;
}) {
  const intl = useIntl();
  const location = useLocation();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r-2 border-borde bg-blanco p-4 lg:flex">
      <Brand />
      <nav
        aria-label={intl.formatMessage({ id: 'shell.nav_principal' })}
        className="flex-1 overflow-y-auto"
      >
        <ul role="list" className="space-y-2">
          {items.map((it) => {
            const isCustomActive =
              (it.to.includes('inasistencia') && location.pathname.includes('inasistencia')) ||
              (it.to.includes('asignaturas') && location.pathname.includes('asignatura'));
            return (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) => itemClase({ isActive: isActive || isCustomActive })}
                >
                  <it.icon aria-hidden className="size-6 shrink-0" />
                  <span className="flex-1">{intl.formatMessage({ id: it.labelId })}</span>
                  {(location.pathname === it.to || isCustomActive) && (
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-limon shrink-0"
                      title="Ubicación actual"
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-2 border-t-2 border-borde pt-4">
        <button
          type="button"
          onClick={onSensory}
          className={cn(itemClase({ isActive: false }), 'w-full text-left')}
        >
          <SlidersHorizontal aria-hidden className="size-6 shrink-0" />
          {intl.formatMessage({ id: 'shell.como_me_siento' })}
        </button>
        <NavLink
          to="/cuenta"
          className={({ isActive }) => cn(itemClase({ isActive }), 'w-full text-left')}
        >
          <UserCog aria-hidden className="size-6 shrink-0" />
          {intl.formatMessage({ id: 'shell.mi_cuenta' })}
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          className={cn(itemClase({ isActive: false }), 'w-full text-left')}
        >
          <LogOut aria-hidden className="size-6 shrink-0" />
          {intl.formatMessage({ id: 'shell.salir' })}
        </button>
      </div>
    </aside>
  );
}

const barraItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-control border-2 px-1 text-center text-xs font-bold no-underline',
    isActive ? 'border-borde bg-cobalto text-cobalto-on' : 'border-transparent text-tinta',
  );

function BottomBar({ items, onMenu }: { items: NavItem[]; onMenu: () => void }) {
  const intl = useIntl();
  const visibles = items.slice(0, 4);
  return (
    <nav
      aria-label={intl.formatMessage({ id: 'shell.nav_principal' })}
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-borde bg-blanco p-2 lg:hidden"
    >
      <ul role="list" className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {visibles.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} className={barraItem}>
              <it.icon aria-hidden className="size-6" />
              {intl.formatMessage({ id: it.labelId })}
            </NavLink>
          </li>
        ))}
        {/* Relleno para que "Menú" quede siempre en la 5.ª posición. */}
        {Array.from({ length: Math.max(0, 4 - visibles.length) }, (_, i) => (
          <li key={`v${i}`} aria-hidden />
        ))}
        <li>
          <button
            type="button"
            onClick={onMenu}
            className={cn(barraItem({ isActive: false }), 'w-full')}
          >
            <Ellipsis aria-hidden className="size-6" />
            {intl.formatMessage({ id: 'shell.menu' })}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Menú completo en móvil/tablet: todos los ítems, panel sensorial y salir. */
function MenuDialog({
  open,
  onOpenChange,
  items,
  onSensory,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: NavItem[];
  onSensory: () => void;
  onLogout: () => void;
}) {
  const intl = useIntl();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={intl.formatMessage({ id: 'shell.menu' })}
      size="sm"
    >
      <ul role="list" className="space-y-2">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.end}
              className={itemClase}
              onClick={() => onOpenChange(false)}
            >
              <it.icon aria-hidden className="size-6 shrink-0" />
              {intl.formatMessage({ id: it.labelId })}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={cn(itemClase({ isActive: false }), 'w-full text-left')}
            onClick={() => {
              onOpenChange(false);
              onSensory();
            }}
          >
            <SlidersHorizontal aria-hidden className="size-6 shrink-0" />
            {intl.formatMessage({ id: 'shell.como_me_siento' })}
          </button>
        </li>
        <li>
          <NavLink
            to="/cuenta"
            onClick={() => onOpenChange(false)}
            className={({ isActive }) => cn(itemClase({ isActive }), 'w-full text-left')}
          >
            <UserCog aria-hidden className="size-6 shrink-0" />
            {intl.formatMessage({ id: 'shell.mi_cuenta' })}
          </NavLink>
        </li>
        <li>
          <button
            type="button"
            className={cn(itemClase({ isActive: false }), 'w-full text-left')}
            onClick={onLogout}
          >
            <LogOut aria-hidden className="size-6 shrink-0" />
            {intl.formatMessage({ id: 'shell.salir' })}
          </button>
        </li>
      </ul>
    </Dialog>
  );
}

function Header({
  rol,
  minimal,
  onSensory,
  onLogout,
}: {
  rol: Rol;
  minimal: boolean;
  onSensory: () => void;
  onLogout: () => void;
}) {
  const intl = useIntl();
  const { user } = useAuth();
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-b-2 border-borde bg-blanco px-4 py-3 sm:px-8',
        !minimal && 'lg:justify-end',
      )}
    >
      <Brand className={minimal ? '' : 'lg:hidden'} />
      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="font-titulo text-base font-semibold">{user?.nombre_completo}</p>
          <p className="text-sm text-tinta-suave">
            {intl.formatMessage({ id: ROL_LABEL_ID[rol] })}
          </p>
        </div>
        {minimal ? (
          <>
            <Button
              variant="secundaria"
              leftIcon={<SlidersHorizontal className="size-5" />}
              onClick={onSensory}
            >
              {intl.formatMessage({ id: 'shell.como_me_siento' })}
            </Button>
            <Link to="/cuenta" className={buttonClasses('secundaria')}>
              <UserCog aria-hidden className="size-5" />
              {intl.formatMessage({ id: 'shell.mi_cuenta' })}
            </Link>
            <Button
              variant="secundaria"
              leftIcon={<LogOut className="size-5" />}
              onClick={onLogout}
            >
              {intl.formatMessage({ id: 'shell.salir' })}
            </Button>
          </>
        ) : (
          <NotificationBell />
        )}
      </div>
    </header>
  );
}

export interface AppShellProps {
  rol: Rol;
  /** Sin riel ni campana (pantalla de consentimiento F0: una sola tarea, sin distracciones). */
  minimal?: boolean;
}

/**
 * Esqueleto de la aplicación autenticada: riel lateral (escritorio) o barra inferior (móvil),
 * cabecera con campana, "Saltar al contenido", región principal y panel "Cómo me siento mejor".
 * El contenido de cada pantalla entra por <Outlet/>.
 */
export function AppShell({ rol, minimal = false }: AppShellProps) {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [sensoryOpen, setSensoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const items = useMemo(() => (minimal ? [] : NAV[rol]), [rol, minimal]);

  // Al navegar, llevar el foco al título de la nueva pantalla (o al contenido) y volver arriba.
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    const target = (document.getElementById('titulo-pagina') ??
      mainRef.current) as HTMLElement | null;
    target?.focus({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }, [location.pathname]);

  const doLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const ctx = useMemo(() => ({ open: () => setSensoryOpen(true) }), []);

  return (
    <SensoryPanelContext.Provider value={ctx}>
      <SkipLink />
      <div className="flex min-h-screen">
        {!minimal && (
          <SideRail
            items={items}
            onSensory={() => setSensoryOpen(true)}
            onLogout={() => void doLogout()}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            rol={rol}
            minimal={minimal}
            onSensory={() => setSensoryOpen(true)}
            onLogout={() => void doLogout()}
          />
          <main
            id="contenido"
            ref={mainRef}
            tabIndex={-1}
            aria-label={intl.formatMessage({ id: 'shell.contenido' })}
            className="flex-1 px-4 py-6 pb-28 sm:px-8 sm:py-8 lg:pb-10"
          >
            <Outlet />
          </main>
        </div>
      </div>
      {!minimal && <BottomBar items={items} onMenu={() => setMenuOpen(true)} />}
      {!minimal && (
        <MenuDialog
          open={menuOpen}
          onOpenChange={setMenuOpen}
          items={items}
          onSensory={() => setSensoryOpen(true)}
          onLogout={() => void doLogout()}
        />
      )}
      <SensoryPanel open={sensoryOpen} onOpenChange={setSensoryOpen} />
    </SensoryPanelContext.Provider>
  );
}
