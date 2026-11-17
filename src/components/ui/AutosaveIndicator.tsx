import { CircleAlert, CircleCheck, Hourglass, Save } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  /** Momento del último guardado correcto. */
  savedAt?: Date | string | number | null;
  /** Si se pasa, el estado de error muestra "Reintentar". */
  onRetry?: () => void;
  className?: string;
}

/** "Guardado a las 14:32". Región `status` para que los lectores de pantalla lo anuncien. */
export function AutosaveIndicator({ status, savedAt, onRetry, className }: AutosaveIndicatorProps) {
  const intl = useIntl();
  let icon = <Save aria-hidden className="size-5" />;
  let text = intl.formatMessage({ id: 'autosave.idle' });
  if (status === 'saving') {
    icon = <Hourglass aria-hidden className="size-5" />;
    text = intl.formatMessage({ id: 'autosave.guardando' });
  } else if (status === 'saved') {
    icon = <CircleCheck aria-hidden className="size-5 text-verde" />;
    text = savedAt
      ? intl.formatMessage(
          { id: 'autosave.guardado_a_las' },
          { hora: intl.formatTime(savedAt, { hour: '2-digit', minute: '2-digit', hour12: false }) },
        )
      : intl.formatMessage({ id: 'autosave.guardado' });
  } else if (status === 'error') {
    icon = <CircleAlert aria-hidden className="size-5 text-rojo" />;
    text = intl.formatMessage({ id: 'autosave.error' });
  }
  return (
    <div
      role="status"
      className={cn('inline-flex flex-wrap items-center gap-2 text-sm font-bold', className)}
    >
      {icon}
      <span>{text}</span>
      {status === 'error' && onRetry && (
        <Button variant="secundaria" onClick={onRetry} className="min-h-tactil px-3 py-1 text-sm">
          {intl.formatMessage({ id: 'ui.reintentar' })}
        </Button>
      )}
    </div>
  );
}
