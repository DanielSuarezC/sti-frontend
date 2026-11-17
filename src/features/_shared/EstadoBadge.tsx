import { Badge } from '@/components/ui';
import type { ColorModulo } from '@/lib/pasos';
import { useEnum } from '@/lib/useT';
import type { EstadoPlan } from './types';

const COLOR_PLAN: Record<EstadoPlan, ColorModulo | 'neutro'> = {
  BORRADOR: 'neutro',
  EN_CONCERTACION: 'fucsia',
  EN_NEGOCIACION: 'mandarina',
  ESCALADO_COMITE: 'mandarina',
  PENDIENTE_VALIDACION: 'limon',
  PENDIENTE_FIRMAS: 'cobalto',
  APROBADO: 'turquesa',
  IMPLEMENTACION: 'turquesa',
  SEGUIMIENTO: 'uva',
  FINALIZADO: 'neutro',
  ARCHIVADO: 'neutro',
};

/** Estado del plan con palabra (el color solo refuerza). */
export function EstadoPlanBadge({ estado }: { estado: EstadoPlan }) {
  const label = useEnum();
  return <Badge color={COLOR_PLAN[estado] ?? 'neutro'}>{label('estado_plan', estado)}</Badge>;
}

const COLOR_USUARIO: Record<string, ColorModulo | 'neutro'> = {
  ACTIVO: 'turquesa',
  PENDIENTE_ACTIVACION: 'limon',
  PENDIENTE_CONSENTIMIENTO: 'limon',
  INACTIVO: 'neutro',
  SUSPENDIDO: 'mandarina',
};

/** Estado de una cuenta de usuario. */
export function EstadoUsuarioBadge({ estado }: { estado: string }) {
  const label = useEnum();
  return <Badge color={COLOR_USUARIO[estado] ?? 'neutro'}>{label('estado_usuario', estado)}</Badge>;
}
