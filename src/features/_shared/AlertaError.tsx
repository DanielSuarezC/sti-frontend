import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tono = 'error' | 'exito' | 'aviso' | 'info';

const TONOS: Record<Tono, { cls: string; icon: typeof Info; role: 'alert' | 'status' }> = {
  error: { cls: 'bg-rojo-tinte', icon: CircleAlert, role: 'alert' },
  exito: { cls: 'bg-verde-tinte', icon: CircleCheck, role: 'status' },
  aviso: { cls: 'bg-amarillo-tinte', icon: TriangleAlert, role: 'status' },
  info: { cls: 'bg-cobalto-tinte', icon: Info, role: 'status' },
};

/** Caja de mensaje en línea (error de formulario, aviso, éxito). Ícono + texto: el color nunca va solo. */
export function Aviso({
  tono = 'error',
  children,
  className,
}: {
  tono?: Tono;
  children: ReactNode;
  className?: string;
}) {
  const t = TONOS[tono];
  const Icon = t.icon;
  return (
    <div
      role={t.role}
      className={cn('flex items-start gap-3 rounded-control border-2 border-borde p-4', t.cls, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1 text-base">{children}</div>
    </div>
  );
}
