import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { useAnnounce } from '@/lib/announce';
import { Button } from './Button';
import { Card } from './Card';

export interface StepProgressProps {
  /** Paso actual, empezando en 1. */
  current: number;
  total: number;
  /** Nombre de cada paso (opcional). Se muestra el del paso actual. */
  labels?: string[];
  className?: string;
}

/** "Paso 3 de 8" + barra segmentada + lista de pasos. Siempre texto, nunca solo la barra. */
export function StepProgress({ current, total, labels, className }: StepProgressProps) {
  const intl = useIntl();
  return (
    <div className={className}>
      <p className="font-titulo text-lg font-bold">
        {intl.formatMessage({ id: 'wizard.paso_de' }, { actual: current, total })}
        {labels?.[current - 1] ? (
          <span className="font-normal"> · {labels[current - 1]}</span>
        ) : null}
      </p>
      <ol className="mt-3 flex gap-2" aria-label={intl.formatMessage({ id: 'wizard.lista_pasos' })}>
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const done = n < current;
          const isCurrent = n === current;
          return (
            <li
              key={n}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg border-2 border-borde text-sm font-bold',
                done && 'bg-turquesa text-turquesa-on',
                isCurrent && 'bg-limon text-limon-on shadow-plano-sm',
                !done && !isCurrent && 'bg-blanco text-tinta',
              )}
            >
              {done ? (
                <Check aria-hidden className="size-4" strokeWidth={4} />
              ) : (
                <span aria-hidden>{n}</span>
              )}
              <span className="sr-only">
                {intl.formatMessage(
                  {
                    id: done
                      ? 'wizard.paso_hecho'
                      : isCurrent
                        ? 'wizard.paso_actual'
                        : 'wizard.paso_pendiente',
                  },
                  { n, nombre: labels?.[i] ?? '' },
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export interface WizardStep {
  id: string;
  /** Título del paso (h2). */
  title: string;
  /** Una frase: qué se hace en este paso. */
  description?: string;
  content: ReactNode;
  /** `false` bloquea "Siguiente" hasta que el paso sea válido. */
  canContinue?: boolean;
}

export interface WizardProps {
  steps: WizardStep[];
  /** Controlado (índice base 0). Si se omite, el Wizard guarda su propio estado. */
  current?: number;
  onStepChange?: (index: number) => void;
  /** Se llama al pulsar el botón del último paso. */
  onFinish?: () => void;
  finishLabel?: string;
  finishLoading?: boolean;
  /** Se muestra en la franja inferior (p. ej. <AutosaveIndicator/>). */
  footerStatus?: ReactNode;
  className?: string;
}

/**
 * Formulario largo = un tema por pantalla. Progreso visible, "Atrás" a la izquierda,
 * acción principal ("Siguiente"/"Terminar") SIEMPRE abajo a la derecha.
 * Al cambiar de paso, el foco pasa al título y se anuncia "Paso N de M: título".
 */
export function Wizard({
  steps,
  current,
  onStepChange,
  onFinish,
  finishLabel,
  finishLoading,
  footerStatus,
  className,
}: WizardProps) {
  const intl = useIntl();
  const announce = useAnnounce();
  const [inner, setInner] = useState(0);
  const index = Math.min(Math.max(current ?? inner, 0), steps.length - 1);
  const step = steps[index];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    titleRef.current?.focus();
    if (step)
      announce(
        intl.formatMessage(
          { id: 'wizard.anuncio' },
          { actual: index + 1, total: steps.length, titulo: step.title },
        ),
      );
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) return null;
  const go = (i: number) => {
    setInner(i);
    onStepChange?.(i);
  };
  const isLast = index === steps.length - 1;

  return (
    <div className={className}>
      <StepProgress
        current={index + 1}
        total={steps.length}
        labels={steps.map((s) => s.title)}
        className="mb-6"
      />
      <Card padding="lg">
        <h2 ref={titleRef} tabIndex={-1} className="text-xl sm:text-2xl">
          {step.title}
        </h2>
        {step.description && <p className="mt-1 text-base text-tinta-suave">{step.description}</p>}
        <div className="mt-6">{step.content}</div>
        <div className="mt-8 flex flex-col gap-4 border-t-2 border-borde pt-5">
          {footerStatus && <div>{footerStatus}</div>}
          <div className="flex items-center justify-between gap-3">
            <div>
              {index > 0 && (
                <Button
                  variant="secundaria"
                  leftIcon={<ArrowLeft className="size-5" />}
                  onClick={() => go(index - 1)}
                >
                  {intl.formatMessage({ id: 'wizard.atras' })}
                </Button>
              )}
            </div>
            {isLast ? (
              <Button
                loading={finishLoading}
                disabled={step.canContinue === false}
                onClick={onFinish}
                rightIcon={<Check className="size-5" />}
              >
                {finishLabel ?? intl.formatMessage({ id: 'wizard.terminar' })}
              </Button>
            ) : (
              <Button
                disabled={step.canContinue === false}
                onClick={() => go(index + 1)}
                rightIcon={<ArrowRight className="size-5" />}
              >
                {intl.formatMessage({ id: 'wizard.siguiente' })}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
