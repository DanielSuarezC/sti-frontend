import { Link } from 'react-router-dom';
import { Lock, SlidersHorizontal } from 'lucide-react';
import { useIntl } from 'react-intl';
import { Card, EmptyState, LinkCard, PageShell, type NextStepBannerProps } from '@/components/ui';
import { useSensoryPanel } from '@/app/shell/SensoryPanel';
import { NAV, ROL_LABEL_ID } from '@/app/nav';
import { COLOR_CLASES } from '@/lib/pasos';
import { useAuth } from '@/lib/auth';
import type { Rol } from '@/lib/types';
import { cn } from '@/lib/cn';

export interface RoleHomeProps {
  rol: Rol;
  /** "Lo que sigue" real del rol. Si se omite, se muestra la sugerencia de ajustar el sistema. */
  nextStep?: NextStepBannerProps;
}

/**
 * Inicio genérico de un rol: saludo, "Lo que sigue" y tarjetas de acceso generadas desde `app/nav.ts`.
 * Los agentes de cada rol pueden reemplazarlo en su `routes.tsx` o pasarle `nextStep` y contenido propio.
 */
export function RoleHome({ rol, nextStep }: RoleHomeProps) {
  const intl = useIntl();
  const t = (id: string, v?: Record<string, string>) => intl.formatMessage({ id }, v);
  const { user } = useAuth();
  const panel = useSensoryPanel();
  const accesos = NAV[rol].filter((i) => !i.end);
  const primerNombre = user?.nombre_completo.split(' ')[0] ?? '';

  return (
    <PageShell
      title={t('inicio.saludo', { nombre: primerNombre })}
      documentTitle={t('nav.inicio')}
      description={t(`inicio.${rol.toLowerCase()}.descripcion`)}
      nextStep={
        nextStep ?? {
          title: t('inicio.siguiente_titulo'),
          description: t('inicio.siguiente_desc'),
          actionLabel: t('inicio.siguiente_accion'),
          onAction: panel.open,
        }
      }
      contentCard={false}
    >
      <h2 className="mb-4">{t('inicio.accesos')}</h2>
      <ul role="list" className="grid gap-5 md:grid-cols-2">
        {accesos.map((i) => (
          <li key={i.to}>
            <LinkCard
              to={i.to}
              title={t(i.labelId)}
              description={i.descId ? t(i.descId) : undefined}
              icon={i.icon}
              color={i.color ?? 'cobalto'}
            />
          </li>
        ))}
        <li>
          <Card as="div" color="limon" padding="none" className="h-full">
            <button
              type="button"
              onClick={panel.open}
              className="flex size-full items-start gap-4 rounded-tarjeta p-5 text-left"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-control border-2 border-borde',
                  COLOR_CLASES.limon.solido,
                )}
              >
                <SlidersHorizontal className="size-6" />
              </span>
              <span>
                <span className="block font-titulo text-lg font-semibold">
                  {t('shell.como_me_siento')}
                </span>
                <span className="mt-1 block text-sm text-tinta-suave">
                  {t('inicio.card_sensorial_desc')}
                </span>
              </span>
            </button>
          </Card>
        </li>
        <li>
          <Card as="div" color="turquesa" padding="none" className="h-full">
            <Link
              to="/privacidad"
              className="flex size-full items-start gap-4 rounded-tarjeta p-5 text-tinta no-underline"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-control border-2 border-borde',
                  COLOR_CLASES.turquesa.solido,
                )}
              >
                <Lock className="size-6" />
              </span>
              <span>
                <span className="block font-titulo text-lg font-semibold">
                  {t('publico.pie_privacidad')}
                </span>
                <span className="mt-1 block text-sm text-tinta-suave">
                  {t('inicio.card_privacidad_desc')}
                </span>
              </span>
            </Link>
          </Card>
        </li>
      </ul>
      {accesos.length === 0 && (
        <EmptyState
          title={t('inicio.sin_accesos_titulo')}
          description={t('inicio.sin_accesos_desc', { rol: t(ROL_LABEL_ID[rol]).toLowerCase() })}
          icon={Lock}
          className="mt-6"
        />
      )}
    </PageShell>
  );
}
