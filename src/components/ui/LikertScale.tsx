import type { ReactNode } from 'react';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { Check } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Field, type FieldBaseProps } from './Field';

export interface LikertOption {
  value: string;
  label: string;
}

/** Valores por defecto del AQ-10 (4 opciones). El backend define la puntuación; aquí solo se elige. */
export const AQ10_VALUES = [
  'totalmente_acuerdo',
  'ligeramente_acuerdo',
  'ligeramente_desacuerdo',
  'totalmente_desacuerdo',
] as const;

export interface LikertScaleProps extends Omit<FieldBaseProps, 'label' | 'hideLabel'> {
  /** Enunciado de la pregunta. */
  legend: ReactNode;
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** Opciones. Por defecto las 4 del AQ-10 (de acuerdo / en desacuerdo, ligeramente / totalmente). */
  options?: LikertOption[];
  name?: string;
  disabled?: boolean;
}

/**
 * Escala de 4 opciones (AQ-10). Teclado: flechas para moverse, espacio para elegir.
 * La opción elegida se marca con relleno + ✔ + borde grueso (no solo color).
 */
export function LikertScale({
  legend,
  value,
  onChange,
  options,
  name,
  disabled,
  help,
  error,
  required,
  className,
}: LikertScaleProps) {
  const intl = useIntl();
  const opts: LikertOption[] =
    options ??
    AQ10_VALUES.map((v) => ({ value: v, label: intl.formatMessage({ id: `likert.${v}` }) }));
  return (
    <Field group label={legend} help={help} error={error} required={required} className={className}>
      {(c) => (
        <RadioPrimitive.Root
          value={value ?? ''}
          onValueChange={onChange}
          name={name}
          disabled={disabled}
          aria-describedby={c['aria-describedby']}
          aria-invalid={c['aria-invalid']}
          aria-required={c['aria-required']}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {opts.map((o) => {
            const checked = value === o.value;
            return (
              <RadioPrimitive.Item
                key={o.value}
                value={o.value}
                className={cn(
                  'flex min-h-[56px] items-center gap-3 rounded-control border-2 border-borde px-4 py-3 text-left text-base',
                  checked
                    ? 'bg-cobalto text-cobalto-on shadow-plano-tinta'
                    : 'bg-blanco text-tinta',
                  'disabled:cursor-not-allowed disabled:border-dashed',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                    checked
                      ? 'border-cobalto-on bg-cobalto-on text-cobalto'
                      : 'border-borde bg-blanco',
                  )}
                >
                  {checked && <Check className="size-4" strokeWidth={4} />}
                </span>
                <span className={cn(checked && 'font-bold')}>{o.label}</span>
              </RadioPrimitive.Item>
            );
          })}
        </RadioPrimitive.Root>
      )}
    </Field>
  );
}
