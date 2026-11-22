import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Semaforo,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

interface EstudianteTablero {
  id: number;
  usuario_id: number;
  nombre_completo: string;
  codigo_estudiante: string;
  email: string;
  programa_id: number;
  programa_nombre?: string;
  estado_cuenta: string;
  estado_plan?: string;
  semaforo?: 'VERDE' | 'AMARILLO' | 'ROJO' | null;
  paso_actual?: number;
  pendientes?: number;
}

interface ProgramaOption {
  id: number;
  nombre: string;
}

export default function TableroBienestar() {
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [estudiantes, setEstudiantes] = useState<EstudianteTablero[]>([]);
  const [total, setTotal] = useState(0);
  const [programas, setProgramas] = useState<ProgramaOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState<string>('');
  const [filtroSemaforo, setFiltroSemaforo] = useState<string>('');
  const [soloPendientes, setSoloPendientes] = useState(false);

  const cargarDatos = () => {
    setCargando(true);
    const query: Record<string, any> = {};
    if (busqueda.trim()) query.q = busqueda.trim();
    if (filtroPrograma) query.programa_id = Number(filtroPrograma);
    if (filtroSemaforo) query.semaforo = filtroSemaforo;
    if (soloPendientes) query.con_pendientes = true;

    api
      .get<{ items: EstudianteTablero[]; total: number }>('/estudiantes', { query })
      .then((data) => {
        setEstudiantes(data.items || []);
        setTotal(data.total || 0);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('bienestar.error_cargar_tablero'));
        setCargando(false);
      });
  };

  useEffect(() => {
    // Cargar programas para el filtro
    api
      .get<{ items: any[] }>('/usuarios/programas')
      .then((data) => {
        setProgramas(
          (data.items || []).map((p) => ({
            id: p.id,
            nombre: p.nombre_programa || p.nombre,
          })),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, filtroPrograma, filtroSemaforo, soloPendientes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.tablero_titulo')}
          description={t('bienestar.tablero_descripcion', { total })}
        />
        <Button variant="primaria" onClick={() => navigate('/bienestar/alta')}>
          {t('bienestar.boton_alta_estudiante')}
        </Button>
      </div>

      {/* Barra de filtros */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label={t('bienestar.filtro_buscar')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('bienestar.filtro_buscar_placeholder')}
          />

          <Select
            label={t('bienestar.filtro_programa')}
            value={filtroPrograma}
            onChange={(e) => setFiltroPrograma(e.target.value)}
          >
            <option value="">{t('bienestar.todos_los_programas')}</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>

          <Select
            label={t('bienestar.filtro_semaforo')}
            value={filtroSemaforo}
            onChange={(e) => setFiltroSemaforo(e.target.value)}
          >
            <option value="">{t('bienestar.todos_los_semaforos')}</option>
            <option value="VERDE">{t('semaforo.VERDE')}</option>
            <option value="AMARILLO">{t('semaforo.AMARILLO')}</option>
            <option value="ROJO">{t('semaforo.ROJO')}</option>
            <option value="SIN_SEMAFORO">{t('bienestar.sin_semaforo')}</option>
          </Select>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-tinta">
              <input
                type="checkbox"
                checked={soloPendientes}
                onChange={(e) => setSoloPendientes(e.target.checked)}
                className="size-4 rounded border-2 border-borde text-cobalto focus:ring-cobalto"
              />
              <span>{t('bienestar.solo_con_pendientes')}</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Lista de estudiantes */}
      {cargando ? (
        <LoadingState label={t('bienestar.cargando_estudiantes')} />
      ) : error ? (
        <EmptyState title={t('bienestar.error_titulo')} description={error} />
      ) : estudiantes.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <h3 className="font-titulo text-lg font-bold">{t('bienestar.sin_estudiantes_titulo')}</h3>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            {t('bienestar.sin_estudiantes_desc')}
          </p>
          <div className="pt-2">
            <Button variant="secundaria" onClick={() => navigate('/bienestar/alta')}>
              {t('bienestar.boton_alta_estudiante')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {estudiantes.map((est) => (
            <Card
              key={est.id}
              className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:border-cobalto transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-titulo text-lg font-bold text-tinta">
                    {est.nombre_completo}
                  </h3>
                  <span className="rounded bg-papel px-2 py-0.5 text-xs font-semibold text-tinta-suave border border-borde">
                    Doc: {est.codigo_estudiante}
                  </span>
                  {est.semaforo && <Semaforo estado={est.semaforo} size="sm" />}
                </div>
                <p className="text-sm text-tinta-suave">
                  {est.programa_nombre || t('bienestar.sin_programa')} · {est.email}
                </p>
                {est.pendientes !== undefined && est.pendientes > 0 && (
                  <span className="inline-block rounded bg-mandarina-tinte px-2 py-0.5 text-xs font-bold text-mandarina-oscuro">
                    {t('bienestar.n_pendientes', { n: est.pendientes })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link to={`/bienestar/estudiantes/${est.id}`}>
                  <Button variant="secundaria">
                    {t('bienestar.ver_expediente')}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
