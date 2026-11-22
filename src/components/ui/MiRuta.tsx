import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { PASOS, colorDePaso, getPaso } from '@/lib/pasos';
import { ModuloLegend } from './ModuloTag';

export type EstadoPaso = 'hecho' | 'actual' | 'pendiente';

export interface MiRutaPaso {
  /** Número de paso MAAR-TEA, 1 a 12. */
  n: number;
  estado: EstadoPaso;
  /** Si se pasa, la estación es un botón; si no, solo informa. */
  onSelect?: () => void;
}

export interface MiRutaProps {
  /** Los 12 pasos (o los que existan) con su estado. */
  pasos: MiRutaPaso[];
  /** Muestra la leyenda de módulos (color + ícono + nombre). Por defecto sí. */
  showLegend?: boolean;
  className?: string;
}

/* ---------- Geometría del mapa horizontal (unidades del viewBox) ---------- */
const W = 1230;
const H = 680;
const X0 = 110;
const DX = 200;
const ROW_Y = [100, 500] as const;
const MID_Y = 300;
const R = (MID_Y - ROW_Y[0]) / 2;

const pos = (i: number) => ({ x: X0 + DX * (i % 6), y: ROW_Y[i < 6 ? 0 : 1] });

/** Trazado entre estación i e i+1. El tramo 6 -> 7 hace la curva de retorno. */
function segmento(i: number): string {
  const a = pos(i);
  const b = pos(i + 1);
  if (i !== 5) return `M${a.x} ${a.y} H${b.x}`;
  return [
    `M${a.x} ${a.y}`,
    `A${R} ${R} 0 0 1 ${a.x + R} ${a.y + R}`,
    `A${R} ${R} 0 0 1 ${a.x} ${MID_Y}`,
    `H${b.x}`,
    `A${R} ${R} 0 0 0 ${b.x - R} ${MID_Y + R}`,
    `A${R} ${R} 0 0 0 ${b.x} ${b.y}`,
  ].join(' ');
}

const WIDE_MIN = 820;

function useWide(ref: React.RefObject<HTMLElement | null>) {
  const [wide, setWide] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWide(el.clientWidth >= WIDE_MIN);
  }, [ref]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= WIDE_MIN));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return wide;
}

/** Marcador de estación: hecho = relleno + ✔, actual = anillo limón, pendiente = contorno con número. */
function Marker({ n, estado }: { n: number; estado: EstadoPaso }) {
  const color = colorDePaso(n);
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
      className="shrink-0"
    >
      {estado === 'actual' && (
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="var(--limon)"
          stroke="var(--tinta)"
          strokeWidth="3.5"
        />
      )}
      <circle
        cx="32"
        cy="32"
        r={estado === 'actual' ? 20 : 23}
        fill={estado === 'hecho' ? `var(--${color})` : 'var(--blanco)'}
        stroke="var(--tinta)"
        strokeWidth="4"
      />
      {estado === 'hecho' ? (
        <path
          d="M22 33l7 7 13-15"
          fill="none"
          stroke={`var(--on-${color})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <text
          x="32"
          y="39.5"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="var(--tinta)"
          style={{ fontFamily: 'var(--fuente-titulo)' }}
        >
          {n}
        </text>
      )}
    </svg>
  );
}

function bandStyle(toEstado: EstadoPaso, color: string): { done: boolean; style: CSSProperties } {
  const done = toEstado !== 'pendiente';
  return { done, style: done ? { backgroundColor: `var(--${color})` } : {} };
}

/**
 * "Mi ruta": mapa de metro de los 12 pasos MAAR-TEA.
 *  - Escritorio (contenedor >= 820 px): dos filas de 6 estaciones unidas por una curva; trazado en SVG.
 *  - Móvil: línea vertical con descripción de cada paso.
 * La lista <ol> de botones ES la versión accesible (el dibujo es decorativo, aria-hidden).
 * Estado nunca solo por color: hecho = ✔ + relleno, actual = anillo + "Estás aquí", pendiente = número + línea punteada.
 */
export function MiRuta({ pasos, showLegend = true, className }: MiRutaProps) {
  const intl = useIntl();
  const boxRef = useRef<HTMLDivElement>(null);
  const wide = useWide(boxRef);
  const byN = new Map(pasos.map((p) => [p.n, p]));
  const lista = PASOS.map((p) => byN.get(p.n)).filter((p): p is MiRutaPaso => !!p);

  const estadoTexto = (e: EstadoPaso) => intl.formatMessage({ id: `miruta.estado.${e}` });

  const station = (p: MiRutaPaso, layout: 'wide' | 'narrow') => {
    const info = getPaso(p.n);
    const nombre = intl.formatMessage({ id: `paso.${p.n}.nombre` });
    const descId = `miruta-desc-${p.n}`;
    const content = (
      <>
        <span className="relative flex shrink-0 flex-col items-center">
          {p.estado === 'actual' && (
            <span className="absolute bottom-full mb-1 whitespace-nowrap rounded-full border-2 border-borde bg-tinta px-3 py-0.5 text-sm font-bold text-blanco">
              {intl.formatMessage({ id: 'miruta.estas_aqui' })}
            </span>
          )}
          <Marker n={p.n} estado={p.estado} />
        </span>
        <span className={cn('block min-w-0', layout === 'wide' ? 'mt-1 text-center' : 'text-left')}>
          <span className="block font-titulo text-sm font-bold leading-snug">
            {p.n}. {nombre}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 text-sm font-bold text-tinta-suave"
            style={layout === 'wide' ? { justifyContent: 'center' } : undefined}
          >
            <info.icon aria-hidden className="size-4 shrink-0" />
            {estadoTexto(p.estado)}
          </span>
          <span
            id={descId}
            className={layout === 'narrow' ? 'mt-1 block text-sm text-tinta-suave' : 'sr-only'}
          >
            {intl.formatMessage({ id: `paso.${p.n}.desc` })}
          </span>
        </span>
      </>
    );
    const common = cn(
      'flex w-full gap-1 rounded-control p-1',
      layout === 'wide' ? 'flex-col items-center' : 'flex-row items-start gap-3 text-left',
    );
    return p.onSelect ? (
      <button
        type="button"
        onClick={p.onSelect}
        aria-label={intl.formatMessage(
          { id: 'miruta.boton' },
          { n: p.n, nombre, estado: estadoTexto(p.estado) },
        )}
        aria-describedby={descId}
        aria-current={p.estado === 'actual' ? 'step' : undefined}
        className={cn(common, 'hover:bg-limon-tinte cursor-pointer')}
      >
        {content}
      </button>
    ) : (
      <div className={common} aria-current={p.estado === 'actual' ? 'step' : undefined}>
        {content}
      </div>
    );
  };

  return (
    <div className={className}>
      <div ref={boxRef}>
        {wide ? (
          <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="pointer-events-none absolute inset-0 size-full"
              aria-hidden
              focusable="false"
            >
              {lista.slice(0, -1).map((p, k) => {
                const next = lista[k + 1];
                if (!next) return null;
                const i = p.n - 1;
                const d = segmento(i);
                const done = next.estado !== 'pendiente';
                return done ? (
                  <g key={p.n} fill="none" strokeLinecap="butt">
                    <path d={d} stroke="var(--tinta)" strokeWidth="22" />
                    <path d={d} stroke={`var(--${colorDePaso(next.n)})`} strokeWidth="12" />
                  </g>
                ) : (
                  <path
                    key={p.n}
                    d={d}
                    fill="none"
                    stroke="var(--tinta)"
                    strokeWidth="5"
                    strokeDasharray="14 12"
                  />
                );
              })}
            </svg>
            <ol
              role="list"
              aria-label={intl.formatMessage({ id: 'miruta.lista' })}
              className="m-0 list-none p-0"
            >
              {lista.map((p) => {
                const { x, y } = pos(p.n - 1);
                return (
                  <li
                    key={p.n}
                    className="absolute"
                    style={{
                      left: `${(x / W) * 100}%`,
                      top: `${(y / H) * 100}%`,
                      width: `${(DX / W) * 100 - 1}%`,
                      transform: 'translate(-50%, -32px)',
                    }}
                  >
                    {station(p, 'wide')}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <ol
            role="list"
            aria-label={intl.formatMessage({ id: 'miruta.lista' })}
            className="m-0 list-none p-0"
          >
            {lista.map((p, k) => {
              const last = k === lista.length - 1;
              const next = lista[k + 1];
              const band = next ? bandStyle(next.estado, colorDePaso(next.n)) : null;
              return (
                <li key={p.n} className="relative pb-6">
                  {!last && band && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -bottom-9 left-[36px] top-9 w-3 -translate-x-1/2',
                        band.done
                          ? 'border-x-[3px] border-borde'
                          : 'border-l-4 border-dashed border-borde',
                      )}
                      style={band.style}
                    />
                  )}
                  <div className="relative z-10">{station(p, 'narrow')}</div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {showLegend && (
        <div className="mt-6">
          <p className="mb-2 font-titulo text-sm font-bold">
            {intl.formatMessage({ id: 'miruta.leyenda' })}
          </p>
          <ModuloLegend />
        </div>
      )}
    </div>
  );
}
