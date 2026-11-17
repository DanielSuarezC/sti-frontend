import { useEffect, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import type { ModuloId } from '@/lib/pasos';
import { Card } from './Card';
import { ModuloTag } from './ModuloTag';
import { NextStepBanner, type NextStepBannerProps } from './NextStepBanner';

export interface PageHeaderProps {
  /** Título de la página (h1). Un solo h1 por pantalla. */
  title: ReactNode;
  /** UNA línea: qué haces aquí. */
  description?: ReactNode;
  /** Módulo MAAR-TEA al que pertenece la pantalla (muestra su etiqueta de color). */
  modulo?: ModuloId;
  className?: string;
}

export function PageHeader({ title, description, modulo, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      <h1 id="titulo-pagina" tabIndex={-1} className="text-2xl sm:text-3xl">
        {title}
      </h1>
      {description && <p className="mt-2 text-lg text-tinta-suave">{description}</p>}
      {modulo && (
        <div className="mt-3">
          <ModuloTag modulo={modulo} size="sm" />
        </div>
      )}
    </header>
  );
}

export interface PageShellProps extends Omit<PageHeaderProps, 'className'> {
  /** Texto para `document.title` si `title` no es un string. */
  documentTitle?: string;
  /** "Lo que sigue" (limón). Se renderiza SIEMPRE justo bajo el encabezado. */
  nextStep?: NextStepBannerProps;
  /** Acción principal de la pantalla: abajo a la derecha de la tarjeta de contenido. UNA por pantalla. */
  primaryAction?: ReactNode;
  /** Acciones secundarias: abajo a la izquierda de la tarjeta. */
  secondaryActions?: ReactNode;
  /** `false` para dar libertad total de composición (varias tarjetas de colores); las acciones van igual abajo. */
  contentCard?: boolean;
  /** Color de la sombra de la tarjeta de contenido. */
  cardColor?: 'tinta' | 'cobalto' | 'mandarina' | 'fucsia' | 'turquesa' | 'limon' | 'uva';
  children?: ReactNode;
  className?: string;
}

/**
 * Esqueleto predecible de TODA pantalla:
 *   título -> una línea "qué haces aquí" -> "Lo que sigue" -> contenido -> acción principal (abajo a la derecha).
 * Úsalo siempre; no armes encabezados a mano.
 */
export function PageShell({
  title,
  description,
  modulo,
  documentTitle,
  nextStep,
  primaryAction,
  secondaryActions,
  contentCard = true,
  cardColor = 'tinta',
  children,
  className,
}: PageShellProps) {
  const intl = useIntl();
  const text = documentTitle ?? (typeof title === 'string' ? title : undefined);
  useEffect(() => {
    if (text) document.title = intl.formatMessage({ id: 'app.titulo_pagina' }, { pagina: text });
  }, [text, intl]);

  const actions =
    primaryAction || secondaryActions ? (
      <div className="mt-8 flex flex-col-reverse gap-3 border-t-2 border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">{secondaryActions}</div>
        <div className="flex flex-wrap justify-end gap-3">{primaryAction}</div>
      </div>
    ) : null;

  return (
    <div className={cn('mx-auto w-full max-w-5xl', className)}>
      <PageHeader title={title} description={description} modulo={modulo} />
      {nextStep && <NextStepBanner className="mb-8" {...nextStep} />}
      {contentCard ? (
        <Card color={cardColor} padding="lg">
          {children}
          {actions}
        </Card>
      ) : (
        <>
          {children}
          {actions}
        </>
      )}
    </div>
  );
}
