import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Una frase que explica qué se hace aquí. Se anuncia al abrir. */
  description?: ReactNode;
  children?: ReactNode;
  /** Pie con acciones. Acción principal a la DERECHA. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ANCHOS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

/**
 * Modal accesible (Radix): atrapa el foco, Esc cierra, devuelve el foco al botón que lo abrió.
 * Se controla SIEMPRE por una acción del usuario; nunca se abre solo.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogProps) {
  const intl = useIntl();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="velo fixed inset-0 z-40" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-tarjeta border-2 border-borde bg-blanco shadow-plano-tinta',
            ANCHOS[size],
            className,
          )}
          aria-describedby={description ? undefined : undefined}
        >
          <div className="flex items-start justify-between gap-4 border-b-2 border-borde p-5">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-titulo text-xl font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-base text-tinta-suave">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="secundaria"
                leftIcon={<X className="size-5" />}
                className="shrink-0 px-3"
              >
                {intl.formatMessage({ id: 'ui.cerrar' })}
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-borde p-5">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Qué va a pasar exactamente y si se puede deshacer. */
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `peligro` para acciones irreversibles. */
  variant?: 'primaria' | 'peligro';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

/** Confirmación para acciones importantes. Cancelar a la izquierda, confirmar a la derecha. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'primaria',
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const intl = useIntl();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secundaria" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? intl.formatMessage({ id: 'ui.cancelar' })}
          </Button>
          <Button variant={variant} loading={loading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
