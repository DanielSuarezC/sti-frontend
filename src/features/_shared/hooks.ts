import { useEffect, useState } from 'react';

/** Valor con retraso (para no consultar al backend en cada tecla del buscador). */
export function useDebounced<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** Tamaño de página usado en todas las listas con paginación en servidor. */
export const PAGE_SIZE = 20;
