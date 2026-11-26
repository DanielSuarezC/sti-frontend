import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button, Dialog } from '@/components/ui';
import { Aviso } from './AlertaError';

/**
 * Acceso que devuelve el backend cuando el PERSONAL crea una cuenta o restablece una clave (campo `acceso`).
 * Sin correo electrónico: `DIRECTO` trae una contraseña provisional (se muestra UNA vez); `INVITACION` trae el enlace.
 */
export interface AccesoCuenta {
  modo: 'DIRECTO' | 'INVITACION';
  email: string;
  password_temporal?: string;
  /** Solo viene la primera vez que la cuenta recibe acceso; después es `null`. */
  codigo_recuperacion?: string | null;
  enlace_activacion?: string;
  horas_validez?: number;
}

/** Copia texto al portapapeles; devuelve `false` si el navegador no lo permite. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Descarga un archivo de texto (CSV/TXT) generado en el navegador. */
export function descargarTexto(nombre: string, contenido: string, tipo = 'text/plain') {
  const url = URL.createObjectURL(new Blob([contenido], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Valor que se puede copiar con un botón (credenciales, códigos). Se lee tal cual: sin ocultar. */
export function CampoCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <p className="text-sm font-semibold text-tinta-suave">{etiqueta}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <code className="min-w-0 break-all rounded-control border-2 border-borde bg-papel px-3 py-2 font-mono text-base font-bold">
          {valor}
        </code>
        <Button
          type="button"
          variant="secundaria"
          leftIcon={copiado ? <Check className="size-5" /> : <Copy className="size-5" />}
          onClick={() => {
            void copiarTexto(valor).then((ok) => {
              setCopiado(ok);
              if (ok) window.setTimeout(() => setCopiado(false), 4000);
            });
          }}
        >
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}

/** Texto plano con las credenciales, para guardar en un archivo. */
export function textoAcceso(a: AccesoCuenta, nombre?: string): string {
  const l = [`Sistema Tutor Inteligente (STI) - acceso${nombre ? ` de ${nombre}` : ''}`, `Correo: ${a.email}`];
  if (a.password_temporal) l.push(`Contraseña provisional: ${a.password_temporal}`);
  if (a.enlace_activacion) l.push(`Enlace de activación: ${a.enlace_activacion}`);
  if (a.codigo_recuperacion) l.push(`Código de recuperación: ${a.codigo_recuperacion}`);
  l.push('', 'Cambie la contraseña en «Mi cuenta» después de entrar.');
  return l.join('\n');
}

/** Cuerpo del acceso: credenciales con botones de copiar y de descargar. */
export function AccesoEntregado({ acceso, nombre }: { acceso: AccesoCuenta; nombre?: string }) {
  return (
    <div className="space-y-4">
      <Aviso tono="aviso">
        {acceso.modo === 'DIRECTO'
          ? 'Esta información se muestra una sola vez. Entréguesela a la persona por un medio seguro: no queda guardada en pantalla.'
          : `El enlace vale ${acceso.horas_validez ?? 72} horas. Compártalo con la persona por un medio seguro.`}
      </Aviso>
      <CampoCopiable etiqueta="Correo para iniciar sesión" valor={acceso.email} />
      {acceso.password_temporal && (
        <CampoCopiable etiqueta="Contraseña provisional" valor={acceso.password_temporal} />
      )}
      {acceso.enlace_activacion && (
        <CampoCopiable etiqueta="Enlace de activación" valor={acceso.enlace_activacion} />
      )}
      {acceso.codigo_recuperacion && (
        <CampoCopiable
          etiqueta="Código de recuperación (sirve para recuperar la contraseña sin correo)"
          valor={acceso.codigo_recuperacion}
        />
      )}
      <Button
        type="button"
        variant="secundaria"
        leftIcon={<Download className="size-5" />}
        onClick={() => descargarTexto('acceso-sti.txt', textoAcceso(acceso, nombre))}
      >
        Descargar como archivo
      </Button>
    </div>
  );
}

/** Ventana que muestra un acceso recién creado. `acceso = null` la cierra. */
export function AccesoDialog({
  acceso,
  nombre,
  titulo = 'Cuenta lista para usar',
  descripcion,
  onClose,
}: {
  acceso: AccesoCuenta | null;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={acceso !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={titulo}
      description={
        descripcion ??
        (nombre
          ? `Estos son los datos de acceso de ${nombre}.`
          : 'Estos son los datos de acceso de la cuenta.')
      }
      footer={<Button onClick={onClose}>Ya los entregué</Button>}
    >
      {acceso && <AccesoEntregado acceso={acceso} nombre={nombre} />}
    </Dialog>
  );
}
