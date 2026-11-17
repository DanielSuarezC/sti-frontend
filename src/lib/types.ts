/** Tipos compartidos del contrato con el backend (BUILD_SPEC §3). JSON en snake_case. */

export const ROLES = [
  'ESTUDIANTE',
  'BIENESTAR',
  'COORDINADOR',
  'DOCENTE',
  'FAMILIAR',
  'ADMIN',
] as const;
export type Rol = (typeof ROLES)[number];

export type EstadoUsuario =
  'PENDIENTE_ACTIVACION' | 'PENDIENTE_CONSENTIMIENTO' | 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export type TamanoTexto = 100 | 115 | 130;
export type Espaciado = 'normal' | 'amplio';
export type Fuente = 'predeterminada' | 'dislexia' | 'sistema';

export interface PreferenciasUI {
  modo_calma: boolean;
  tamano_texto: TamanoTexto;
  espaciado: Espaciado;
  sin_movimiento: boolean;
  alto_contraste: boolean;
  fuente: Fuente;
}

export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  rol: Rol;
  estado: EstadoUsuario;
  consentimiento_firmado: boolean;
  programa_id: number | null;
  preferencias_ui?: Partial<PreferenciasUI> | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: Usuario;
}

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  enlace: string | null;
}

export interface NotificacionesResponse {
  items: Notificacion[];
  total: number;
  no_leidas: number;
}

/** Paginación estándar del backend: `?page=&page_size=`. */
export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';
