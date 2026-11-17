import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutosaveStatus } from '@/components/ui/AutosaveIndicator';

export interface UseAutosaveOptions<T> {
  /** Espera tras el último cambio antes de guardar. Por defecto 1500 ms. */
  delay?: number;
  /** `false` mientras no haya nada que guardar (p. ej. el formulario aún no cargó). */
  enabled?: boolean;
  /** Comparador para no guardar si no cambió. Por defecto, JSON. */
  isEqual?: (a: T, b: T) => boolean;
}

/**
 * Guardado automático por sección (F1–F5): debounce + estado para <AutosaveIndicator/>.
 *
 *   const { status, savedAt, flush } = useAutosave(valores, (v) => api.patch(`/f1/${id}`, v));
 *   <AutosaveIndicator status={status} savedAt={savedAt} onRetry={flush} />
 *
 * El primer valor se toma como "ya guardado" (no dispara guardado al montar).
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<unknown>,
  options: UseAutosaveOptions<T> = {},
) {
  const {
    delay = 1500,
    enabled = true,
    isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  } = options;
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const last = useRef<T>(value);
  const latest = useRef<T>(value);
  const saveRef = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveRef.current = save;
    latest.current = value;
  });

  const run = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const v = latest.current;
    setStatus('saving');
    try {
      await saveRef.current(v);
      last.current = v;
      setSavedAt(new Date());
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled || isEqual(last.current, value)) return;
    timer.current = setTimeout(() => void run(), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, delay, run]);

  return { status, savedAt, /** Guarda ya (también reintenta tras un error). */ flush: run };
}
