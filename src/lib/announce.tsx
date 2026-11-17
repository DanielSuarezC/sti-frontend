/** Región live global para anuncios a lectores de pantalla ("Plan guardado", "Cargando..."). */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface AnnouncerValue {
  /** Anuncia un texto (educado por defecto; `assertive` interrumpe). */
  announce: (mensaje: string, prioridad?: 'polite' | 'assertive') => void;
}
const AnnouncerContext = createContext<AnnouncerValue>({ announce: () => {} });

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  const announce = useCallback((mensaje: string, prioridad: 'polite' | 'assertive' = 'polite') => {
    const set = prioridad === 'assertive' ? setAssertive : setPolite;
    // Vaciar y volver a escribir fuerza a repetir el mismo mensaje.
    set('');
    setTimeout(() => set(mensaje), 50);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);
  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

export const useAnnounce = () => useContext(AnnouncerContext).announce;
