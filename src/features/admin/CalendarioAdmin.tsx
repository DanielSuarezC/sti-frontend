import { useEffect, useState } from 'react';
import { CheckCircle, Plus, Settings2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useFmt } from '@/lib/useT';

interface Calendario {
  id: number;
  semestre_academico: string;
  programa_id?: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_c1: string;
  fecha_c2: string;
  fecha_c3: string;
  fecha_inicio_practicas?: string | null;
  umbral_inasistencia: number;
  activo: boolean;
  semanas_cortes?: Record<string, string>;
}

interface ParametroSistema {
  clave: string;
  valor: string;
  tipo: string;
  descripcion?: string;
  categoria?: string;
}

export default function CalendarioAdmin() {
  const t = useT();
  const f = useFmt();
  const { toast } = useToast();

  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal nuevo calendario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [semestre, setSemestre] = useState('');
  const [fInicio, setFInicio] = useState('');
  const [fFin, setFFin] = useState('');
  const [fC1, setFC1] = useState('');
  const [fC2, setFC2] = useState('');
  const [fC3, setFC3] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Modal editar parámetro
  const [paramEditando, setParamEditando] = useState<ParametroSistema | null>(null);
  const [nuevoValorParam, setNuevoValorParam] = useState('');
  const [guardandoParam, setGuardandoParam] = useState(false);

  const cargarDatos = () => {
    setCargando(true);
    setError(null);
    Promise.all([
      api.get<{ items: Calendario[] } | Calendario[]>('/calendario'),
      api.get<{ items: ParametroSistema[] } | ParametroSistema[]>('/calendario/parametros'),
    ])
      .then(([calsRes, paramsRes]) => {
        const cals = Array.isArray(calsRes) ? calsRes : (calsRes?.items ?? []);
        const params = Array.isArray(paramsRes) ? paramsRes : (paramsRes?.items ?? []);
        setCalendarios(cals);
        setParametros(params);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.calendario.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCalendario = async () => {
    setGuardando(true);
    setErrorModal(null);
    try {
      await api.post('/calendario', {
        semestre_academico: semestre.trim(),
        fecha_inicio: fInicio,
        fecha_fin: fFin,
        fecha_c1: fC1,
        fecha_c2: fC2,
        fecha_c3: fC3,
      });
      toast({
        variant: 'exito',
        title: 'Semestre creado',
        description: `Se registró el calendario académico para ${semestre.trim()}.`,
      });
      setModalAbierto(false);
      setSemestre('');
      setFInicio('');
      setFFin('');
      setFC1('');
      setFC2('');
      setFC3('');
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorModal(apiErr.detail || t('admin.calendario.error_crear'));
    } finally {
      setGuardando(false);
    }
  };

  const handleActivar = async (id: number) => {
    try {
      await api.post(`/calendario/${id}/activar`, {});
      toast({
        variant: 'exito',
        title: 'Semestre activado',
        description: 'El semestre seleccionado ha sido establecido como el semestre académico activo.',
      });
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: t('admin.calendario.error_activar'),
        description: apiErr.detail || 'No se pudo activar el semestre.',
      });
    }
  };

  const handleGuardarParametro = async () => {
    if (!paramEditando) return;
    setGuardandoParam(true);
    try {
      await api.put(`/calendario/parametros/${paramEditando.clave}`, {
        valor: nuevoValorParam,
      });
      toast({
        variant: 'exito',
        title: 'Parámetro actualizado',
        description: `Se actualizó el parámetro ${paramEditando.clave} a ${nuevoValorParam}.`,
      });
      setParamEditando(null);
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: t('admin.calendario.error_guardar_param'),
        description: apiErr.detail || 'No se pudo guardar el parámetro.',
      });
    } finally {
      setGuardandoParam(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('admin.calendario.cargando')} />;
  }

  if (error) {
    return (
      <EmptyState
        title={t('admin.calendario.error_titulo')}
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.calendario.titulo')}
          description={t('admin.calendario.descripcion')}
        />
        <Button variant="primaria" onClick={() => setModalAbierto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.calendario.boton_nuevo')}
        </Button>
      </div>

      {/* Calendarios */}
      <Card className="space-y-4">
        <CardTitle>{t('admin.calendario.semestres_titulo')}</CardTitle>
        {calendarios.length === 0 ? (
          <EmptyState
            title={t('admin.calendario.sin_semestres_titulo')}
            description={t('admin.calendario.sin_semestres_desc')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {calendarios.map((cal) => (
              <div
                key={cal.id}
                className="rounded-control border-2 border-borde bg-blanco p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-titulo text-lg font-bold">{cal.semestre_academico}</h4>
                  {cal.activo ? (
                    <Badge color="limon">{t('admin.calendario.semestre_activo')}</Badge>
                  ) : (
                    <Button
                      variant="fantasma"
                      onClick={() => handleActivar(cal.id)}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      {t('admin.calendario.boton_activar')}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-tinta-suave">{t('admin.calendario.inicio')}: </span>
                    {f.fecha(cal.fecha_inicio)}
                  </div>
                  <div>
                    <span className="font-semibold text-tinta-suave">{t('admin.calendario.fin')}: </span>
                    {f.fecha(cal.fecha_fin)}
                  </div>
                  <div>
                    <span className="font-semibold text-tinta-suave">Corte 1: </span>
                    {f.fecha(cal.fecha_c1)}
                  </div>
                  <div>
                    <span className="font-semibold text-tinta-suave">Corte 2: </span>
                    {f.fecha(cal.fecha_c2)}
                  </div>
                  <div>
                    <span className="font-semibold text-tinta-suave">Corte 3: </span>
                    {f.fecha(cal.fecha_c3)}
                  </div>
                  <div>
                    <span className="font-semibold text-tinta-suave">{t('admin.calendario.umbral_inasistencia')}: </span>
                    {(cal.umbral_inasistencia * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Parámetros del sistema */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-cobalto" />
          <CardTitle>{t('admin.calendario.parametros_titulo')}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b-2 border-borde text-xs uppercase text-tinta-suave">
              <tr>
                <th className="py-3 px-4">{t('admin.calendario.columna_parametro')}</th>
                <th className="py-3 px-4">{t('admin.calendario.columna_valor')}</th>
                <th className="py-3 px-4">{t('admin.calendario.columna_descripcion')}</th>
                <th className="py-3 px-4">{t('admin.calendario.columna_acciones')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {parametros.map((p) => (
                <tr key={p.clave} className="hover:bg-fondo-suave/50">
                  <td className="py-3 px-4 font-mono text-xs font-semibold">{p.clave}</td>
                  <td className="py-3 px-4 font-semibold">{p.valor}</td>
                  <td className="py-3 px-4 text-xs text-tinta-suave">{p.descripcion ?? '—'}</td>
                  <td className="py-3 px-4">
                    <Button
                      variant="secundaria"
                      onClick={() => {
                        setParamEditando(p);
                        setNuevoValorParam(p.valor);
                      }}
                    >
                      {t('comun.editar')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Crear Calendario */}
      <Dialog
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        title={t('admin.calendario.modal_crear_titulo')}
        description={t('admin.calendario.modal_crear_desc')}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setModalAbierto(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardando}
              disabled={!semestre.trim() || !fInicio || !fFin || !fC1 || !fC2 || !fC3}
              onClick={handleCrearCalendario}
            >
              {t('comun.guardar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          {errorModal && (
            <div className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">
              {errorModal}
            </div>
          )}

          <Input
            label={t('admin.calendario.campo_semestre')}
            placeholder="2026-1"
            required
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('admin.calendario.campo_fecha_inicio')}
              type="date"
              required
              value={fInicio}
              onChange={(e) => setFInicio(e.target.value)}
            />
            <Input
              label={t('admin.calendario.campo_fecha_fin')}
              type="date"
              required
              value={fFin}
              onChange={(e) => setFFin(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Corte 1"
              type="date"
              required
              value={fC1}
              onChange={(e) => setFC1(e.target.value)}
            />
            <Input
              label="Corte 2"
              type="date"
              required
              value={fC2}
              onChange={(e) => setFC2(e.target.value)}
            />
            <Input
              label="Corte 3"
              type="date"
              required
              value={fC3}
              onChange={(e) => setFC3(e.target.value)}
            />
          </div>
        </div>
      </Dialog>

      {/* Modal Editar Parámetro */}
      <Dialog
        open={!!paramEditando}
        onOpenChange={(open) => !open && setParamEditando(null)}
        title={t('admin.calendario.modal_param_titulo')}
        description={paramEditando?.clave}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setParamEditando(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardandoParam}
              onClick={handleGuardarParametro}
            >
              {t('comun.guardar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <Input
            label={t('admin.calendario.campo_valor')}
            value={nuevoValorParam}
            onChange={(e) => setNuevoValorParam(e.target.value)}
          />
          {paramEditando?.descripcion && (
            <p className="text-xs text-tinta-suave">{paramEditando.descripcion}</p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
