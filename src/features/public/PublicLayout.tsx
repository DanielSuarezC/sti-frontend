import { useMemo, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button } from '@/components/ui';
import { Brand, SkipLink } from '@/app/shell/AppShell';
import { SensoryPanel, SensoryPanelContext } from '@/app/shell/SensoryPanel';

/** Marco de las páginas públicas: cabecera simple, contenido centrado y pie con aviso de privacidad. */
export function PublicLayout({ children }: { children?: React.ReactNode }) {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const ctx = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <SensoryPanelContext.Provider value={ctx}>
      <SkipLink />
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-borde bg-blanco px-4 py-3 sm:px-8">
          <Brand />
          <Button
            variant="secundaria"
            leftIcon={<SlidersHorizontal className="size-5" />}
            onClick={() => setOpen(true)}
          >
            {intl.formatMessage({ id: 'shell.como_me_siento' })}
          </Button>
        </header>
        <main id="contenido" tabIndex={-1} className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
          {children ?? <Outlet />}
        </main>
        <footer className="border-t-2 border-borde bg-blanco px-4 py-5 text-sm sm:px-8">
          <Link to="/privacidad" className="inline-flex min-h-tactil items-center gap-2 font-bold">
            <ShieldCheck aria-hidden className="size-5" />
            {intl.formatMessage({ id: 'publico.pie_privacidad' })}
          </Link>
        </footer>
      </div>
      <SensoryPanel open={open} onOpenChange={setOpen} />
    </SensoryPanelContext.Provider>
  );
}

/** Contenedor estrecho para formularios públicos (login, activar, recuperar). */
export function NarrowPage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-xl">{children}</div>;
}
