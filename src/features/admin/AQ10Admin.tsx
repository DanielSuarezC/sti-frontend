import { useEffect, useState } from 'react';
import { RefreshCw, Save, Sparkles } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Input,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useFmt } from '@/lib/useT';

interface Aq10ConfigResponse {
  version: string | number;
  nombre: string;
  idioma: string;
  fuente?: string;
  punto_corte: number;
  instrucciones?: string;
  items: Array<{
    numero: number;
    texto?: string;
    enunciado?: string;
    puntua_si?: string;
    sentido?: string;
    dominio?: string;
  }>;
  versiones: Array<{
    id: number;
    version: string | number;
    activo: boolean;
    punto_corte: number;
    created_at: string;
  }>;
}

export default function AQ10Admin() {
  const t = useT();
  const f = useFmt();
  const { toast } = useToast();

  const [data, setData] = useState<Aq10ConfigResponse | null>(null);
  const [puntoCorte, setPuntoCorte] = useState<number>(6);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [inicializando, setInicializando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    setError(null);
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
    try {
      const res = await api.put<{ punto_corte: number; detail: string }>('/admin/aq10/punto-corte', {
        punto_corte: Number(puntoCorte),
      });
      toast({
        variant: 'exito',
        title: t('admin.aq10.guardado_exito'),
        description: res.detail,
      });
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: t('admin.aq10.error_guardar'),
        description: apiErr.detail || 'Verifique el valor ingresado (debe estar entre 1 y 10).',
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleInicializarAQ10 = async () => {
    setInicializando(true);
    try {
      await api.post('/admin/aq10/inicializar', {});
      toast({
        variant: 'exito',
        title: 'Instrumento cargado exitosamente',
        description: 'Se ha inicializado la versión 1.0 del AQ-10 Adultos (Allison et al., 2012).',
      });
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: 'No se pudo cargar el AQ-10',
        description: apiErr.detail || 'Ocurrió un error al cargar la semilla en la base de datos.',
      });
    } finally {
      setInicializando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('admin.aq10.cargando')} />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('admin.aq10.titulo')}
          description={t('admin.aq10.descripcion')}
        />
        <Card className="p-8 text-center max-w-xl mx-auto space-y-4">
          <Sparkles className="h-10 w-10 text-cobalto mx-auto" />
          <h3 className="font-titulo text-lg font-bold">Instrumento AQ-10 pendiente de inicialización</h3>
          <p className="text-sm text-tinta-suave">
            {error || 'El instrumento de tamizaje AQ-10 aún no ha sido cargado en este entorno de base de datos.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primaria"
              loading={inicializando}
              onClick={handleInicializarAQ10}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Cargar AQ-10 oficial (Allison et al., 2012)
            </Button>
            <Button variant="secundaria" onClick={cargarDatos}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.aq10.titulo')}
        description={t('admin.aq10.descripcion')}
      />

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
        <CardTitle>{t('admin.aq10.items_titulo')} ({data.items.length})</CardTitle>
        <p className="text-xs text-tinta-suave">
          Cada ítem puntúa 1 punto cuando la respuesta coincide con el sentido establecido. Un puntaje total igual o superior al punto de corte ({data.punto_corte}) alerta a Bienestar.
        </p>
        <ol className="divide-y divide-borde text-sm">
          {data.items.map((it) => {
            const textoEnunciado = it.texto || it.enunciado || 'Enunciado no disponible';
            const sentidoPuntuacion = it.puntua_si || it.sentido || 'No especificado';
            return (
              <li key={it.numero} className="py-3 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cobalto-claro/30 font-bold text-cobalto text-xs">
                  {it.numero}
                </span>
                <div className="flex-1">
                  <p className="text-tinta font-medium leading-relaxed">{textoEnunciado}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tinta-suave">
                    <span>
                      <strong className="text-tinta font-semibold">{t('admin.aq10.sentido')}:</strong> Puntúa 1 si responde {sentidoPuntuacion.toLowerCase()}
                    </span>
                    {it.dominio && <span>· <strong className="text-tinta font-semibold">{t('admin.aq10.dominio')}:</strong> {it.dominio}</span>}
                  </div>
                </div>
              </li>
            );
          })}
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
