import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flag } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { buttonClasses } from './Button';

export interface NextStepBannerProps {
  /** Qué sigue, en una frase activa ("Completa tu perfil de fortalezas"). */
  title: ReactNode;
  /** Detalle opcional (tiempo estimado, quién ayuda). */
  description?: ReactNode;
  /** Texto del botón. Por defecto "Hacer ahora". */
  actionLabel?: string;
  /** Destino (ruta interna). Usa `href` O `onAction`. */
  href?: string;
  onAction?: () => void;
  className?: string;
}

/** Banner "Lo que sigue" (limón). Va SIEMPRE arriba de la pantalla, bajo el encabezado. */
export function NextStepBanner({
  title,
  description,
  actionLabel,
  href,
  onAction,
  className,
}: NextStepBannerProps) {
  const intl = useIntl();
  const headingId = useId();
  const label = actionLabel ?? intl.formatMessage({ id: 'ui.hacer_ahora' });
  const cls = buttonClasses('primaria', 'md');
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col gap-4 rounded-tarjeta border-2 border-borde bg-limon p-5 text-limon-on shadow-plano-tinta sm:flex-row sm:items-center sm:justify-between sm:p-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-control border-2 border-borde bg-blanco text-tinta"
        >
          <Flag className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="font-titulo text-base font-bold text-limon-on">
            {intl.formatMessage({ id: 'ui.lo_que_sigue' })}
          </h2>
          <p className="mt-0.5 font-titulo text-xl font-semibold">{title}</p>
          {description && <p className="mt-1 text-base">{description}</p>}
        </div>
      </div>
      {href ? (
        <Link to={href} className={cn(cls, 'shrink-0')}>
          {label}
          <ArrowRight aria-hidden className="size-5" />
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={cn(cls, 'shrink-0')}>
          {label}
          <ArrowRight aria-hidden className="size-5" />
        </button>
      )}
    </section>
  );
}
