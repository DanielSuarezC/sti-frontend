import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import type { EstadoSemaforo } from '@/lib/types';

/**
 * Semáforo accesible: cada estado tiene FORMA propia + símbolo + PALABRA (el color nunca va solo).
 *   VERDE    círculo con ✔       "Funciona"
 *   AMARILLO triángulo con !     "Revisar"
 *   ROJO     octágono con ×      "Rediseñar"
 */
export const SEMAFORO_ESTADOS: readonly EstadoSemaforo[] = ['VERDE', 'AMARILLO', 'ROJO'] as const;

const FONDO: Record<EstadoSemaforo, string> = {
  VERDE: 'bg-verde-tinte',
  AMARILLO: 'bg-amarillo-tinte',
  ROJO: 'bg-rojo-tinte',
};

/** Solo la forma (SVG, aria-hidden). Útil dentro de gráficos y tablas junto a su texto. */
export function SemaforoIcono({
  estado,
  size = 28,
  className,
}: {
  estado: EstadoSemaforo;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={cn('shrink-0', className)}
    >
      {estado === 'VERDE' && (
        <>
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="var(--verde)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          <path
            d="M9.5 16.5l4.5 4.5 8.5-9.5"
            fill="none"
            stroke="var(--blanco)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {estado === 'AMARILLO' && (
        <>
          <path
            d="M16 3.5L29.5 27.5H2.5L16 3.5z"
            fill="var(--amarillo-fondo)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M16 12v7" stroke="var(--tinta)" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="16" cy="23" r="1.9" fill="var(--tinta)" />
        </>
      )}
      {estado === 'ROJO' && (
        <>
          <path
            d="M11 2.5h10l8.5 8.5v10L21 29.5H11L2.5 21V11L11 2.5z"
            fill="var(--rojo)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 11.5l9 9M20.5 11.5l-9 9"
            stroke="var(--blanco)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export interface SemaforoProps {
  estado: EstadoSemaforo;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Píldora con forma + palabra ("Funciona", "Revisar", "Rediseñar"). */
export function Semaforo({ estado, size = 'md', className }: SemaforoProps) {
  const intl = useIntl();
  const word = intl.formatMessage({ id: `semaforo.${estado}` });
  const icon = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 border-borde py-1 pl-1.5 pr-3 font-bold text-tinta',
        FONDO[estado],
        size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
        className,
      )}
    >
      <SemaforoIcono estado={estado} size={icon} />
      <span>{word}</span>
    </span>
  );
}

/** Palabra del estado (para tablas alternativas). */
export function useSemaforoLabel() {
  const intl = useIntl();
  return (estado: EstadoSemaforo) => intl.formatMessage({ id: `semaforo.${estado}` });
}
