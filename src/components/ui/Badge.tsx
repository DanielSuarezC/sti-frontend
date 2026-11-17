import type { ReactNode } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { X } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { COLOR_CLASES, type ColorModulo } from '@/lib/pasos';

export interface BadgeProps {
  children: ReactNode;
  /** Color de módulo (con su texto legible) o `neutro` (blanco). */
  color?: ColorModulo | 'neutro';
  /** Ícono opcional a la izquierda; el texto siempre se muestra. */
  icon?: ReactNode;
  className?: string;
}

/** Etiqueta de estado corta. Siempre con texto. */
export function Badge({ children, color = 'neutro', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-borde px-3 py-0.5 text-sm font-bold',
        color === 'neutro' ? 'bg-blanco text-tinta' : COLOR_CLASES[color].solido,
        className,
      )}
    >
      {icon && (
        <span aria-hidden className="shrink-0 [&>svg]:size-4">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

export interface ChipProps {
  children: ReactNode;
  /** Si se pasa, el chip es un botón conmutable (filtro) con `aria-pressed`. */
  selected?: boolean;
  onClick?: () => void;
  /** Si se pasa, muestra una X para quitar el chip. */
  onRemove?: () => void;
  className?: string;
}

/** Chip: filtro conmutable (`onClick`+`selected`), etiqueta quitable (`onRemove`) o texto simple. */
export function Chip({ children, selected, onClick, onRemove, className }: ChipProps) {
  const intl = useIntl();
  const base =
    'inline-flex min-h-[36px] items-center gap-2 rounded-full border-2 border-borde px-3 py-1 text-sm font-bold';
  if (onClick) {
    return (
      <button
        type="button"
        aria-pressed={!!selected}
        onClick={onClick}
        className={cn(
          base,
          'min-h-tactil',
          selected ? 'bg-cobalto text-cobalto-on shadow-plano-sm' : 'bg-blanco text-tinta',
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return (
    <span className={cn(base, 'bg-blanco', className)}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={intl.formatMessage({ id: 'ui.quitar' })}
          className="-mr-1 inline-flex size-7 items-center justify-center rounded-full border-2 border-borde bg-papel"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </span>
  );
}

export interface ProgressProps {
  /** 0 a 100. */
  value: number;
  label: string;
  color?: ColorModulo;
  /** Texto del avance; por defecto "NN %". */
  valueText?: string;
  className?: string;
}

/** Barra de progreso con etiqueta y porcentaje en texto. */
export function Progress({ value, label, color = 'cobalto', valueText, className }: ProgressProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span>{valueText ?? `${v} %`}</span>
      </div>
      <ProgressPrimitive.Root
        value={v}
        aria-label={label}
        aria-valuetext={valueText ?? `${v} %`}
        className="h-5 overflow-hidden rounded-full border-2 border-borde bg-blanco"
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full border-r-2 border-borde',
            COLOR_CLASES[color].fondo,
            v === 0 && 'border-r-0',
          )}
          style={{ width: `${v}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
