/** Atajos de i18n para las pantallas: `t('area.clave', {valores})`, etiquetas de enums y fechas sin desfase de zona horaria. */
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

type Valores = Record<string, string | number | boolean | null | undefined>;

export function useT() {
  const intl = useIntl();
  return useCallback(
    (id: string, values?: Valores) =>
      intl.formatMessage({ id }, values as Record<string, string | number> | undefined),
    [intl],
  );
}

/** Etiqueta de un valor de enum del backend: `enum.<grupo>.<VALOR>`; si no existe, muestra el valor tal cual. */
export function useEnum() {
  const intl = useIntl();
  return useCallback(
    (grupo: string, valor: string | null | undefined) => {
      if (valor === null || valor === undefined || valor === '') return '—';
      const id = `enum.${grupo}.${valor}`;
      return id in intl.messages ? intl.formatMessage({ id }) : valor;
    },
    [intl],
  );
}

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Una fecha `AAAA-MM-DD` se interpreta como fecha local (si no, en Colombia se vería un día antes). */
export function parseFecha(v: string | Date): Date {
  if (v instanceof Date) return v;
  const m = SOLO_FECHA.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
}

export function useFmt() {
  const intl = useIntl();
  return useMemo(
    () => ({
      fecha: (v?: string | Date | null) =>
        v ? intl.formatDate(parseFecha(v), { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      fechaHora: (v?: string | Date | null) =>
        v
          ? intl.formatDate(parseFecha(v), {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '—',
      num: (v: number) => intl.formatNumber(v),
      pct: (v: number | null | undefined) =>
        v === null || v === undefined ? '—' : `${intl.formatNumber(Math.round(v * 10) / 10)} %`,
    }),
    [intl],
  );
}
