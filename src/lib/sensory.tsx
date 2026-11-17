/**
 * Preferencias sensoriales ("Cómo me siento mejor").
 * Se aplican como atributos data-* en <html> (los estilos están en styles/index.css y tokens.css):
 *   data-calma="true" | data-texto="100|115|130" | data-espaciado="normal|amplio"
 *   data-movimiento="sin" | data-contraste="alto" | data-fuente="predeterminada|dislexia|sistema"
 * Persisten en localStorage y se sincronizan con `PATCH /auth/me/preferencias` si hay sesión.
 */
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
import { patch } from './api';
import { useAuth } from './auth';
import type { Espaciado, Fuente, PreferenciasUI, TamanoTexto } from './types';

export const PREFERENCIAS_POR_DEFECTO: PreferenciasUI = {
  modo_calma: false,
  tamano_texto: 100,
  espaciado: 'normal',
  sin_movimiento: false,
  alto_contraste: false,
  fuente: 'predeterminada',
};

const STORAGE_KEY = 'sti.preferencias_ui';

/** Acepta valores del backend en formatos distintos y devuelve preferencias válidas. */
export function normalizarPreferencias(raw: unknown): PreferenciasUI {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const tam = Number(r.tamano_texto);
  const tamano: TamanoTexto = tam === 115 || tam === 130 ? tam : 100;
  const esp = String(r.espaciado ?? '').toLowerCase();
  const espaciado: Espaciado =
    esp === 'amplio' || esp === 'ampliado' || esp === 'wide' ? 'amplio' : 'normal';
  const f = String(r.fuente ?? '').toLowerCase();
  const fuente: Fuente = f.includes('dislex')
    ? 'dislexia'
    : f.startsWith('sist') || f === 'system'
      ? 'sistema'
      : 'predeterminada';
  return {
    modo_calma: r.modo_calma === true,
    tamano_texto: tamano,
    espaciado,
    sin_movimiento: r.sin_movimiento === true,
    alto_contraste: r.alto_contraste === true,
    fuente,
  };
}

export function cargarPreferenciasLocales(): PreferenciasUI {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizarPreferencias(raw ? JSON.parse(raw) : null);
  } catch {
    return PREFERENCIAS_POR_DEFECTO;
  }
}

function guardarLocales(p: PreferenciasUI) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Escribe los atributos data-* en <html>. Exportada para aplicarla antes del primer render. */
export function aplicarPreferencias(p: PreferenciasUI, el: HTMLElement = document.documentElement) {
  const set = (name: string, value: string | null) => {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  };
  set('data-calma', p.modo_calma ? 'true' : null);
  set('data-texto', String(p.tamano_texto));
  set('data-espaciado', p.espaciado);
  set('data-movimiento', p.sin_movimiento ? 'sin' : null);
  set('data-contraste', p.alto_contraste ? 'alto' : null);
  set('data-fuente', p.fuente);
}

interface SensoryContextValue {
  prefs: PreferenciasUI;
  update: (cambios: Partial<PreferenciasUI>) => void;
  reset: () => void;
}

const SensoryContext = createContext<SensoryContextValue | null>(null);

export function SensoryProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [prefs, setPrefs] = useState<PreferenciasUI>(cargarPreferenciasLocales);
  const prefsRef = useRef(prefs);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hidratadoPara, setHidratadoPara] = useState<number | null>(null);

  // Aplicar en vivo y persistir en este equipo.
  useEffect(() => {
    prefsRef.current = prefs;
    aplicarPreferencias(prefs);
    guardarLocales(prefs);
  }, [prefs]);

  // Al iniciar sesión, las preferencias del perfil (backend) mandan (ajuste de estado durante el render).
  if (user && hidratadoPara !== user.id) {
    setHidratadoPara(user.id);
    if (user.preferencias_ui && Object.keys(user.preferencias_ui).length > 0) {
      setPrefs(normalizarPreferencias(user.preferencias_ui));
    }
  } else if (status === 'anonimo' && hidratadoPara !== null) {
    setHidratadoPara(null);
  }

  const sincronizar = useCallback(
    (p: PreferenciasUI) => {
      if (status !== 'autenticado') return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        patch('/auth/me/preferencias', p).catch(() => {
          /* Se conservan en este equipo; se reintentará en el próximo cambio. */
        });
      }, 600);
    },
    [status],
  );

  const update = useCallback(
    (cambios: Partial<PreferenciasUI>) => {
      const next = { ...prefsRef.current, ...cambios };
      prefsRef.current = next;
      setPrefs(next);
      sincronizar(next);
    },
    [sincronizar],
  );

  const reset = useCallback(() => update(PREFERENCIAS_POR_DEFECTO), [update]);

  const value = useMemo(() => ({ prefs, update, reset }), [prefs, update, reset]);
  return <SensoryContext.Provider value={value}>{children}</SensoryContext.Provider>;
}

export function useSensory(): SensoryContextValue {
  const ctx = useContext(SensoryContext);
  if (!ctx) throw new Error('useSensory debe usarse dentro de <SensoryProvider>');
  return ctx;
}
