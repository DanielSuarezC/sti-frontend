import { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAnnounce } from '@/lib/announce';
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from '@/lib/notificaciones';

/** Campana con contador en TEXTO ("3 sin leer") y panel de avisos. Consulta cada 30 s. */
export function NotificationBell() {
  const intl = useIntl();
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useNotificaciones();
  const marcar = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();
  const noLeidas = data?.no_leidas ?? 0;

  // Anunciar a lectores de pantalla cuando llegan avisos nuevos.
  const previo = useRef<number | null>(null);
  useEffect(() => {
    if (data === undefined) return;
    if (previo.current !== null && data.no_leidas > previo.current) {
      announce(intl.formatMessage({ id: 'notif.anuncio_nueva' }, { n: data.no_leidas }));
    }
    previo.current = data.no_leidas;
  }, [data, announce, intl]);

  const nombreBoton =
    noLeidas > 0
      ? intl.formatMessage({ id: 'notif.boton_con_sin_leer' }, { n: noLeidas })
      : intl.formatMessage({ id: 'notif.boton' });

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={nombreBoton}
          className="relative inline-flex min-h-tactil items-center gap-2 rounded-control border-2 border-borde bg-blanco px-3 font-titulo text-base font-semibold"
        >
          <Bell aria-hidden className="size-5" />
          <span className="hidden sm:inline">
            {intl.formatMessage({ id: 'notif.titulo_corto' })}
          </span>
          {noLeidas > 0 && (
            <span
              aria-hidden
              className="inline-flex min-w-7 items-center justify-center rounded-full border-2 border-borde bg-limon px-1.5 text-sm font-bold text-limon-on"
            >
              {noLeidas > 99 ? '99+' : noLeidas}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          aria-label={intl.formatMessage({ id: 'notif.titulo' })}
          className="z-50 max-h-[80vh] w-[min(26rem,calc(100vw-1.5rem))] overflow-y-auto rounded-tarjeta border-2 border-borde bg-blanco shadow-plano-tinta"
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-borde p-4">
            <h2 className="text-lg">{intl.formatMessage({ id: 'notif.titulo' })}</h2>
            <Button
              variant="secundaria"
              disabled={noLeidas === 0}
              loading={marcarTodas.isPending}
              leftIcon={<CheckCheck className="size-5" />}
              onClick={() => marcarTodas.mutate()}
              className="px-3 text-sm"
            >
              {intl.formatMessage({ id: 'notif.marcar_todas' })}
            </Button>
          </div>
          <div className="p-4">
            {isPending ? (
              <LoadingState rows={2} />
            ) : isError ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={BellOff}
                title={intl.formatMessage({ id: 'notif.vacio_titulo' })}
                description={intl.formatMessage({ id: 'notif.vacio_desc' })}
              />
            ) : (
              <ul role="list" className="space-y-3">
                {data.items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      'rounded-control border-2 border-borde p-3',
                      n.leida ? 'bg-blanco' : 'bg-limon-tinte',
                    )}
                  >
                    <p className="font-titulo text-base font-semibold">
                      {!n.leida && (
                        <span className="mr-2 rounded-full border-2 border-borde bg-limon px-2 text-xs font-bold text-limon-on">
                          {intl.formatMessage({ id: 'notif.nueva' })}
                        </span>
                      )}
                      {n.titulo}
                    </p>
                    <p className="mt-1 text-sm">{n.mensaje}</p>
                    <p className="mt-1 text-xs text-tinta-suave">
                      {intl.formatDate(n.created_at, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {n.enlace && (
                        <Link
                          to={n.enlace}
                          onClick={() => {
                            if (!n.leida) marcar.mutate(n.id);
                            setOpen(false);
                          }}
                          className="inline-flex min-h-tactil items-center rounded-control border-2 border-borde bg-cobalto px-3 text-sm font-bold text-cobalto-on no-underline"
                        >
                          {intl.formatMessage({ id: 'notif.ver' })}
                        </Link>
                      )}
                      {!n.leida && (
                        <Button
                          variant="secundaria"
                          onClick={() => marcar.mutate(n.id)}
                          className="px-3 text-sm"
                        >
                          {intl.formatMessage({ id: 'notif.marcar_leida' })}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
