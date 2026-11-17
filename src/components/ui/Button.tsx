import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Hourglass, X } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primaria' | 'secundaria' | 'peligro' | 'fantasma';
export type ButtonSize = 'md' | 'lg';

const VARIANTES: Record<ButtonVariant, string> = {
  primaria: 'bg-cobalto text-cobalto-on shadow-plano-tinta',
  secundaria: 'bg-blanco text-tinta shadow-plano-tinta',
  peligro: 'bg-rojo text-blanco shadow-plano-tinta',
  fantasma: 'bg-transparent text-tinta shadow-none hover:bg-cobalto-tinte',
};

/** Clases base reutilizables (también para enlaces con aspecto de botón). */
export function buttonClasses(
  variant: ButtonVariant = 'primaria',
  size: ButtonSize = 'md',
  fullWidth = false,
) {
  return cn(
    'inline-flex min-h-tactil items-center justify-center gap-2 rounded-control border-2 border-borde px-5 py-2 text-center font-titulo font-semibold no-underline',
    'transition-[transform,box-shadow] duration-150',
    // Pulsar: la sombra plana se "hunde". Respuesta inmediata a la acción, sin movimiento automático.
    'hover:translate-x-px hover:translate-y-px hover:shadow-plano-sm',
    'active:translate-x-1 active:translate-y-1 active:shadow-none',
    'disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:border-dashed disabled:bg-blanco disabled:text-tinta-suave disabled:shadow-none',
    'aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-blanco aria-disabled:text-tinta-suave aria-disabled:shadow-none',
    size === 'lg' ? 'min-h-[52px] px-7 text-lg' : 'text-base',
    VARIANTES[variant],
    fullWidth && 'w-full',
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primaria (acción principal: una por pantalla) | secundaria | peligro (irreversible) | fantasma. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra estado "cargando" (ícono estático + texto), deshabilita y marca aria-busy. */
  loading?: boolean;
  /** Texto mientras carga. Por defecto "Guardando…" (i18n `ui.cargando_accion`). */
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primaria',
    size = 'md',
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const intl = useIntl();
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size, fullWidth), className)}
      {...rest}
    >
      {loading ? (
        <>
          <Hourglass aria-hidden className="size-5 shrink-0" />
          <span>{loadingText ?? intl.formatMessage({ id: 'ui.cargando_accion' })}</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span aria-hidden className="shrink-0">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span aria-hidden className="shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
});

/** Botón solo-ícono para cerrar (X). Siempre con texto visible del lector y `title`. */
export function CloseButton({
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex min-h-tactil min-w-tactil items-center justify-center rounded-control border-2 border-borde bg-blanco text-tinta hover:bg-limon-tinte',
        className,
      )}
      {...rest}
    >
      <X aria-hidden className="size-5" />
    </button>
  );
}
