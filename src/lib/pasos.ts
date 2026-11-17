/**
 * Los 12 pasos del MAAR-TEA (arquitectura v7 §8) y los módulos de color de DESIGN.md.
 * Color + ícono + nombre son FIJOS en toda la app. Los textos viven en locales/es-CO.json
 * (`paso.<n>.nombre`, `paso.<n>.desc`, `modulo.<id>`).
 */
import {
  Users,
  Building2,
  BrickWall,
  Handshake,
  Lightbulb,
  ScanSearch,
  SlidersHorizontal,
  ClipboardCheck,
  ChartColumn,
  GraduationCap,
  UserRound,
  Star,
  type LucideIcon,
} from 'lucide-react';

export type ColorModulo = 'cobalto' | 'mandarina' | 'fucsia' | 'turquesa' | 'limon' | 'uva';

export type ModuloId =
  | 'conocer'
  | 'contexto'
  | 'barreras'
  | 'dua'
  | 'apoyos'
  | 'seguimiento'
  | 'evaluar'
  | 'trayectoria';

/** Clases Tailwind completas (estáticas, para que el JIT las detecte). */
export interface ColorClases {
  /** Fondo sólido + texto legible encima. */
  solido: string;
  /** Tinte claro para fondos de sección (texto tinta). */
  tinte: string;
  /** Sombra plana desplazada del color. */
  sombra: string;
  /** Franja / punto de color de 100% (fondo). */
  fondo: string;
}

export const COLOR_CLASES: Record<ColorModulo, ColorClases> = {
  cobalto: {
    solido: 'bg-cobalto text-cobalto-on',
    tinte: 'bg-cobalto-tinte',
    sombra: 'shadow-plano-cobalto',
    fondo: 'bg-cobalto',
  },
  mandarina: {
    solido: 'bg-mandarina text-mandarina-on',
    tinte: 'bg-mandarina-tinte',
    sombra: 'shadow-plano-mandarina',
    fondo: 'bg-mandarina',
  },
  fucsia: {
    solido: 'bg-fucsia text-fucsia-on',
    tinte: 'bg-fucsia-tinte',
    sombra: 'shadow-plano-fucsia',
    fondo: 'bg-fucsia',
  },
  turquesa: {
    solido: 'bg-turquesa text-turquesa-on',
    tinte: 'bg-turquesa-tinte',
    sombra: 'shadow-plano-turquesa',
    fondo: 'bg-turquesa',
  },
  limon: {
    solido: 'bg-limon text-limon-on',
    tinte: 'bg-limon-tinte',
    sombra: 'shadow-plano-limon',
    fondo: 'bg-limon',
  },
  uva: {
    solido: 'bg-uva text-uva-on',
    tinte: 'bg-uva-tinte',
    sombra: 'shadow-plano-uva',
    fondo: 'bg-uva',
  },
};

export interface ModuloInfo {
  id: ModuloId;
  color: ColorModulo;
  icon: LucideIcon;
}

export const MODULOS: Record<ModuloId, ModuloInfo> = {
  conocer: { id: 'conocer', color: 'fucsia', icon: UserRound },
  contexto: { id: 'contexto', color: 'mandarina', icon: Building2 },
  barreras: { id: 'barreras', color: 'turquesa', icon: BrickWall },
  dua: { id: 'dua', color: 'cobalto', icon: Lightbulb },
  apoyos: { id: 'apoyos', color: 'limon', icon: Users },
  seguimiento: { id: 'seguimiento', color: 'uva', icon: ClipboardCheck },
  evaluar: { id: 'evaluar', color: 'uva', icon: ChartColumn },
  trayectoria: { id: 'trayectoria', color: 'mandarina', icon: GraduationCap },
};

export interface PasoInfo {
  n: number;
  modulo: ModuloId;
  /** Ícono propio del paso (distinto del de su módulo cuando comparten color). */
  icon: LucideIcon;
  /** Formato del instrumento (F1...F10) según arquitectura §7. */
  formato: string;
}

/** Orden fijo 1..12. Ver tabla de arquitectura v7 §8. */
export const PASOS: readonly PasoInfo[] = [
  { n: 1, modulo: 'conocer', icon: UserRound, formato: 'F1' },
  { n: 2, modulo: 'conocer', icon: Star, formato: 'F2' },
  { n: 3, modulo: 'contexto', icon: Building2, formato: 'F3' },
  { n: 4, modulo: 'barreras', icon: BrickWall, formato: 'F4' },
  { n: 5, modulo: 'barreras', icon: Handshake, formato: 'F5' },
  { n: 6, modulo: 'dua', icon: Lightbulb, formato: 'F6' },
  { n: 7, modulo: 'dua', icon: ScanSearch, formato: 'F4' },
  { n: 8, modulo: 'dua', icon: SlidersHorizontal, formato: 'F6' },
  { n: 9, modulo: 'apoyos', icon: Users, formato: 'F7' },
  { n: 10, modulo: 'seguimiento', icon: ClipboardCheck, formato: 'F8' },
  { n: 11, modulo: 'evaluar', icon: ChartColumn, formato: 'F9' },
  { n: 12, modulo: 'trayectoria', icon: GraduationCap, formato: 'F10' },
] as const;

export const getPaso = (n: number): PasoInfo => {
  const p = PASOS[n - 1];
  if (!p) throw new Error(`Paso MAAR-TEA inexistente: ${n}`);
  return p;
};

/** Color de un paso. */
export const colorDePaso = (n: number): ColorModulo => MODULOS[getPaso(n).modulo].color;
