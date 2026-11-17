import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Field, controlClasses, type FieldBaseProps } from './Field';

/* Todos aceptan `ref` y los atributos nativos, así que funcionan con `register()` de react-hook-form. */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>, FieldBaseProps {
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, help, error, required, hideLabel, className, id, ...rest },
  ref,
) {
  return (
    <Field
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      id={id}
      className={className}
    >
      {(c) => (
        <input
          ref={ref}
          {...c}
          required={required}
          aria-required={required || undefined}
          className={controlClasses(!!error)}
          {...rest}
        />
      )}
    </Field>
  );
});

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>, FieldBaseProps {
  id?: string;
  /** Muestra "120 de 500 caracteres" si hay `maxLength`. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    help,
    error,
    required,
    hideLabel,
    className,
    id,
    showCount,
    rows = 4,
    maxLength,
    onChange,
    defaultValue,
    value,
    ...rest
  },
  ref,
) {
  const intl = useIntl();
  const [len, setLen] = useState(String(value ?? defaultValue ?? '').length);
  const current = value !== undefined ? String(value).length : len;
  return (
    <Field
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      id={id}
      className={className}
    >
      {(c) => (
        <>
          <textarea
            ref={ref}
            {...c}
            rows={rows}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              setLen(e.target.value.length);
              onChange?.(e);
            }}
            className={cn(controlClasses(!!error), 'resize-y leading-relaxed')}
            {...rest}
          />
          {showCount && maxLength ? (
            <p className="mt-1 text-right text-sm text-tinta-suave">
              {intl.formatMessage({ id: 'ui.caracteres' }, { actual: current, max: maxLength })}
            </p>
          ) : null}
        </>
      )}
    </Field>
  );
});

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>, FieldBaseProps {
  id?: string;
  /** Opción inicial vacía ("Elige una opción"). */
  placeholder?: string;
}

/** Select nativo con estilo del sistema (teclado, móvil y lectores de pantalla funcionan de fábrica). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, help, error, required, hideLabel, className, id, placeholder, children, ...rest },
  ref,
) {
  return (
    <Field
      label={label}
      help={help}
      error={error}
      required={required}
      hideLabel={hideLabel}
      id={id}
      className={className}
    >
      {(c) => (
        <div className="relative">
          <select
            ref={ref}
            {...c}
            required={required}
            className={cn(controlClasses(!!error), 'appearance-none pr-12')}
            {...rest}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {children}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2"
          />
        </div>
      )}
    </Field>
  );
});
