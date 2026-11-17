import { useId, type ReactNode } from 'react';
import { PenLine, ShieldCheck } from 'lucide-react';
import { useIntl } from 'react-intl';
import { cn } from '@/lib/cn';
import { Checkbox } from './Choices';
import { Input } from './Inputs';

/** Normaliza para comparar nombres (sin tildes, mayúsculas ni espacios dobles). */
export const normalizarNombre = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

export interface SignaturePadProps {
  /** Nombre tecleado por la persona. */
  value: string;
  onChange: (value: string) => void;
  /** Etiqueta del campo ("Escribe tu nombre completo para firmar"). */
  label?: string;
  help?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * Firma digital por nombre tecleado (sin canvas). Muestra una vista previa de la firma.
 * Es la parte "nombre" de <SignatureConsent/>; úsala sola si solo hace falta el nombre.
 */
export function SignaturePad({
  value,
  onChange,
  label,
  help,
  error,
  disabled,
  autoComplete = 'name',
  className,
}: SignaturePadProps) {
  const intl = useIntl();
  return (
    <div className={className}>
      <Input
        label={label ?? intl.formatMessage({ id: 'firma.etiqueta_nombre' })}
        help={help}
        error={error}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        required
      />
      <div
        className="mt-3 flex min-h-[72px] items-center gap-3 rounded-control border-2 border-dashed border-borde bg-papel px-4 py-3"
        aria-hidden
      >
        <PenLine className="size-6 shrink-0 text-tinta-suave" />
        <span className="truncate font-titulo text-2xl font-semibold">
          {value || (
            <span className="text-tinta-suave">
              {intl.formatMessage({ id: 'firma.vista_previa' })}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export interface SignatureConsentProps {
  nombre: string;
  onNombreChange: (v: string) => void;
  aceptado: boolean;
  onAceptadoChange: (v: boolean) => void;
  /** Texto de la casilla ("Entiendo y acepto el tratamiento de mis datos..."). */
  textoAceptacion: ReactNode;
  /** Nombre completo registrado: si se pasa, la firma solo es válida si coincide. */
  nombreEsperado?: string;
  /** Sello de tiempo del servidor, cuando ya se firmó. Si falta, se explica que se registrará al firmar. */
  sello?: Date | string | number | null;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
}

/** ¿Se puede enviar la firma? (nombre coherente + casilla marcada). */
export function firmaValida({
  nombre,
  aceptado,
  nombreEsperado,
}: Pick<SignatureConsentProps, 'nombre' | 'aceptado' | 'nombreEsperado'>) {
  if (!aceptado || nombre.trim().length < 3) return false;
  return nombreEsperado ? normalizarNombre(nombre) === normalizarNombre(nombreEsperado) : true;
}

/**
 * Firma + consentimiento: nombre tecleado + casilla de aceptación + sello de tiempo visible.
 * Con `nombreEsperado`, avisa en claro si el nombre no coincide.
 */
export function SignatureConsent({
  nombre,
  onNombreChange,
  aceptado,
  onAceptadoChange,
  textoAceptacion,
  nombreEsperado,
  sello,
  disabled,
  error,
  className,
}: SignatureConsentProps) {
  const intl = useIntl();
  const id = useId();
  const mismatch =
    !!nombreEsperado &&
    nombre.trim().length > 0 &&
    normalizarNombre(nombre) !== normalizarNombre(nombreEsperado);
  const fecha = sello
    ? intl.formatMessage(
        { id: 'firma.sello_firmado' },
        {
          fecha: intl.formatDate(sello, { day: 'numeric', month: 'long', year: 'numeric' }),
          hora: intl.formatTime(sello, { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      )
    : null;
  return (
    <div className={cn('space-y-5', className)}>
      <SignaturePad
        value={nombre}
        onChange={onNombreChange}
        disabled={disabled}
        error={
          error ?? (mismatch ? intl.formatMessage({ id: 'firma.error_no_coincide' }) : undefined)
        }
        help={
          nombreEsperado
            ? intl.formatMessage({ id: 'firma.ayuda_nombre_esperado' }, { nombre: nombreEsperado })
            : undefined
        }
      />
      <Checkbox
        id={`${id}-acepto`.replace(/:/g, '')}
        label={textoAceptacion}
        checked={aceptado}
        onCheckedChange={onAceptadoChange}
        disabled={disabled}
        required
      />
      <div
        role="status"
        className={cn(
          'flex items-center gap-3 rounded-control border-2 border-borde px-4 py-3 text-base',
          sello ? 'bg-verde-tinte' : 'bg-limon-tinte',
        )}
      >
        <ShieldCheck aria-hidden className="size-6 shrink-0" />
        <span>{fecha ?? intl.formatMessage({ id: 'firma.sello_pendiente' })}</span>
      </div>
    </div>
  );
}
