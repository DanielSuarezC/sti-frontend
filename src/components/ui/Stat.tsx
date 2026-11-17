import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COLOR_CLASES, type ColorModulo } from '@/lib/pasos';

export interface StatProps {
  /** Qué mide ("Estudiantes con plan activo"). */
  label: string;
  /** Cifra o texto corto ("12", "85 %"). */
  value: ReactNode;
  /** Aclaración opcional ("de 30 en el piloto"). */
  hint?: ReactNode;
  icon?: LucideIcon;
  color?: ColorModulo;
  className?: string;
}

/** Cifra con etiqueta. Se lee como "etiqueta, valor" (dl/dt/dd). */
export function Stat({ label, value, hint, icon: Icon, color = 'cobalto', className }: StatProps) {
  const c = COLOR_CLASES[color];
  return (
    <div className={cn('rounded-tarjeta border-2 border-borde bg-blanco p-5', c.sombra, className)}>
      <dl className="flex flex-col">
        <dt className="order-2 mt-1 flex items-center gap-2 text-base font-bold text-tinta-suave">
          {Icon && (
            <span
              aria-hidden
              className={cn(
                'flex size-8 items-center justify-center rounded-lg border-2 border-borde',
                c.solido,
              )}
            >
              <Icon className="size-4" />
            </span>
          )}
          {label}
        </dt>
        <dd className="order-1 font-titulo text-3xl font-bold">{value}</dd>
        {hint && <dd className="order-3 mt-1 text-sm text-tinta-suave">{hint}</dd>}
      </dl>
    </div>
  );
}
