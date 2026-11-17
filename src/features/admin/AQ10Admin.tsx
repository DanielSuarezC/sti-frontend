import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useFmt } from '@/lib/useT';

interface Aq10ConfigResponse {
  version: number;
  nombre: string;
  idioma: string;
  fuente?: string;
  punto_corte: number;
  instrucciones?: string;
  items: Array<{
    numero: number;
    enunciado: string;
    sentido: string;
    dominio?: string;
  }>;
  versiones: Array<{
    id: number;
    version: number;
    activo: boolean;
    punto_corte: number;
    created_at: string;
  }>;
}

export default function AQ10Admin() {
  const t = useT();
  const f = useFmt();

  const [data, setData] = useState<Aq10ConfigResponse | null>(null);
  const [puntoCorte, setPuntoCorte] = useState<number>(6);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    api
      .get<Aq10ConfigResponse>('/admin/aq10')
      .then((res) => {
        setData(res);
        setPuntoCorte(res.punto_corte);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.aq10.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarPuntoCorte = async () => {
    setGuardando(true);
    setMensajeExito(null);
    try {
      const res = await api.put<{ punto_corte: number; detail: string }>('/admin/aq10/punto-corte', {
        punto_corte: Number(puntoCorte),
      });
      setMensajeExito(res.detail || t('admin.aq10.guardado_exito'));
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.aq10.error_guardar'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('admin.aq10.cargando')} />;
  }

  if (error || !data) {
    return (
      <EmptyState
        title={t('admin.aq10.error_titulo')}
        description={error ?? t('admin.aq10.error_cargar')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.aq10.titulo')}
        description={t('admin.aq10.descripcion')}
      />

      {mensajeExito && (
        <div className="rounded-control bg-verde-claro/30 border border-semaforo-verde p-3 text-sm text-tinta font-semibold">
          {mensajeExito}
        </div>
      )}

      {/* Tarjeta de configuración activa */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-borde pb-3">
          <div>
            <CardTitle>{data.nombre}</CardTitle>
            <p className="text-xs text-tinta-suave">
              {t('admin.aq10.version_activa', { v: data.version })} · {data.idioma.toUpperCase()}
              {data.fuente && ` · ${data.fuente}`}
            </p>
          </div>
          <Badge color="limon">{t('admin.aq10.activo')}</Badge>
        </div>

        <div className="max-w-xs space-y-3">
          <Input
            label={t('admin.aq10.campo_punto_corte')}
            type="number"
            min={1}
            max={10}
            value={puntoCorte}
            onChange={(e) => setPuntoCorte(Number(e.target.value))}
          />
          <p className="text-xs text-tinta-suave">{t('admin.aq10.ayuda_punto_corte')}</p>
          <Button
            variant="primaria"
            loading={guardando}
            onClick={handleGuardarPuntoCorte}
          >
            <Save className="mr-2 h-4 w-4" />
            {t('admin.aq10.boton_actualizar_corte')}
          </Button>
        </div>
      </Card>

      {/* Ítems del AQ-10 */}
      <Card className="space-y-4">
        <CardTitle>{t('admin.aq10.items_titulo')} (10)</CardTitle>
        <ol className="divide-y divide-borde text-sm">
          {data.items.map((it) => (
            <li key={it.numero} className="py-2.5 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cobalto-claro/30 font-bold text-cobalto text-xs">
                {it.numero}
              </span>
              <div className="flex-1">
                <p className="text-tinta font-medium">{it.enunciado}</p>
                <div className="mt-1 flex gap-2 text-xs text-tinta-suave">
                  <span>{t('admin.aq10.sentido')}: {it.sentido}</span>
                  {it.dominio && <span>· {t('admin.aq10.dominio')}: {it.dominio}</span>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Historial de versiones */}
      {data.versiones?.length > 1 && (
        <Card className="space-y-4">
          <CardTitle>{t('admin.aq10.historial_versiones')}</CardTitle>
          <ul className="divide-y divide-borde text-sm">
            {data.versiones.map((v) => (
              <li key={v.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold">
                    {t('admin.aq10.version_numero', { n: v.version })}
                  </span>
                  <span className="text-xs text-tinta-suave ml-2">
                    {t('admin.aq10.corte_label', { corte: v.punto_corte })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tinta-suave">{f.fecha(v.created_at)}</span>
                  {v.activo && <Badge color="limon">{t('admin.aq10.activo')}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
