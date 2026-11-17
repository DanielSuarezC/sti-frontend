import type { ReactNode } from 'react';
import { CircleCheck, Clock3, FileSignature, ShieldAlert } from 'lucide-react';
import { Badge, Card, CardTitle, Semaforo } from '@/components/ui';
import { COLOR_CLASES } from '@/lib/pasos';
import { cn } from '@/lib/cn';
import { useEnum, useFmt, useT } from '@/lib/useT';
import { Aviso } from './AlertaError';
import { EstadoPlanBadge } from './EstadoBadge';
import { TIPOS_AJUSTE, type Ajuste, type Negociacion, type Plan, type RolFirmante } from './types';

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-bold text-tinta-suave">{label}</dt>
      <dd className="text-base">{children}</dd>
    </div>
  );
}

function AjusteCard({ ajuste }: { ajuste: Ajuste }) {
  const t = useT();
  const e = useEnum();
  const f = useFmt();
  const resp = ajuste.respuesta_estudiante?.respuesta;
  return (
    <li className="rounded-control border-2 border-borde bg-blanco p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="font-titulo text-lg font-semibold">{ajuste.nombre_ajuste}</h4>
        {ajuste.semaforo ? (
          <div className="flex flex-col items-end gap-1">
            <Semaforo estado={ajuste.semaforo.valor} size="sm" />
            {ajuste.semaforo.corte && (
              <span className="text-sm text-tinta-suave">
                {t('comun.plan.semaforo_en_corte', { corte: ajuste.semaforo.corte })}
              </span>
            )}
          </div>
        ) : (
          <Badge>{t('comun.plan.sin_semaforo')}</Badge>
        )}
      </div>
      <p className="mt-2 text-base">{ajuste.descripcion_ajuste}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <Dato label={t('comun.plan.tipo_detalle')}>{e('detalle_ajuste', ajuste.detalle?.tipo)}</Dato>
        <Dato label={t('comun.plan.barrera')}>
          {ajuste.barrera ? e('tipo_barrera', ajuste.barrera.tipo_barrera) : '—'}
          {ajuste.barrera?.escenario ? ` · ${e('escenario', ajuste.barrera.escenario)}` : ''}
        </Dato>
        <Dato label={t('comun.plan.estado_ajuste')}>{e('estado_ajuste', ajuste.estado)}</Dato>
        <Dato label={t('comun.plan.respuesta_estudiante')}>
          {resp ? e('respuesta_estudiante', resp) : t('comun.plan.sin_respuesta')}
        </Dato>
        <Dato label={t('comun.plan.responsable')}>{ajuste.responsable?.nombre_completo ?? '—'}</Dato>
        <Dato label={t('comun.plan.asignatura')}>
          {ajuste.asignatura ? `${ajuste.asignatura.codigo} · ${ajuste.asignatura.nombre}` : '—'}
        </Dato>
        {ajuste.frecuencia && <Dato label={t('comun.plan.frecuencia')}>{ajuste.frecuencia}</Dato>}
        {ajuste.fecha_inicio && (
          <Dato label={t('comun.plan.desde')}>
            {f.fecha(ajuste.fecha_inicio)}
            {ajuste.fecha_fin_prevista ? ` – ${f.fecha(ajuste.fecha_fin_prevista)}` : ''}
          </Dato>
        )}
      </dl>
      {ajuste.justificacion && (
        <p className="mt-3 text-sm text-tinta-suave">
          <span className="font-bold">{t('comun.plan.justificacion')}: </span>
          {ajuste.justificacion}
        </p>
      )}
      {ajuste.negociacion && (
        <p className="mt-3">
          <Badge color="mandarina">
            {t('comun.plan.negociacion_estado', {
              estado: e('estado_negociacion', ajuste.negociacion.estado),
              ciclo: ajuste.negociacion.ciclo,
              max: ajuste.negociacion.max_ciclos,
            })}
          </Badge>
        </p>
      )}
    </li>
  );
}

const ROLES_FIRMA: RolFirmante[] = ['ESTUDIANTE', 'BIENESTAR', 'COORDINADOR'];

export interface PlanViewProps {
  plan: Plan;
  /** Acciones por negociación abierta (p. ej. cerrar una escalada al Comité). */
  negociacionActions?: (n: Negociacion) => ReactNode;
}

/** Vista del plan en lectura: resumen, ajustes por categoría con semáforo, estrategias DUA, firmas y negociaciones. */
export function PlanView({ plan, negociacionActions }: PlanViewProps) {
  const t = useT();
  const e = useEnum();
  const f = useFmt();
  const porTipo = TIPOS_AJUSTE.map((tipo) => ({
    tipo,
    items: plan.ajustes.filter((a) => a.tipo_ajuste === tipo),
  })).filter((g) => g.items.length > 0);

  const firmasVigentes = plan.firmas.filter(
    (x) => x.estado === 'FIRMADA' && x.version === plan.firmas_estado.version,
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="plan-resumen">
        <h2 id="plan-resumen" className="sr-only">
          {t('comun.plan.resumen')}
        </h2>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <Dato label={t('comun.plan.estudiante')}>
            {plan.estudiante.nombre_completo} ({plan.estudiante.codigo_estudiante})
          </Dato>
          <Dato label={t('comun.plan.programa')}>{plan.estudiante.programa ?? '—'}</Dato>
          <Dato label={t('comun.plan.semestre')}>{plan.semestre_academico}</Dato>
          <Dato label={t('comun.plan.estado')}>
            <EstadoPlanBadge estado={plan.estado} />
          </Dato>
          <Dato label={t('comun.plan.version')}>v{plan.version}</Dato>
          <Dato label={t('comun.plan.semaforo')}>
            {plan.semaforo_actual ? (
              <Semaforo estado={plan.semaforo_actual} size="sm" />
            ) : (
              t('grafico.sin_registro')
            )}
          </Dato>
          <Dato label={t('comun.plan.vigencia')}>
            {f.fecha(plan.vigencia_inicio)} – {f.fecha(plan.vigencia_fin)}
          </Dato>
          <Dato label={t('comun.plan.elaborado_por')}>{plan.elaborado_por?.nombre_completo ?? '—'}</Dato>
          <Dato label={t('comun.plan.validado_por')}>
            {plan.validado_por
              ? `${plan.validado_por.nombre_completo} · ${f.fecha(plan.fecha_validacion)}`
              : t('comun.plan.sin_validar')}
          </Dato>
        </dl>
      </section>

      {plan.comentarios_validacion && (
        <Aviso tono="info">
          <p className="font-bold">{t('comun.plan.comentarios_validacion')}</p>
          <p className="mt-1">{plan.comentarios_validacion}</p>
        </Aviso>
      )}

      {(plan.resumen_ejecutivo || plan.justificacion_apoyos) && (
        <section aria-labelledby="plan-texto" className="space-y-3">
          <h3 id="plan-texto" className="text-xl">
            {t('comun.plan.resumen_ejecutivo')}
          </h3>
          {plan.resumen_ejecutivo && <p className="max-w-medida text-base">{plan.resumen_ejecutivo}</p>}
          {plan.justificacion_apoyos && (
            <p className="max-w-medida text-base">
              <span className="font-bold">{t('comun.plan.justificacion_apoyos')}: </span>
              {plan.justificacion_apoyos}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="plan-ajustes" className="space-y-5">
        <h3 id="plan-ajustes" className="text-xl">
          {t('comun.plan.ajustes_titulo', { n: plan.ajustes.length })}
        </h3>
        {porTipo.length === 0 ? (
          <p className="text-base text-tinta-suave">{t('comun.plan.sin_ajustes')}</p>
        ) : (
          porTipo.map((g) => (
            <div key={g.tipo}>
              <h4 className="mb-3 flex items-center gap-2 font-titulo text-lg font-semibold">
                <span
                  aria-hidden
                  className={cn('size-4 rounded-md border-2 border-borde', COLOR_CLASES.cobalto.fondo)}
                />
                {e('tipo_ajuste', g.tipo)} ({g.items.length})
              </h4>
              <ul role="list" className="space-y-3">
                {g.items.map((a) => (
                  <AjusteCard key={a.id} ajuste={a} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="plan-dua" className="space-y-3">
        <h3 id="plan-dua" className="text-xl">
          {t('comun.plan.dua_titulo', { n: plan.estrategias_dua.length })}
        </h3>
        {plan.estrategias_dua.length === 0 ? (
          <p className="text-base text-tinta-suave">{t('comun.plan.sin_dua')}</p>
        ) : (
          <ul role="list" className="space-y-3">
            {plan.estrategias_dua.map((s) => (
              <li key={s.id} className="rounded-control border-2 border-borde bg-cobalto-tinte p-4">
                <p className="font-titulo text-base font-semibold">{s.nombre_estrategia}</p>
                {s.descripcion && <p className="mt-1 text-base">{s.descripcion}</p>}
                <p className="mt-2 flex flex-wrap gap-2">
                  {s.dimension_dua && <Badge color="cobalto">{e('dimension_dua', s.dimension_dua)}</Badge>}
                  <Badge>
                    {s.implementada ? t('comun.plan.dua_implementada') : t('comun.plan.dua_pendiente')}
                  </Badge>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="plan-firmas" className="space-y-3">
        <h3 id="plan-firmas" className="text-xl">
          {t('comun.plan.firmas_titulo')}
        </h3>
        <ul role="list" className="grid gap-3 sm:grid-cols-3">
          {ROLES_FIRMA.map((rol) => {
            const firma = firmasVigentes.find((x) => x.rol_firmante === rol);
            return (
              <li
                key={rol}
                className={cn(
                  'rounded-control border-2 border-borde p-4',
                  firma ? 'bg-verde-tinte' : 'bg-blanco',
                )}
              >
                <p className="flex items-center gap-2 font-titulo text-base font-semibold">
                  {firma ? (
                    <CircleCheck aria-hidden className="size-5" />
                  ) : (
                    <Clock3 aria-hidden className="size-5" />
                  )}
                  {e('rol', rol)}
                </p>
                <p className="mt-1 text-sm">
                  {firma
                    ? t('comun.plan.firmada_por', {
                        nombre: firma.firmante.nombre_completo ?? '',
                        fecha: f.fechaHora(firma.firmado_at),
                      })
                    : t('comun.plan.firma_pendiente')}
                </p>
                {firma && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-tinta-suave">
                    <FileSignature aria-hidden className="size-4" />
                    {t('comun.plan.huella', { hash: firma.hash_corto })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {plan.negociaciones_abiertas.length > 0 && (
        <section aria-labelledby="plan-neg" className="space-y-3">
          <h3 id="plan-neg" className="text-xl">
            {t('comun.plan.negociaciones_titulo', { n: plan.negociaciones_abiertas.length })}
          </h3>
          <ul role="list" className="space-y-3">
            {plan.negociaciones_abiertas.map((n) => (
              <Card as="li" key={n.id} color="mandarina" tinted>
                <CardTitle as="h4" className="flex flex-wrap items-center gap-3 text-lg">
                  {n.ajuste?.nombre_ajuste ?? t('comun.plan.ajuste_retirado')}
                  <Badge color="mandarina" icon={<ShieldAlert />}>
                    {e('estado_negociacion', n.estado)}
                  </Badge>
                </CardTitle>
                <p className="mt-1 text-sm">
                  {t('comun.plan.ciclo_de', { ciclo: n.ciclo, max: n.max_ciclos })}
                </p>
                {n.objecion_estudiante && (
                  <p className="mt-2 text-base">
                    <span className="font-bold">{t('comun.plan.objecion')}: </span>
                    {n.objecion_estudiante}
                  </p>
                )}
                {n.propuesta_bienestar && (
                  <p className="mt-2 text-base">
                    <span className="font-bold">{t('comun.plan.propuesta')}: </span>
                    {n.propuesta_bienestar}
                  </p>
                )}
                {negociacionActions && <div className="mt-3">{negociacionActions(n)}</div>}
              </Card>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
