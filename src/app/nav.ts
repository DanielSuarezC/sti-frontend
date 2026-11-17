/**
 * MENÚ POR ROL — único lugar donde se definen los ítems de navegación.
 *
 * El riel lateral (escritorio), la barra inferior (móvil) y las tarjetas de acceso del Inicio de cada rol
 * se generan desde aquí. Para añadir una pantalla:
 *   1. Registra su ruta en `features/<rol>/routes.tsx`.
 *   2. Añade UN ítem al arreglo de su rol (el primero siempre es "Inicio").
 *   3. Añade los textos `nav.<clave>` (y opcionalmente `nav.<clave>.desc`) en `locales/es-CO.json`.
 *
 * Reglas (DESIGN.md): todo ítem lleva ícono + texto; el orden debe ser estable entre sesiones;
 * máximo ~8 ítems por rol (la barra móvil muestra los 4 primeros y agrupa el resto en "Menú").
 */
import {
  Activity,
  BookOpen,
  Calendar,
  CalendarX,
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  House,
  Layers,
  Map,
  MessagesSquare,
  Shield,
  ShieldAlert,
  Smile,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ColorModulo } from '@/lib/pasos';
import type { Rol } from '@/lib/types';

export interface NavItem {
  /** Ruta absoluta (p. ej. `/estudiante/mi-ruta`). */
  to: string;
  /** Id de mensaje con el nombre del ítem (`nav.estudiante.inicio`). */
  labelId: string;
  /** Id de mensaje con una frase de qué hay allí (se usa en las tarjetas de acceso del Inicio). */
  descId?: string;
  icon: LucideIcon;
  /** Color de módulo de la tarjeta de acceso. */
  color?: ColorModulo;
  /** `true` solo para el Inicio (evita que quede activo en todas las rutas hijas). */
  end?: boolean;
}

export const NAV: Record<Rol, NavItem[]> = {
  ESTUDIANTE: [
    { to: '/estudiante', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/estudiante/mi-ruta',
      labelId: 'nav.estudiante.mi_ruta',
      descId: 'nav.estudiante.mi_ruta.desc',
      icon: Map,
      color: 'cobalto',
    },
    {
      to: '/estudiante/plan',
      labelId: 'nav.estudiante.plan',
      descId: 'nav.estudiante.plan.desc',
      icon: FileText,
      color: 'turquesa',
    },
    {
      to: '/estudiante/perfil',
      labelId: 'nav.estudiante.perfil',
      descId: 'nav.estudiante.perfil.desc',
      icon: Smile,
      color: 'uva',
    },
    {
      to: '/estudiante/aq10',
      labelId: 'nav.estudiante.aq10',
      descId: 'nav.estudiante.aq10.desc',
      icon: UserCheck,
      color: 'limon',
    },
    {
      to: '/estudiante/seguimiento',
      labelId: 'nav.estudiante.seguimiento',
      descId: 'nav.estudiante.seguimiento.desc',
      icon: TrendingUp,
      color: 'cobalto',
    },
    {
      to: '/estudiante/familiares',
      labelId: 'nav.estudiante.familiares',
      descId: 'nav.estudiante.familiares.desc',
      icon: HeartHandshake,
      color: 'fucsia',
    },
    {
      to: '/estudiante/derechos',
      labelId: 'nav.estudiante.derechos',
      descId: 'nav.estudiante.derechos.desc',
      icon: Shield,
      color: 'mandarina',
    },
  ],
  BIENESTAR: [
    { to: '/bienestar', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/bienestar/tablero',
      labelId: 'nav.bienestar.tablero',
      descId: 'nav.bienestar.tablero.desc',
      icon: Users,
      color: 'cobalto',
    },
    {
      to: '/bienestar/alta',
      labelId: 'nav.bienestar.alta',
      descId: 'nav.bienestar.alta.desc',
      icon: UserPlus,
      color: 'turquesa',
    },
    {
      to: '/bienestar/negociacion',
      labelId: 'nav.bienestar.negociacion',
      descId: 'nav.bienestar.negociacion.desc',
      icon: MessagesSquare,
      color: 'mandarina',
    },
    {
      to: '/bienestar/inasistencia',
      labelId: 'nav.bienestar.inasistencia',
      descId: 'nav.bienestar.inasistencia.desc',
      icon: CalendarX,
      color: 'limon',
    },
  ],
  COORDINADOR: [
    { to: '/coordinador', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/coordinador/planes',
      labelId: 'nav.coordinador.planes',
      descId: 'nav.coordinador.planes.desc',
      icon: FileCheck,
      color: 'cobalto',
    },
    {
      to: '/coordinador/metricas',
      labelId: 'nav.coordinador.metricas',
      descId: 'nav.coordinador.metricas.desc',
      icon: TrendingUp,
      color: 'turquesa',
    },
  ],
  DOCENTE: [
    { to: '/docente', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/docente/asignaturas',
      labelId: 'nav.docente.asignaturas',
      descId: 'nav.docente.asignaturas.desc',
      icon: BookOpen,
      color: 'cobalto',
    },
    {
      to: '/docente/ajustes',
      labelId: 'nav.docente.ajustes',
      descId: 'nav.docente.ajustes.desc',
      icon: CheckCircle2,
      color: 'turquesa',
    },
  ],
  FAMILIAR: [
    { to: '/familiar', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/familiar/planes',
      labelId: 'nav.familiar.planes',
      descId: 'nav.familiar.planes.desc',
      icon: FileText,
      color: 'fucsia',
    },
  ],
  ADMIN: [
    { to: '/admin', labelId: 'nav.inicio', icon: House, end: true },
    {
      to: '/admin/usuarios',
      labelId: 'nav.admin.usuarios',
      descId: 'nav.admin.usuarios.desc',
      icon: Users,
      color: 'cobalto',
    },
    {
      to: '/admin/catalogo-dua',
      labelId: 'nav.admin.catalogo_dua',
      descId: 'nav.admin.catalogo_dua.desc',
      icon: Layers,
      color: 'turquesa',
    },
    {
      to: '/admin/aq10',
      labelId: 'nav.admin.aq10',
      descId: 'nav.admin.aq10.desc',
      icon: UserCheck,
      color: 'limon',
    },
    {
      to: '/admin/calendario',
      labelId: 'nav.admin.calendario',
      descId: 'nav.admin.calendario.desc',
      icon: Calendar,
      color: 'uva',
    },
    {
      to: '/admin/importacion',
      labelId: 'nav.admin.importacion',
      descId: 'nav.admin.importacion.desc',
      icon: FileSpreadsheet,
      color: 'mandarina',
    },
    {
      to: '/admin/solicitudes',
      labelId: 'nav.admin.solicitudes',
      descId: 'nav.admin.solicitudes.desc',
      icon: UserPlus,
      color: 'fucsia',
    },
    {
      to: '/admin/auditoria',
      labelId: 'nav.admin.auditoria',
      descId: 'nav.admin.auditoria.desc',
      icon: ShieldAlert,
      color: 'cobalto',
    },
    {
      to: '/admin/salud',
      labelId: 'nav.admin.salud',
      descId: 'nav.admin.salud.desc',
      icon: Activity,
      color: 'limon',
    },
  ],
};

export const ROL_LABEL_ID: Record<Rol, string> = {
  ESTUDIANTE: 'rol.estudiante',
  BIENESTAR: 'rol.bienestar',
  COORDINADOR: 'rol.coordinador',
  DOCENTE: 'rol.docente',
  FAMILIAR: 'rol.familiar',
  ADMIN: 'rol.admin',
};
