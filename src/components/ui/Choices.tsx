import { useId, type ReactNode } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Check, CircleAlert } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Field, type FieldBaseProps } from './Field';

/* ------------------------------ Checkbox ------------------------------ */

export interface CheckboxProps {
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
}

/** Casilla con etiqueta clicable. Con react-hook-form: `<Controller render={({field}) => <Checkbox checked={field.value} onCheckedChange={field.onChange} .../>}/>`. */
export function Checkbox({
  label,
  help,
  error,
  onCheckedChange,
  className,
  id,
  ...rest
}: CheckboxProps) {
  const auto = useId();
  const baseId = id ?? `chk-${auto.replace(/:/g, '')}`;
  const helpId = help ? `${baseId}-ayuda` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const intl = useIntl();
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Root
          id={baseId}
          aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          onCheckedChange={(v) => onCheckedChange?.(v === true)}
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border-2 bg-blanco text-cobalto-on',
            error ? 'border-rojo' : 'border-borde',
            'data-[state=checked]:bg-cobalto data-[state=checked]:text-cobalto-on',
            'disabled:cursor-not-allowed disabled:border-dashed',
          )}
          {...rest}
        >
          <CheckboxPrimitive.Indicator>
            <Check aria-hidden className="size-5" strokeWidth={3.5} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <label htmlFor={baseId} className="min-h-7 cursor-pointer text-base">
          {label}
          {rest.required && (
            <span className="ml-2 rounded-full border-2 border-borde bg-limon-tinte px-2 text-xs">
              {intl.formatMessage({ id: 'ui.obligatorio' })}
            </span>
          )}
        </label>
      </div>
      {help && (
        <p id={helpId} className="ml-10 mt-1 text-sm text-tinta-suave">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="ml-10 mt-2 flex items-start gap-2 text-sm font-bold text-rojo">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="sr-only">{intl.formatMessage({ id: 'ui.error_prefijo' })} </span>
            {error}
          </span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------ RadioGroup ------------------------------ */

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<FieldBaseProps, 'label'> {
  /** Pregunta o título del grupo (se renderiza como <legend>). */
  legend: ReactNode;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  legend,
  help,
  error,
  required,
  hideLabel,
  className,
  options,
  orientation = 'vertical',
  ...root
}: RadioGroupProps) {
  return (
    <Field
      group
      label={legend}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={className}
    >
      {(c) => (
        <RadioPrimitive.Root
          aria-describedby={c['aria-describedby']}
          aria-invalid={c['aria-invalid']}
          aria-required={c['aria-required']}
          orientation={orientation}
          className={cn(
            'flex gap-3',
            orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          )}
          {...root}
        >
          {options.map((o) => {
            const id = `${c.id}-${o.value}`;
            return (
              <div key={o.value} className="flex items-start gap-3">
                <RadioPrimitive.Item
                  id={id}
                  value={o.value}
                  disabled={o.disabled}
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-borde bg-blanco disabled:border-dashed data-[state=checked]:bg-cobalto"
                >
                  <RadioPrimitive.Indicator>
                    <Check aria-hidden className="size-4 text-cobalto-on" strokeWidth={4} />
                  </RadioPrimitive.Indicator>
                </RadioPrimitive.Item>
                <label htmlFor={id} className="cursor-pointer">
                  <span className="block text-base">{o.label}</span>
                  {o.description && (
                    <span className="block text-sm text-tinta-suave">{o.description}</span>
                  )}
                </label>
              </div>
            );
          })}
        </RadioPrimitive.Root>
      )}
    </Field>
  );
}

/* ------------------------------ Switch ------------------------------ */

export interface SwitchProps {
  label: ReactNode;
  help?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

/** Interruptor con estado en TEXTO ("Activado"/"Desactivado"), no solo posición o color. */
export function Switch({
  label,
  help,
  className,
  id,
  checked,
  defaultChecked,
  ...rest
}: SwitchProps) {
  const intl = useIntl();
  const auto = useId();
  const baseId = id ?? `sw-${auto.replace(/:/g, '')}`;
  const helpId = help ? `${baseId}-ayuda` : undefined;
  // Mantiene el texto de estado sincronizado también en modo no controlado.
  const isControlled = checked !== undefined;
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label
          htmlFor={baseId}
          className="block cursor-pointer font-titulo text-base font-semibold"
        >
          {label}
        </label>
        {help && (
          <p id={helpId} className="mt-1 text-sm text-tinta-suave">
            {help}
          </p>
        )}
      </div>
      <SwitchPrimitive.Root
        id={baseId}
        aria-describedby={helpId}
        checked={checked}
        defaultChecked={defaultChecked}
        className="group flex min-h-tactil shrink-0 items-center gap-2 rounded-full border-2 border-borde bg-blanco px-1 py-1 pr-3 disabled:border-dashed data-[state=checked]:bg-cobalto-tinte"
        {...rest}
      >
        <span className="relative h-7 w-12 rounded-full border-2 border-borde bg-blanco group-data-[state=checked]:bg-cobalto">
          <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 translate-y-px rounded-full border-2 border-borde bg-blanco transition-transform duration-150 data-[state=checked]:translate-x-[22px]" />
        </span>
        <span className="min-w-[6.5ch] text-sm font-bold">
          {isControlled ? (
            checked ? (
              intl.formatMessage({ id: 'ui.activado' })
            ) : (
              intl.formatMessage({ id: 'ui.desactivado' })
            )
          ) : (
            <>
              <span className="hidden group-data-[state=checked]:inline">
                {intl.formatMessage({ id: 'ui.activado' })}
              </span>
              <span className="group-data-[state=checked]:hidden">
                {intl.formatMessage({ id: 'ui.desactivado' })}
              </span>
            </>
          )}
        </span>
      </SwitchPrimitive.Root>
    </div>
  );
}

/* ------------------------------ Slider ------------------------------ */

export interface SliderProps extends Omit<FieldBaseProps, 'hideLabel'> {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  /** Texto del valor actual ("3 de 5", "Mucho"). Por defecto, el número. */
  valueText?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

export function Slider({
  label,
  help,
  error,
  required,
  className,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  valueText,
  minLabel,
  maxLabel,
  disabled,
}: SliderProps) {
  const text = valueText ? valueText(value) : String(value);
  return (
    <Field label={label} help={help} error={error} required={required} className={className}>
      {(c) => (
        <div>
          <p className="mb-2 font-titulo text-lg font-semibold" aria-hidden>
            {text}
          </p>
          <SliderPrimitive.Root
            min={min}
            max={max}
            step={step}
            value={[value]}
            disabled={disabled}
            onValueChange={(v) => onValueChange(v[0] ?? min)}
            className="relative flex h-11 w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-3 grow rounded-full border-2 border-borde bg-blanco">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-cobalto" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              id={c.id}
              aria-labelledby={undefined}
              aria-label={typeof label === 'string' ? label : undefined}
              aria-valuetext={text}
              aria-describedby={c['aria-describedby']}
              className="block size-7 rounded-full border-2 border-borde bg-limon"
            />
          </SliderPrimitive.Root>
          {(minLabel || maxLabel) && (
            <div className="mt-1 flex justify-between text-sm text-tinta-suave">
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
