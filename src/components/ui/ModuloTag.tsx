import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { COLOR_CLASES, MODULOS, PASOS, getPaso, type ModuloId } from '@/lib/pasos';

export type ModuloTagProps = { className?: string; size?: 'sm' | 'md' } & (
  { modulo: ModuloId; paso?: never } | { paso: number; modulo?: never }
);

/**
 * Etiqueta de módulo MAAR-TEA: color + ícono + nombre (fijos en toda la app).
 *   <ModuloTag modulo="barreras" />   -> "Barreras y facilitadores"
 *   <ModuloTag paso={3} />            -> "Paso 3 · Comprender el contexto"
 */
export function ModuloTag(props: ModuloTagProps) {
  const intl = useIntl();
  const { className, size = 'md' } = props;
  const paso = props.paso !== undefined ? getPaso(props.paso) : null;
  const info = MODULOS[paso ? paso.modulo : (props.modulo as ModuloId)];
  const Icon = paso ? paso.icon : info.icon;
  const text = paso
    ? intl.formatMessage(
        { id: 'ui.paso_nombre' },
        { n: paso.n, nombre: intl.formatMessage({ id: `paso.${paso.n}.nombre` }) },
      )
    : intl.formatMessage({ id: `modulo.${info.id}` });
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 border-borde font-bold',
        COLOR_CLASES[info.color].solido,
        size === 'sm' ? 'px-2.5 py-0.5 text-sm' : 'px-3 py-1 text-base',
        className,
      )}
    >
      <Icon aria-hidden className={size === 'sm' ? 'size-4' : 'size-5'} />
      {text}
    </span>
  );
}

/** Leyenda con todos los módulos (para MiRuta u otros mapas). */
export function ModuloLegend({ className }: { className?: string }) {
  const orden = Array.from(new Set(PASOS.map((p) => p.modulo)));
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {orden.map((m) => (
        <li key={m}>
          <ModuloTag modulo={m} size="sm" />
        </li>
      ))}
    </ul>
  );
}
