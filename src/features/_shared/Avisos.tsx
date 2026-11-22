import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { BellOff, CheckCheck } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  useMarcarLeida,
  useMarcarTodasLeidas,
  useNotificaciones,
} from '@/lib/notificaciones';

export default function AvisosPage() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');
  const { data, isPending, isError, error, refetch } = useNotificaciones();
  const marcar = useMarcarLeida();
  const marcarTodas = useMarcarTodasLeidas();

  const noLeidas = data?.no_leidas ?? 0;
  const items = data?.items ?? [];
  const itemsFiltrados =
    filtro === 'no_leidas' ? items.filter((n) => !n.leida) : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('notif.titulo')}
          description={
            noLeidas > 0
              ? t('notif.anuncio_nueva', { n: noLeidas })
              : t('notif.vacio_desc')
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secundaria"
            disabled={noLeidas === 0}
            loading={marcarTodas.isPending}
            leftIcon={<CheckCheck className="size-4" />}
            onClick={() => marcarTodas.mutate()}
          >
            {t('notif.marcar_todas')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b-2 border-borde pb-2">
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          className={cn(
            'rounded-control px-4 py-2 text-sm font-bold transition-colors',
            filtro === 'todas'
              ? 'bg-cobalto text-blanco'
              : 'bg-fondo-suave text-tinta hover:bg-papel',
          )}
        >
          {t('comun.todos')} ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltro('no_leidas')}
          className={cn(
            'rounded-control px-4 py-2 text-sm font-bold transition-colors',
            filtro === 'no_leidas'
              ? 'bg-cobalto text-blanco'
              : 'bg-fondo-suave text-tinta hover:bg-papel',
          )}
        >
          {t('notif.boton_con_sin_leer', { n: noLeidas })}
        </button>
      </div>

      {isPending ? (
        <LoadingState rows={3} label={t('comun.cargando')} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : itemsFiltrados.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t('notif.vacio_titulo')}
          description={t('notif.vacio_desc')}
        />
      ) : (
        <ul role="list" className="space-y-4">
          {itemsFiltrados.map((n) => (
            <Card
              as="li"
              key={n.id}
              className={cn(
                'p-4 transition-colors',
                n.leida ? 'bg-blanco' : 'border-l-4 border-l-cobalto bg-cobalto-tinte/30',
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {!n.leida && (
                      <span className="rounded-full border-2 border-borde bg-limon px-2 text-xs font-bold text-limon-on">
                        {t('notif.nueva')}
                      </span>
                    )}
                    <h3 className="font-titulo text-base font-bold">{n.titulo}</h3>
                  </div>
                  <p className="mt-1 text-sm text-tinta">{n.mensaje}</p>
                  <p className="mt-2 text-xs text-tinta-suave">
                    {intl.formatDate(n.created_at, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  {n.enlace && (
                    <Link
                      to={n.enlace}
                      onClick={() => {
                        if (!n.leida) marcar.mutate(n.id);
                      }}
                      className="inline-flex min-h-tactil items-center rounded-control border-2 border-borde bg-cobalto px-3 text-sm font-bold text-cobalto-on no-underline hover:bg-cobalto-oscuro"
                    >
                      {t('notif.ver')}
                    </Link>
                  )}
                  {!n.leida && (
                    <Button
                      variant="fantasma"
                      onClick={() => marcar.mutate(n.id)}
                      className="text-xs"
                    >
                      {t('notif.marcar_leida')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
