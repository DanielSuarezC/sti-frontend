import { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Input,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

export default function InasistenciaBienestar() {
  const intl = useIntl();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [estudianteId, setEstudianteId] = useState('');
  const [asignaturaId, setAsignaturaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [horas, setHoras] = useState('2');
  const [motivo, setMotivo] = useState('');
  const [justificada, setJustificada] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteId || !asignaturaId) {
      setErrorEnvio(t('bienestar.error_estudiante_asignatura_req'));
      return;
    }

    setGuardando(true);
    setErrorEnvio(null);
    setMensajeExito(null);

    try {
      await api.post(`/estudiantes/${estudianteId}/inasistencias`, {
        asignatura_id: Number(asignaturaId),
        fecha,
        horas_inasistencia: Number(horas) || 2,
        justificada,
        motivo: motivo.trim() || null,
      });

      setMensajeExito(t('bienestar.inasistencia_registrada_exito'));
      setMotivo('');
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorEnvio(apiErr.detail || t('bienestar.error_registrar_inasistencia'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={t('bienestar.inasistencia_titulo')}
        description={t('bienestar.inasistencia_descripcion')}
      />

      {mensajeExito && (
        <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
          {mensajeExito}
        </div>
      )}

      {errorEnvio && (
        <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
          {errorEnvio}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleRegistrar} className="space-y-4">
          <Input
            label={t('bienestar.campo_id_estudiante')}
            required
            type="number"
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            placeholder="ID del estudiante en el STI"
          />

          <Input
            label={t('bienestar.campo_id_asignatura')}
            required
            type="number"
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            placeholder="ID de la asignatura"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('bienestar.campo_fecha_inasistencia')}
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />

            <Input
              label={t('bienestar.campo_horas_inasistencia')}
              required
              type="number"
              min={1}
              max={12}
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={justificada}
              onChange={(e) => setJustificada(e.target.checked)}
              className="size-4 rounded border-2 border-borde text-cobalto focus:ring-cobalto"
            />
            <span className="font-semibold text-tinta">{t('bienestar.inasistencia_justificada')}</span>
          </label>

          <Textarea
            label={t('bienestar.campo_motivo_inasistencia')}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Observaciones de la inasistencia o soporte..."
            rows={2}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primaria" loading={guardando}>
              {t('bienestar.boton_registrar_inasistencia')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
