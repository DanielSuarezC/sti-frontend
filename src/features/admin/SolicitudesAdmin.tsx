import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
  useToast,
} from '@/components/ui';
import { useIntl } from 'react-intl';
import { api, getErrorMessage, type ApiError } from '@/lib/api';
import { AccesoDialog, type AccesoCuenta } from '@/features/_shared/AccesoEntregado';
import { useT, useEnum, useFmt } from '@/lib/useT';
import type { Pagina } from '@/lib/types';

interface SolicitudItem {
  id: number;
  codigo_estudiantil: string;
  email_institucional: string;
  nombre_completo: string;
  telefono?: string;
  programa_id?: number;
  programa_nombre?: string;
  estado: string;
  verificada_directorio: boolean;
  created_at: string;
  revisado_at?: string;
  motivo_rechazo?: string;
}

export default function SolicitudesAdmin() {
  const t = useT();
  const intl = useIntl();
  const { toast } = useToast();
  const e = useEnum();
  const f = useFmt();

  const [data, setData] = useState<Pagina<SolicitudItem> | null>(null);
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('PENDIENTE');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Rechazar
  const [solicitudRechazar, setSolicitudRechazar] = useState<SolicitudItem | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [guardandoRechazo, setGuardandoRechazo] = useState(false);

  // Procesando aprobación
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [accesoAprobado, setAccesoAprobado] = useState<{ acceso: AccesoCuenta; nombre: string } | null>(null);

  const cargarSolicitudes = (numPagina = 1) => {
    setCargando(true);
    const queryParams: Record<string, any> = { page: numPagina, page_size: 15 };
    if (estadoFiltro) queryParams.estado = estadoFiltro;

    api
      .get<Pagina<SolicitudItem>>('/solicitudes', { query: queryParams })
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.solicitudes.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarSolicitudes(page);
  }, [page, estadoFiltro]);

  const handleAprobar = async (s: SolicitudItem) => {
    setProcesandoId(s.id);
    try {
      const res = await api.post<{ acceso?: AccesoCuenta | null }>(`/solicitudes/${s.id}/aprobar`, {});
      toast({
        variant: 'exito',
        title: 'Solicitud aprobada',
        description: res.acceso
          ? `La cuenta de ${s.nombre_completo} quedó creada. Entréguele los datos de acceso que se muestran en pantalla.`
          : `La solicitud de ${s.nombre_completo} quedó aprobada.`,
      });
      if (res.acceso) setAccesoAprobado({ acceso: res.acceso, nombre: s.nombre_completo });
      cargarSolicitudes(page);
    } catch (err) {
      toast({
        variant: 'error',
        title: 'No se pudo aprobar la solicitud',
        description: getErrorMessage(err, intl),
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async () => {
    if (!solicitudRechazar) return;
    setGuardandoRechazo(true);
    try {
      await api.post(`/solicitudes/${solicitudRechazar.id}/rechazar`, {
        motivo: motivoRechazo.trim(),
      });
      setSolicitudRechazar(null);
      setMotivoRechazo('');
      cargarSolicitudes(page);
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.solicitudes.error_rechazar'));
    } finally {
      setGuardandoRechazo(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.solicitudes.titulo')}
        description={t('admin.solicitudes.descripcion')}
      />

      <Card className="p-4">
        <div className="max-w-xs">
          <Select
            label={t('admin.solicitudes.filtro_estado')}
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('comun.todos')}</option>
            <option value="PENDIENTE">{t('admin.solicitudes.pendientes')}</option>
            <option value="APROBADA">{t('admin.solicitudes.aprobadas')}</option>
            <option value="RECHAZADA">{t('admin.solicitudes.rechazadas')}</option>
          </Select>
        </div>
      </Card>

      {cargando ? (
        <LoadingState label={t('admin.solicitudes.cargando')} />
      ) : error || !data ? (
        <EmptyState
          title={t('admin.solicitudes.error_titulo')}
          description={error ?? t('admin.solicitudes.error_cargar')}
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          title={t('admin.solicitudes.sin_solicitudes_titulo')}
          description={t('admin.solicitudes.sin_solicitudes_desc')}
        />
      ) : (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-borde text-xs uppercase text-tinta-suave">
                <tr>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_fecha')}</th>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_estudiante')}</th>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_programa')}</th>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_directorio')}</th>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_estado')}</th>
                  <th className="py-3 px-4">{t('admin.solicitudes.columna_acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {data.items.map((s) => (
                  <tr key={s.id} className="hover:bg-fondo-suave/50">
                    <td className="py-3 px-4 text-xs text-tinta-suave">
                      {f.fecha(s.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{s.nombre_completo}</p>
                      <p className="text-xs text-tinta-suave">
                        {s.codigo_estudiantil} · {s.email_institucional}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {s.programa_nombre ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      {s.verificada_directorio ? (
                        <Badge color="limon">{t('admin.solicitudes.directorio_coincide')}</Badge>
                      ) : (
                        <Badge color="mandarina">{t('admin.solicitudes.sin_verificar')}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        color={
                          s.estado === 'APROBADA'
                            ? 'limon'
                            : s.estado === 'RECHAZADA'
                            ? 'mandarina'
                            : 'cobalto'
                        }
                      >
                        {e('estado_solicitud', s.estado)}
                      </Badge>
                      {s.motivo_rechazo && (
                        <p className="text-xs text-alerta mt-1 max-w-xs">{s.motivo_rechazo}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.estado === 'PENDIENTE' && (
                        <div className="flex gap-2">
                          <Button
                            variant="primaria"
                            loading={procesandoId === s.id}
                            onClick={() => handleAprobar(s)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            {t('admin.solicitudes.boton_aprobar')}
                          </Button>
                          <Button
                            variant="peligro"
                            onClick={() => {
                              setSolicitudRechazar(s);
                              setMotivoRechazo('');
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            {t('admin.solicitudes.boton_rechazar')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-borde">
            <span className="text-xs text-tinta-suave">
              Página {data.page} ({data.total} solicitudes)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secundaria"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secundaria"
                disabled={data.page * data.page_size >= data.total}
                onClick={() => setPage(data.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </Card>
      )}

      <AccesoDialog
        acceso={accesoAprobado?.acceso ?? null}
        nombre={accesoAprobado?.nombre}
        titulo="Solicitud aprobada"
        onClose={() => setAccesoAprobado(null)}
      />

      {/* Modal Rechazar */}
      <Dialog
        open={!!solicitudRechazar}
        onOpenChange={(open) => !open && setSolicitudRechazar(null)}
        title={t('admin.solicitudes.modal_rechazar_titulo')}
        description={`${solicitudRechazar?.nombre_completo ?? ''} (${solicitudRechazar?.codigo_estudiantil ?? ''})`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setSolicitudRechazar(null)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="peligro"
              loading={guardandoRechazo}
              disabled={!motivoRechazo.trim()}
              onClick={handleRechazar}
            >
              {t('admin.solicitudes.confirmar_rechazo')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <Textarea
            label={t('admin.solicitudes.campo_motivo_rechazo')}
            required
            rows={3}
            placeholder={t('admin.solicitudes.motivo_placeholder')}
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
