import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';

/** Atributos que `Field` entrega al control para enlazar etiqueta, ayuda y error. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

export interface FieldBaseProps {
  /** Etiqueta visible (siempre visible; nunca solo placeholder). */
  label: ReactNode;
  /** Ayuda corta bajo la etiqueta ("Usa tu correo institucional"). */
  help?: ReactNode;
  /** Mensaje de error: qué pasó + cómo arreglarlo. Si existe, el campo queda inválido. */
  error?: ReactNode;
  required?: boolean;
  /** Oculta la etiqueta visualmente (sigue disponible para lectores). Úsalo solo si el contexto ya la muestra. */
  hideLabel?: boolean;
  className?: string;
}

interface FieldProps extends FieldBaseProps {
  id?: string;
  children: (control: FieldControlProps) => ReactNode;
  /** Usa <fieldset>/<legend> en vez de <label> (grupos de radios). */
  group?: boolean;
}

/**
 * Envoltorio accesible: etiqueta + ayuda + error con ids enlazados.
 * Los componentes Input/Textarea/Select ya lo usan; úsalo directo para controles propios.
 */
export function Field({
  label,
  help,
  error,
  required,
  hideLabel,
  className,
  id,
  children,
  group,
}: FieldProps) {
  const intl = useIntl();
  const auto = useId();
  const baseId = id ?? `campo-${auto.replace(/:/g, '')}`;
  const helpId = help ? `${baseId}-ayuda` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const control: FieldControlProps = {
    id: baseId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
  };

  const labelContent = (
    <>
      {label}
      {required && (
        <span className="ml-2 rounded-full border-2 border-borde bg-limon-tinte px-2 text-xs font-normal">
          {intl.formatMessage({ id: 'ui.obligatorio' })}
        </span>
      )}
    </>
  );
  const labelClass = cn('block font-titulo text-base font-semibold', hideLabel && 'sr-only');

  const body = (
    <>
      {help && (
        <p id={helpId} className="mt-1 text-sm text-tinta-suave">
          {help}
        </p>
      )}
      <div className="mt-2">{children(control)}</div>
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-sm font-bold text-rojo">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="sr-only">{intl.formatMessage({ id: 'ui.error_prefijo' })} </span>
            {error}
          </span>
        </p>
      )}
    </>
  );

  if (group) {
    return (
      <fieldset className={cn('min-w-0', className)} aria-describedby={describedBy}>
        <legend className={labelClass}>{labelContent}</legend>
        {body}
      </fieldset>
    );
  }
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={baseId} className={labelClass}>
        {labelContent}
      </label>
      {body}
    </div>
  );
}

/** Clases comunes de los controles de texto (borde 2px, radio 12, alto táctil). */
export const controlClasses = (invalid?: boolean) =>
  cn(
    'min-h-tactil w-full rounded-control border-2 bg-blanco px-4 py-2 text-base text-tinta',
    'placeholder:text-tinta-suave disabled:cursor-not-allowed disabled:border-dashed disabled:bg-papel disabled:text-tinta-suave',
    invalid ? 'border-rojo' : 'border-borde',
  );
