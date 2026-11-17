import type { ReactNode } from 'react';
import { CircleAlert, Hourglass, Inbox, type LucideIcon } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { ApiError, getErrorMessage } from '@/lib/api';
import { Button } from './Button';

interface StateBoxProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone: string;
  role?: 'status' | 'alert';
  className?: string;
}

function StateBox({
  icon: Icon,
  title,
  description,
  action,
  tone,
  role,
  className,
}: StateBoxProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center gap-3 rounded-tarjeta border-2 border-dashed border-borde p-8 text-center',
        tone,
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full border-2 border-borde bg-blanco"
      >
        <Icon className="size-7" />
      </span>
      <p className="font-titulo text-xl font-semibold">{title}</p>
      {description && <p className="max-w-medida text-base">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface EmptyStateProps {
  title: ReactNode;
  /** Explica por qué está vacío y qué puede hacer la persona. */
  description?: ReactNode;
  icon?: LucideIcon;
  /** Botón o enlace para salir del vacío ("Crear primer ajuste"). */
  action?: ReactNode;
  className?: string;
}

/** Nada que mostrar todavía. Siempre dice qué hacer a continuación. */
export function EmptyState({
  title,
  description,
  icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <StateBox
      icon={icon}
      title={title}
      description={description}
      action={action}
      tone="bg-blanco"
      className={className}
    />
  );
}

export interface ErrorStateProps {
  /** Error capturado (ApiError) o texto. Se traduce a mensaje claro automáticamente. */
  error?: unknown;
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}

/** Algo falló: qué pasó + cómo arreglarlo + botón Reintentar. */
export function ErrorState({ error, title, description, onRetry, className }: ErrorStateProps) {
  const intl = useIntl();
  const detalle =
    description ??
    (error instanceof ApiError || error instanceof Error
      ? getErrorMessage(error, intl)
      : error
        ? String(error)
        : undefined);
  return (
    <StateBox
      role="alert"
      icon={CircleAlert}
      tone="bg-rojo-tinte"
      title={title ?? intl.formatMessage({ id: 'ui.error_titulo' })}
      description={detalle}
      action={
        onRetry && <Button onClick={onRetry}>{intl.formatMessage({ id: 'ui.reintentar' })}</Button>
      }
      className={className}
    />
  );
}

export interface LoadingStateProps {
  label?: string;
  /** Bloques de relleno estáticos que anticipan el contenido (sin parpadeo ni animación). */
  rows?: number;
  className?: string;
}

/** Cargando: texto + ícono + bloques estáticos. Sin giros ni brillos. */
export function LoadingState({ label, rows = 3, className }: LoadingStateProps) {
  const intl = useIntl();
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('rounded-tarjeta border-2 border-borde bg-blanco p-6', className)}
    >
      <p className="mb-4 flex items-center gap-2 font-titulo text-lg font-semibold">
        <Hourglass aria-hidden className="size-5" />
        {label ?? intl.formatMessage({ id: 'ui.cargando' })}
      </p>
      <div aria-hidden className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-5 rounded-full border-2 border-dashed border-borde bg-papel"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
