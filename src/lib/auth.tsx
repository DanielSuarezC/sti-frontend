/**
 * Sesión del usuario. El access token vive SOLO en memoria (lib/api.ts); al cargar la app se
 * restaura con `POST /auth/refresh` (cookie HttpOnly). Nunca se guarda nada de la sesión en storage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { get, post, refreshSession, setAccessToken, setAuthFailureHandler } from './api';
import type { AuthResponse, Rol, Usuario } from './types';

export type AuthStatus = 'cargando' | 'autenticado' | 'anonimo';

interface AuthContextValue {
  status: AuthStatus;
  user: Usuario | null;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  /** Vuelve a pedir `GET /auth/me` (p. ej. tras firmar el consentimiento F0). */
  refreshUser: () => Promise<Usuario>;
  setUser: (u: Usuario | null) => void;
  /** Aplica una sesión ya creada por el backend (registro autónomo). */
  acceptSession: (r: AuthResponse) => void;
  hasRole: (...roles: Rol[]) => boolean;
}

// Exportado para pruebas (permite inyectar un usuario falso).
export const AuthContext = createContext<AuthContextValue | null>(null);

const RUTA_INICIO: Record<Rol, string> = {
  ESTUDIANTE: '/estudiante',
  BIENESTAR: '/bienestar',
  COORDINADOR: '/coordinador',
  DOCENTE: '/docente',
  FAMILIAR: '/familiar',
  ADMIN: '/admin',
};

/** Ruta de inicio de un rol. */
export const rutaInicio = (rol: Rol) => RUTA_INICIO[rol];

/** Ruta a la que debe ir un usuario recién autenticado (aplica la regla de F0 del estudiante). */
export function rutaPostLogin(u: Usuario): string {
  if (u.rol === 'ESTUDIANTE' && !u.consentimiento_firmado) return '/estudiante/consentimiento';
  return RUTA_INICIO[u.rol];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('cargando');
  const [user, setUserState] = useState<Usuario | null>(null);

  const setUser = useCallback((u: Usuario | null) => {
    setUserState(u);
    setStatus(u ? 'autenticado' : 'anonimo');
  }, []);

  // Restaurar sesión al cargar.
  useEffect(() => {
    let vivo = true;
    refreshSession()
      .then((r) => vivo && setUser(r.user))
      .catch(() => {
        setAccessToken(null);
        if (vivo) setUser(null);
      });
    return () => {
      vivo = false;
    };
  }, [setUser]);

  // Si en cualquier petición el refresh falla, cerrar sesión.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      queryClient.clear();
    });
    return () => setAuthFailureHandler(null);
  }, [setUser, queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await post<AuthResponse>('/auth/login', { email, password }, { anonymous: true });
      setAccessToken(r.access_token);
      setUser(r.user);
      return r.user;
    },
    [setUser],
  );

  const acceptSession = useCallback(
    (r: AuthResponse) => {
      setAccessToken(r.access_token);
      setUser(r.user);
    },
    [setUser],
  );

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } catch {
      /* cerrar sesión local aunque falle la red */
    }
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [setUser, queryClient]);

  const refreshUser = useCallback(async () => {
    const u = await get<Usuario>('/auth/me');
    setUser(u);
    return u;
  }, [setUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      refreshUser,
      setUser,
      acceptSession,
      hasRole: (...roles) => !!user && roles.includes(user.rol),
    }),
    [status, user, login, logout, refreshUser, setUser, acceptSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
