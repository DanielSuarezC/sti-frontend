import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COLOR_CLASES, type ColorModulo } from '@/lib/pasos';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Color de la sombra plana (módulo). Por defecto tinta. */
  color?: ColorModulo | 'tinta';
  /** Fondo en el tinte claro del color (para bloques de sección). */
  tinted?: boolean;
  /** Etiqueta HTML. Por defecto `section`. */
  as?: ElementType;
  padding?: 'none' | 'md' | 'lg';
}

const SOMBRA_TINTA = 'shadow-plano-tinta';

/** Tarjeta: borde 2px tinta + sombra plana desplazada del color del módulo. */
export function Card({
  color = 'tinta',
  tinted,
  as: Tag = 'section',
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  const clases = color === 'tinta' ? null : COLOR_CLASES[color];
  return (
    <Tag
      className={cn(
        'rounded-tarjeta border-2 border-borde',
        tinted && clases ? clases.tinte : 'bg-blanco',
        clases ? clases.sombra : SOMBRA_TINTA,
        padding === 'md' && 'p-5 sm:p-6',
        padding === 'lg' && 'p-6 sm:p-8',
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({
  as: Tag = 'h2',
  className,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return <Tag className={cn('font-titulo text-xl font-semibold', className)} {...rest} />;
}

export interface LinkCardProps extends Omit<LinkProps, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  color?: ColorModulo;
}

/** Tarjeta-enlace de acceso (inicio de cada rol). Todo el bloque es un único enlace con texto. */
export function LinkCard({
  title,
  description,
  icon: Icon,
  color = 'cobalto',
  className,
  ...rest
}: LinkCardProps) {
  const c = COLOR_CLASES[color];
  return (
    <Link
      className={cn(
        'group flex items-start gap-4 rounded-tarjeta border-2 border-borde bg-blanco p-5 text-tinta no-underline',
        c.sombra,
        'transition-[transform,box-shadow] duration-150 hover:translate-x-px hover:translate-y-px hover:shadow-plano-sm active:translate-x-1 active:translate-y-1 active:shadow-none',
        className,
      )}
      {...rest}
    >
      {Icon && (
        <span
          aria-hidden
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-control border-2 border-borde',
            c.solido,
          )}
        >
          <Icon className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-titulo text-lg font-semibold">{title}</span>
        {description && <span className="mt-1 block text-sm text-tinta-suave">{description}</span>}
      </span>
      <ChevronRight aria-hidden className="mt-1 size-6 shrink-0" />
    </Link>
  );
}
