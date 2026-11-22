import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  History,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface EstudianteItem {
  id: number;
  nombre_completo: string;
  codigo_estudiante: string;
  programa?: string | null;
}

interface InasistenciaRegistro {
  id: number;
  porcentaje_inasistencia: number;
  semestre_academico: string;
  asignatura_id?: number | null;
  fecha_registro: string;
  fuente: string;
  observaciones?: string | null;
  alerta_enviada: boolean;
  created_at: string;
}

interface InasistenciaHistorialResponse {
  umbral: number;
  items: InasistenciaRegistro[];
}

export default function InasistenciaBienestar() {
  const intl = useIntl();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);
  const [searchParams] = useSearchParams();

  // Estudiantes disponibles
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(true);

  // Selección
  const [estudianteId, setEstudianteId] = useState<string>(
    searchParams.get('estudiante_id') || '',
  );

  // Historial de inasistencias del estudiante seleccionado
  const [historial, setHistorial] = useState<InasistenciaHistorialResponse | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Formulario de registro
  const [porcentaje, setPorcentaje] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // 1. Cargar lista de estudiantes
  useEffect(() => {
    api
      .get<{ items: EstudianteItem[] }>('/estudiantes?page_size=100')
      .then((data) => {
        const list = data?.items || [];
        setEstudiantes(list);
        setCargandoEstudiantes(false);
        const primero = list[0];
        if (!estudianteId && primero) {
          setEstudianteId(String(primero.id));
        }
      })
      .catch(() => setCargandoEstudiantes(false));
  }, []);

  // 2. Cargar historial cuando cambie el estudiante seleccionado
  const cargarHistorial = (id: string) => {
    if (!id) {
      setHistorial(null);
      return;
    }
    setCargandoHistorial(true);
    api
      .get<InasistenciaHistorialResponse>(`/estudiantes/${id}/inasistencia`)
      .then((data) => {
        setHistorial(data);
        setCargandoHistorial(false);
      })
      .catch(() => {
        setHistorial(null);
        setCargandoHistorial(false);
      });
  };

  useEffect(() => {
    if (estudianteId) {
      cargarHistorial(estudianteId);
    }
  }, [estudianteId]);

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteId) {
      setErrorEnvio('Debes seleccionar un estudiante.');
      return;
    }
    const pct = parseFloat(porcentaje);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setErrorEnvio('El porcentaje de inasistencia debe estar entre 0 y 100%.');
      return;
    }

    setGuardando(true);
    setErrorEnvio(null);
    setMensajeExito(null);

    try {
      await api.post(`/estudiantes/${estudianteId}/inasistencia`, {
        porcentaje_inasistencia: pct,
        fecha_registro: fecha,
        observaciones: motivo.trim() || null,
      });

      setMensajeExito(t('bienestar.inasistencia_registrada_exito'));
      setPorcentaje('');
      setMotivo('');
      // Refrescar historial
      cargarHistorial(estudianteId);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorEnvio(apiErr.detail || t('bienestar.error_registrar_inasistencia'));
    } finally {
      setGuardando(false);
    }
  };

  const estudianteSeleccionado = estudiantes.find((e) => String(e.id) === estudianteId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader
        title={t('bienestar.inasistencia_titulo')}
        description="Registra y monitorea el porcentaje acumulado de inasistencias de los estudiantes con respecto al umbral institucional."
      />

      {/* Selector de estudiante */}
      <Card className="p-5 bg-papel space-y-3">
        <label className="block text-sm font-bold text-tinta">
          Seleccionar estudiante (por nombre o cédula / documento)
        </label>
        {cargandoEstudiantes ? (
          <LoadingState rows={1} label="Cargando estudiantes..." />
        ) : (
          <Select
            label="Estudiante"
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            className="w-full font-medium"
          >
            <option value="">Selecciona un estudiante...</option>
            {estudiantes.map((est) => (
              <option key={est.id} value={est.id}>
                {est.nombre_completo} — Cédula/Doc: {est.codigo_estudiante} {est.programa ? `(${est.programa})` : ''}
              </option>
            ))}
          </Select>
        )}
        <p className="text-xs text-tinta-suave">
          Nota: En el sistema STI, el identificador semántico institucional para la búsqueda y validación es la <strong>cédula / documento de identidad</strong> del estudiante.
        </p>
      </Card>

      {/* Historial de inasistencias */}
      {estudianteId && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-borde pb-3">
            <div className="flex items-center gap-2">
              <History className="size-5 text-cobalto" />
              <CardTitle className="text-lg">
                Historial de inasistencias de {estudianteSeleccionado?.nombre_completo || 'estudiante'}
              </CardTitle>
            </div>
            {historial && (
              <Badge color={historial.umbral ? 'mandarina' : 'cobalto'}>
                Umbral institucional de alerta: {historial.umbral}%
              </Badge>
            )}
          </div>

          {cargandoHistorial ? (
            <LoadingState rows={2} label="Consultando historial..." />
          ) : !historial || historial.items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sin inasistencias registradas"
              description="Este estudiante no tiene inasistencias reportadas en el periodo académico."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-borde text-xs uppercase text-tinta-suave">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Semestre</th>
                    <th className="py-2.5 px-3">Inasistencia</th>
                    <th className="py-2.5 px-3">Fuente</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                    <th className="py-2.5 px-3">Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {historial.items.map((item) => {
                    const supera = Number(item.porcentaje_inasistencia) >= Number(historial.umbral);
                    return (
                      <tr key={item.id} className="hover:bg-fondo-suave/50">
                        <td className="py-2.5 px-3 font-semibold">{item.fecha_registro}</td>
                        <td className="py-2.5 px-3">{item.semestre_academico}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              supera ? 'text-rojo' : 'text-tinta'
                            }`}
                          >
                            {supera && <AlertTriangle className="size-3.5 text-rojo" />}
                            {item.porcentaje_inasistencia}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          <Badge color={item.fuente === 'SIGAA' ? 'cobalto' : 'turquesa'}>
                            {item.fuente}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-tinta-suave max-w-xs truncate">
                          {item.observaciones || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {item.alerta_enviada ? (
                            <Badge color="fucsia">Alerta enviada</Badge>
                          ) : (
                            <Badge color="limon">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Formulario de nuevo registro */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-borde pb-3">
          <CalendarX className="size-5 text-mandarina" />
          <CardTitle className="text-lg">Registrar nueva inasistencia manual</CardTitle>
        </div>

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

        <form onSubmit={handleRegistrar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Porcentaje acumulado de inasistencia (%)"
              required
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              placeholder="p. ej. 15.5"
            />

            <Input
              label={t('bienestar.campo_fecha_inasistencia')}
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <Textarea
            label={t('bienestar.campo_motivo_inasistencia')}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Observaciones, motivo de la inasistencia o seguimiento brindado..."
            rows={3}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primaria" loading={guardando} disabled={!estudianteId}>
              {t('bienestar.boton_registrar_inasistencia')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
