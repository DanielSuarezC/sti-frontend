import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { CloseButton } from './Button';

export type ToastVariant = 'info' | 'exito' | 'aviso' | 'error';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milisegundos hasta descartarse. Mínimo 8000 (se fuerza). `null` = no se descarta solo. Por defecto 10000. */
  duration?: number | null;
}

interface ToastItem extends ToastOptions {
  id: number;
}

/** Tiempo mínimo en pantalla: nunca descartar antes de 8 s (usuarios que leen despacio). */
export const MIN_TOAST_MS = 8000;

const ESTILOS: Record<ToastVariant, { icon: LucideIcon; clases: string }> = {
  info: { icon: Info, clases: 'bg-cobalto-tinte' },
  exito: { icon: CircleCheck, clases: 'bg-verde-tinte' },
  aviso: { icon: TriangleAlert, clases: 'bg-amarillo-tinte' },
  error: { icon: CircleAlert, clases: 'bg-rojo-tinte' },
};

const ToastContext = createContext<{
  toast: (o: ToastOptions) => number;
  dismiss: (id: number) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback((o: ToastOptions) => {
    const id = ++counter.current;
    setItems((l) => [...l.slice(-3), { ...o, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const intl = useIntl();
  return (
    <div
      role="region"
      aria-label={intl.formatMessage({ id: 'ui.avisos' })}
      className="pointer-events-none fixed bottom-24 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 lg:bottom-6 lg:right-6"
    >
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const intl = useIntl();
  const variant = item.variant ?? 'info';
  const { icon: Icon, clases } = ESTILOS[variant];
  const duration = item.duration === undefined ? 10_000 : item.duration;

  useEffect(() => {
    if (duration === null) return;
    const id = setTimeout(() => onDismiss(item.id), Math.max(MIN_TOAST_MS, duration));
    return () => clearTimeout(id);
  }, [duration, item.id, onDismiss]);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-tarjeta border-2 border-borde p-4 shadow-plano-tinta',
        clases,
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-titulo text-base font-semibold">{item.title}</p>
        {item.description && <p className="mt-1 text-sm">{item.description}</p>}
      </div>
      <CloseButton
        label={intl.formatMessage({ id: 'ui.cerrar_aviso' })}
        onClick={() => onDismiss(item.id)}
      />
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
