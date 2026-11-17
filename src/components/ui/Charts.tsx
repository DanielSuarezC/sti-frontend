import { useId, useState, type ReactNode } from 'react';
import { ArrowRight, Table2, ChartColumn } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { COLOR_CLASES, type ColorModulo } from '@/lib/pasos';
import type { EstadoSemaforo } from '@/lib/types';
import { Button } from './Button';
import { SemaforoIcono, useSemaforoLabel } from './Semaforo';

/* ------------------------------ ChartFigure ------------------------------ */

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartFigureProps {
  title: string;
  /** Una frase que resume lo que muestra (se lee antes del gráfico). */
  description?: string;
  /** Tabla alternativa con EXACTAMENTE los mismos datos. */
  table: ChartTable;
  children: ReactNode;
  className?: string;
}

/** Marco accesible de todo gráfico: título, resumen y botón "Ver como tabla". */
export function ChartFigure({ title, description, table, children, className }: ChartFigureProps) {
  const intl = useIntl();
  const [asTable, setAsTable] = useState(false);
  const id = useId().replace(/:/g, '');
  return (
    <figure
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      className={cn(
        'rounded-tarjeta border-2 border-borde bg-blanco p-5 shadow-plano-tinta',
        className,
      )}
    >
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p id={`${id}-t`} className="font-titulo text-lg font-semibold">
            {title}
          </p>
          {description && (
            <p id={`${id}-d`} className="text-sm text-tinta-suave">
              {description}
            </p>
          )}
        </div>
        <Button
          variant="secundaria"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
          leftIcon={asTable ? <ChartColumn className="size-5" /> : <Table2 className="size-5" />}
          className="text-sm"
        >
          {intl.formatMessage({ id: asTable ? 'grafico.ver_grafico' : 'grafico.ver_tabla' })}
        </Button>
      </figcaption>
      {asTable ? (
        <div className="overflow-x-auto rounded-control border-2 border-borde">
          <table className="w-full border-collapse text-left text-base">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-cobalto-tinte">
              <tr>
                {table.columns.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="border-b-2 border-borde px-4 py-2 font-titulo text-sm font-bold"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b-2 border-borde last:border-b-0">
                  {r.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row" className="px-4 py-2 font-bold">
                        {cell}
                      </th>
                    ) : (
                      <td key={j} className="px-4 py-2">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

/* ------------------------------ BarChart ------------------------------ */

export interface BarDatum {
  label: string;
  value: number;
  color?: ColorModulo;
}

export interface BarChartProps {
  title: string;
  description?: string;
  data: BarDatum[];
  /** Texto de la columna de valores en la tabla alternativa ("Estudiantes"). */
  valueLabel?: string;
  /** Formato del valor mostrado ("12", "85 %"). */
  formatValue?: (v: number) => string;
  className?: string;
}

/** Barras horizontales: cada fila tiene etiqueta y valor en TEXTO, y la barra es un SVG con borde. */
export function BarChart({
  title,
  description,
  data,
  valueLabel,
  formatValue,
  className,
}: BarChartProps) {
  const intl = useIntl();
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((v: number) => intl.formatNumber(v));
  return (
    <ChartFigure
      title={title}
      description={description}
      className={className}
      table={{
        columns: [
          intl.formatMessage({ id: 'grafico.categoria' }),
          valueLabel ?? intl.formatMessage({ id: 'grafico.valor' }),
        ],
        rows: data.map((d) => [d.label, fmt(d.value)]),
      }}
    >
      <ul role="list" className="space-y-3">
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          const fill = d.color ? `var(--${d.color})` : 'var(--cobalto)';
          return (
            <li
              key={d.label}
              className="grid grid-cols-[minmax(6rem,12rem)_1fr_auto] items-center gap-3"
            >
              <span className="text-sm font-bold">{d.label}</span>
              <svg
                role="img"
                aria-label={`${d.label}: ${fmt(d.value)}`}
                className="h-7 w-full"
                viewBox="0 0 100 28"
                preserveAspectRatio="none"
              >
                <rect
                  x="1"
                  y="1"
                  width="98"
                  height="26"
                  rx="4"
                  fill="var(--blanco)"
                  stroke="var(--tinta)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {d.value > 0 && (
                  <rect
                    x="1"
                    y="1"
                    width={Math.max(2, pct * 0.98)}
                    height="26"
                    rx="4"
                    fill={fill}
                    stroke="var(--tinta)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>
              <span className="min-w-[3ch] text-right font-titulo text-base font-bold">
                {fmt(d.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartFigure>
  );
}

/* ------------------------------ Donut ------------------------------ */

export interface DonutDatum {
  label: string;
  value: number;
  color?: ColorModulo;
}

export interface DonutProps {
  title: string;
  description?: string;
  data: DonutDatum[];
  /** Texto bajo la cifra central ("estudiantes"). */
  totalLabel?: string;
  className?: string;
}

const PALETA: ColorModulo[] = ['cobalto', 'mandarina', 'turquesa', 'fucsia', 'uva', 'limon'];

function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0);
  const [x1, y1] = p(r1, a1);
  const [x2, y2] = p(r0, a1);
  const [x3, y3] = p(r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

/** Dona con leyenda textual (nombre, cantidad y porcentaje de cada porción). */
export function Donut({ title, description, data, totalLabel, className }: DonutProps) {
  const intl = useIntl();
  const total = data.reduce((s, d) => s + d.value, 0);
  const items = data.map((d, i) => ({
    ...d,
    color: d.color ?? PALETA[i % PALETA.length]!,
    pct: total ? (d.value / total) * 100 : 0,
  }));
  const visibles = items.filter((d) => d.value > 0);
  const slices = visibles.map((d, i) => {
    const antes = visibles.slice(0, i).reduce((s, x) => s + x.value, 0);
    return {
      ...d,
      a0: -Math.PI / 2 + (antes / total) * Math.PI * 2,
      a1: -Math.PI / 2 + ((antes + d.value) / total) * Math.PI * 2,
    };
  });
  const pctText = (p: number) => `${intl.formatNumber(Math.round(p * 10) / 10)} %`;
  return (
    <ChartFigure
      title={title}
      description={description}
      className={className}
      table={{
        columns: [
          intl.formatMessage({ id: 'grafico.categoria' }),
          intl.formatMessage({ id: 'grafico.valor' }),
          intl.formatMessage({ id: 'grafico.porcentaje' }),
        ],
        rows: items.map((d) => [d.label, intl.formatNumber(d.value), pctText(d.pct)]),
      }}
    >
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <svg
          role="img"
          aria-label={`${title}. ${items.map((d) => `${d.label}: ${pctText(d.pct)}`).join('. ')}`}
          viewBox="0 0 200 200"
          className="size-48 shrink-0"
        >
          {total === 0 ? (
            <circle
              cx="100"
              cy="100"
              r="72"
              fill="none"
              stroke="var(--tinta)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          ) : slices.length === 1 ? (
            <>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill={`var(--${slices[0]!.color})`}
                stroke="var(--tinta)"
                strokeWidth="2.5"
              />
              <circle
                cx="100"
                cy="100"
                r="55"
                fill="var(--blanco)"
                stroke="var(--tinta)"
                strokeWidth="2.5"
              />
            </>
          ) : (
            slices.map((s) => (
              <path
                key={s.label}
                d={arc(100, 100, 55, 90, s.a0, s.a1)}
                fill={`var(--${s.color})`}
                stroke="var(--tinta)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            ))
          )}
          <text
            x="100"
            y="104"
            textAnchor="middle"
            className="fill-tinta font-titulo"
            fontSize="28"
            fontWeight="700"
          >
            {intl.formatNumber(total)}
          </text>
          {totalLabel && (
            <text x="100" y="124" textAnchor="middle" className="fill-tinta" fontSize="12">
              {totalLabel}
            </text>
          )}
        </svg>
        <ul role="list" className="w-full space-y-2">
          {items.map((d) => (
            <li key={d.label} className="flex items-center gap-3 text-base">
              <span
                aria-hidden
                className={cn(
                  'size-5 shrink-0 rounded-md border-2 border-borde',
                  COLOR_CLASES[d.color].fondo,
                )}
              />
              <span className="flex-1 font-bold">{d.label}</span>
              <span>
                {intl.formatNumber(d.value)} · {pctText(d.pct)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFigure>
  );
}

/* ------------------------------ SemaforoTrend ------------------------------ */

export interface SemaforoPoint {
  /** Corte académico: "C1", "C2", "C3". */
  corte: string;
  /** `null`/`undefined` = aún sin registro. */
  estado?: EstadoSemaforo | null;
}

export interface SemaforoTrendProps {
  title: string;
  description?: string;
  data: SemaforoPoint[];
  className?: string;
}

/** Evolución del semáforo C1 -> C2 -> C3: forma + palabra en cada corte, unidos por flechas. */
export function SemaforoTrend({ title, description, data, className }: SemaforoTrendProps) {
  const intl = useIntl();
  const label = useSemaforoLabel();
  const sin = intl.formatMessage({ id: 'grafico.sin_registro' });
  return (
    <ChartFigure
      title={title}
      description={description}
      className={className}
      table={{
        columns: [
          intl.formatMessage({ id: 'grafico.corte' }),
          intl.formatMessage({ id: 'grafico.estado' }),
        ],
        rows: data.map((d) => [d.corte, d.estado ? label(d.estado) : sin]),
      }}
    >
      <ol className="flex items-start justify-center gap-1 sm:gap-3">
        {data.map((d, i) => (
          <li key={d.corte} className="flex items-start gap-1 sm:gap-3">
            <div className="flex w-24 flex-col items-center gap-2 text-center">
              <span className="font-titulo text-lg font-bold">{d.corte}</span>
              {d.estado ? (
                <SemaforoIcono estado={d.estado} size={48} />
              ) : (
                <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden>
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    fill="var(--blanco)"
                    stroke="var(--tinta)"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
              <span className="text-sm font-bold">{d.estado ? label(d.estado) : sin}</span>
            </div>
            {i < data.length - 1 && <ArrowRight aria-hidden className="mt-9 size-6 shrink-0" />}
          </li>
        ))}
      </ol>
    </ChartFigure>
  );
}
