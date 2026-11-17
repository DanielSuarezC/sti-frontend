import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Input, Select } from './Inputs';
import { EmptyState, ErrorState, LoadingState } from './States';

export interface Column<T> {
  id: string;
  /** Encabezado visible (texto). */
  header: string;
  /** Valor para ordenar y buscar. Si falta, la columna no se ordena ni se busca. */
  accessor?: (row: T) => string | number | Date | null | undefined;
  /** Celda a mostrar. Por defecto, el valor de `accessor`. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  /** La celda de esta columna es el encabezado de fila (nombre de la persona). Solo una. */
  rowHeader?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface TableFilter<T> {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
}

export type SortState = { id: string; dir: 'asc' | 'desc' } | null;

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string | number;
  /** Título de la tabla (obligatorio: lo lee el lector de pantalla). */
  caption: string;
  /** Campo de búsqueda de texto sobre las columnas con `accessor`. */
  searchable?: boolean;
  filters?: TableFilter<T>[];
  /** Filas por página en modo cliente. Por defecto 10. */
  pageSize?: number;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  /** Orden controlado (modo servidor). Si se omite, ordena el cliente. */
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  /**
   * Paginación en servidor: pasa `total` y `page` (base 1) y `onPageChange`; `data` ya es solo la página.
   * El filtrado/búsqueda local se desactiva en ese modo (hazlo en el backend).
   */
  serverSide?: { total: number; page: number; onPageChange: (page: number) => void };
  className?: string;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true });
}

/**
 * Tabla accesible: `<caption>`, `<th scope>`, `aria-sort`, orden por botón, búsqueda, filtros y paginación.
 * Desborda en horizontal dentro de una región enfocable (móvil).
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  caption,
  searchable,
  filters,
  pageSize = 10,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sort: sortProp,
  onSortChange,
  serverSide,
  className,
}: DataTableProps<T>) {
  const intl = useIntl();
  const [sortInner, setSortInner] = useState<SortState>(null);
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [pageInner, setPageInner] = useState(1);

  const sort = sortProp !== undefined ? sortProp : sortInner;
  const setSort = (s: SortState) => {
    if (sortProp === undefined) setSortInner(s);
    onSortChange?.(s);
    setPageInner(1);
  };

  const processed = useMemo(() => {
    if (serverSide) return data;
    let rows = data;
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        columns.some(
          (c) =>
            c.accessor &&
            String(c.accessor(r) ?? '')
              .toLowerCase()
              .includes(q),
        ),
      );
    }
    for (const f of filters ?? []) {
      const v = filterValues[f.id];
      if (v) rows = rows.filter((r) => f.predicate(r, v));
    }
    if (sort && sortProp === undefined) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.accessor) {
        const acc = col.accessor;
        rows = [...rows].sort((a, b) => compare(acc(a), acc(b)) * (sort.dir === 'asc' ? 1 : -1));
      }
    }
    return rows;
  }, [data, columns, query, filters, filterValues, sort, sortProp, serverSide]);

  const total = serverSide ? serverSide.total : processed.length;
  const page = serverSide
    ? serverSide.page
    : Math.min(pageInner, Math.max(1, Math.ceil(total / pageSize)));
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const visible = serverSide ? processed : processed.slice((page - 1) * pageSize, page * pageSize);
  const setPage = (p: number) => (serverSide ? serverSide.onPageChange(p) : setPageInner(p));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const toggleSort = (c: Column<T>) => {
    if (!sort || sort.id !== c.id) setSort({ id: c.id, dir: 'asc' });
    else if (sort.dir === 'asc') setSort({ id: c.id, dir: 'desc' });
    else setSort(null);
  };

  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading) return <LoadingState rows={5} />;

  const hasControls = (searchable && !serverSide) || (filters?.length && !serverSide);

  return (
    <div className={className}>
      {hasControls ? (
        <div className="mb-4 flex flex-wrap items-end gap-4">
          {searchable && !serverSide && (
            <div className="min-w-[14rem] flex-1">
              <Input
                label={intl.formatMessage({ id: 'tabla.buscar' })}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPageInner(1);
                }}
              />
            </div>
          )}
          {filters?.map((f) => (
            <Select
              key={f.id}
              label={f.label}
              placeholder={intl.formatMessage({ id: 'tabla.todos' })}
              value={filterValues[f.id] ?? ''}
              onChange={(e) => {
                setFilterValues((s) => ({ ...s, [f.id]: e.target.value }));
                setPageInner(1);
              }}
              className="min-w-[12rem]"
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ))}
        </div>
      ) : null}

      {total === 0 ? (
        <EmptyState
          icon={Search}
          title={emptyTitle ?? intl.formatMessage({ id: 'tabla.vacia_titulo' })}
          description={emptyDescription ?? intl.formatMessage({ id: 'tabla.vacia_desc' })}
          action={emptyAction}
        />
      ) : (
        // Región desplazable: debe poder enfocarse con teclado para recorrerla.
        <div
          role="region"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-label={intl.formatMessage({ id: 'tabla.region' }, { titulo: caption })}
          className="overflow-x-auto rounded-tarjeta border-2 border-borde bg-blanco shadow-plano-tinta"
        >
          <table className="w-full border-collapse text-left text-base">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-cobalto-tinte">
              <tr>
                {columns.map((c) => {
                  const sortable =
                    c.sortable !== false && !!c.accessor && (!serverSide || !!onSortChange);
                  const active = sort?.id === c.id ? sort.dir : null;
                  return (
                    <th
                      key={c.id}
                      scope="col"
                      aria-sort={
                        active === 'asc'
                          ? 'ascending'
                          : active === 'desc'
                            ? 'descending'
                            : sortable
                              ? 'none'
                              : undefined
                      }
                      className={cn(
                        'border-b-2 border-borde px-4 py-2 font-titulo text-sm font-bold',
                        c.align === 'right' && 'text-right',
                        c.align === 'center' && 'text-center',
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c)}
                          className="-mx-2 inline-flex min-h-tactil items-center gap-1.5 rounded-lg px-2 font-bold"
                          aria-label={intl.formatMessage(
                            { id: 'tabla.ordenar_por' },
                            { columna: c.header },
                          )}
                        >
                          {c.header}
                          {active === 'asc' ? (
                            <ArrowUp aria-hidden className="size-4" />
                          ) : active === 'desc' ? (
                            <ArrowDown aria-hidden className="size-4" />
                          ) : (
                            <ArrowUpDown aria-hidden className="size-4" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={getRowId(row)}
                  className="border-b-2 border-borde last:border-b-0 odd:bg-blanco even:bg-papel"
                >
                  {columns.map((c) => {
                    const content = c.cell
                      ? c.cell(row)
                      : c.accessor
                        ? String(c.accessor(row) ?? '')
                        : null;
                    const cls = cn(
                      'px-4 py-3 align-middle',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.className,
                    );
                    return c.rowHeader ? (
                      <th key={c.id} scope="row" className={cn(cls, 'font-bold')}>
                        {content}
                      </th>
                    ) : (
                      <td key={c.id} className={cls}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <nav
          aria-label={intl.formatMessage({ id: 'tabla.paginacion' })}
          className="mt-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm font-bold" role="status">
            {intl.formatMessage({ id: 'tabla.mostrando' }, { desde: from, hasta: to, total })}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secundaria"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="size-5" />}
            >
              {intl.formatMessage({ id: 'tabla.anterior' })}
            </Button>
            <span className="text-sm font-bold">
              {intl.formatMessage({ id: 'tabla.pagina_de' }, { pagina: page, paginas: pages })}
            </span>
            <Button
              variant="secundaria"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="size-5" />}
            >
              {intl.formatMessage({ id: 'tabla.siguiente' })}
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
