import { useEffect, useState, useRef } from 'react';
import { Download, FileUp, Plus, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT, useEnum } from '@/lib/useT';

interface EstrategiaDua {
  id: number;
  codigo: string;
  nombre: string;
  principio: string;
  pauta: string;
  punto_verificacion?: string;
  descripcion_pedagogica: string;
  ejemplo_aplicacion?: string;
  orientaciones_docente?: string;
  tecnologia_apoyo?: string;
  escenarios?: string[];
  tipos_barrera?: string[];
  activo: boolean;
}

export default function CatalogoDuaAdmin() {
  const t = useT();
  const e = useEnum();

  const [estrategias, setEstrategias] = useState<EstrategiaDua[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [query, setQuery] = useState('');
  const [principioFiltro, setPrincipioFiltro] = useState('');
  const [soloActivas, setSoloActivas] = useState<string>('');

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<EstrategiaDua | null>(null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [principio, setPrincipio] = useState('REPRESENTACION');
  const [pauta, setPauta] = useState('');
  const [puntoVerificacion, setPuntoVerificacion] = useState('');
  const [descripcionPedagogica, setDescripcionPedagogica] = useState('');
  const [ejemplo, setEjemplo] = useState('');
  const [orientaciones, setOrientaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Modal Importar CSV
  const [modalImportar, setModalImportar] = useState(false);
  const [archivoImportar, setArchivoImportar] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [resultadoImportacion, setResultadoImportacion] = useState<any>(null);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarCatalogo = () => {
    setCargando(true);
    const params: Record<string, any> = {};
    if (query.trim()) params.q = query.trim();
    if (principioFiltro) params.principio = principioFiltro;
    if (soloActivas !== '') params.activa = soloActivas === 'true';

    api
      .get<EstrategiaDua[]>('/catalogo-dua', { query: params })
      .then((res) => {
        setEstrategias(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.dua.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarCatalogo();
  }, [principioFiltro, soloActivas]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarCatalogo();
  };

  const abrirModalCrear = () => {
    setEditando(null);
    setCodigo('');
    setNombre('');
    setPrincipio('REPRESENTACION');
    setPauta('');
    setPuntoVerificacion('');
    setDescripcionPedagogica('');
    setEjemplo('');
    setOrientaciones('');
    setErrorModal(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (est: EstrategiaDua) => {
    setEditando(est);
    setCodigo(est.codigo);
    setNombre(est.nombre);
    setPrincipio(est.principio);
    setPauta(est.pauta);
    setPuntoVerificacion(est.punto_verificacion ?? '');
    setDescripcionPedagogica(est.descripcion_pedagogica);
    setEjemplo(est.ejemplo_aplicacion ?? '');
    setOrientaciones(est.orientaciones_docente ?? '');
    setErrorModal(null);
    setModalAbierto(true);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorModal(null);
    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      principio,
      pauta: pauta.trim(),
      punto_verificacion: puntoVerificacion.trim() || undefined,
      descripcion_pedagogica: descripcionPedagogica.trim(),
      ejemplo_aplicacion: ejemplo.trim() || undefined,
      orientaciones_docente: orientaciones.trim() || undefined,
    };

    try {
      if (editando) {
        await api.put(`/catalogo-dua/${editando.id}`, payload);
      } else {
        await api.post('/catalogo-dua', payload);
      }
      setModalAbierto(false);
      cargarCatalogo();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorModal(apiErr.detail || t('admin.dua.error_guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (est: EstrategiaDua) => {
    try {
      await api.post(`/catalogo-dua/${est.id}/activar`, { activo: !est.activo });
      cargarCatalogo();
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.dua.error_activar'));
    }
  };

  const handleExportar = () => {
    window.open('/api/v1/catalogo-dua/exportar?formato=csv', '_blank');
  };

  const handleEjecutarImportacion = async () => {
    if (!archivoImportar) return;
    setImportando(true);
    setResultadoImportacion(null);

    const formData = new FormData();
    formData.append('archivo', archivoImportar);

    try {
      const res = await api.post<any>(
        `/catalogo-dua/importar?dry_run=${dryRun}`,
        formData
      );
      setResultadoImportacion(res);
      if (!dryRun) {
        cargarCatalogo();
      }
    } catch (err: any) {
      const apiErr = err as ApiError;
      alert(apiErr.detail || t('admin.dua.error_importar'));
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.dua.titulo')}
          description={t('admin.dua.descripcion')}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secundaria" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            {t('admin.dua.boton_exportar')}
          </Button>
          <Button variant="secundaria" onClick={() => setModalImportar(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            {t('admin.dua.boton_importar')}
          </Button>
          <Button variant="primaria" onClick={abrirModalCrear}>
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.dua.boton_nueva')}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label={t('admin.dua.filtro_buscar')}
              placeholder={t('admin.dua.filtro_buscar_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              label={t('admin.dua.filtro_principio')}
              value={principioFiltro}
              onChange={(e) => setPrincipioFiltro(e.target.value)}
            >
              <option value="">{t('admin.dua.todos_los_principios')}</option>
              <option value="COMPROMISO">{e('principio_dua', 'COMPROMISO')}</option>
              <option value="REPRESENTACION">{e('principio_dua', 'REPRESENTACION')}</option>
              <option value="ACCION_EXPRESION">{e('principio_dua', 'ACCION_EXPRESION')}</option>
            </Select>
          </div>
          <div className="w-40">
            <Select
              label={t('admin.dua.filtro_estado')}
              value={soloActivas}
              onChange={(e) => setSoloActivas(e.target.value)}
            >
              <option value="">{t('comun.todos')}</option>
              <option value="true">{t('admin.dua.activas')}</option>
              <option value="false">{t('admin.dua.inactivas')}</option>
            </Select>
          </div>
          <Button type="submit" variant="secundaria">
            <Search className="mr-1 h-4 w-4" />
            {t('comun.buscar')}
          </Button>
        </form>
      </Card>

      {/* Lista */}
      {cargando ? (
        <LoadingState label={t('admin.dua.cargando')} />
      ) : error ? (
        <EmptyState
          title={t('admin.dua.error_titulo')}
          description={error}
        />
      ) : estrategias.length === 0 ? (
        <EmptyState
          title={t('admin.dua.sin_estrategias_titulo')}
          description={t('admin.dua.sin_estrategias_desc')}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-tinta-suave">
            {t('admin.dua.total_mostradas', { total: estrategias.length })}
          </p>
          <div className="grid gap-4">
            {estrategias.map((est) => (
              <Card key={est.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge color="cobalto">{est.codigo}</Badge>
                      <h4 className="font-titulo text-lg font-bold">{est.nombre}</h4>
                    </div>
                    <p className="text-xs text-tinta-suave">
                      {e('principio_dua', est.principio)} — {est.pauta}
                      {est.punto_verificacion && ` · ${est.punto_verificacion}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="fantasma"
                      onClick={() => handleToggleActivo(est)}
                    >
                      {est.activo ? (
                        <span className="flex items-center gap-1 text-semaforo-verde font-semibold">
                          <ToggleRight className="h-5 w-5" />
                          {t('admin.dua.activa')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-tinta-suave">
                          <ToggleLeft className="h-5 w-5" />
                          {t('admin.dua.inactiva')}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="secundaria"
                      onClick={() => abrirModalEditar(est)}
                    >
                      {t('comun.editar')}
                    </Button>
                  </div>
                </div>

                <p className="text-sm">{est.descripcion_pedagogica}</p>

                {est.ejemplo_aplicacion && (
                  <p className="rounded bg-fondo-suave p-2 text-xs text-tinta-suave">
                    <span className="font-semibold">{t('admin.dua.ejemplo')}: </span>
                    {est.ejemplo_aplicacion}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <Dialog
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        title={editando ? t('admin.dua.modal_editar_titulo') : t('admin.dua.modal_crear_titulo')}
        description={t('admin.dua.modal_desc')}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setModalAbierto(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardando}
              disabled={!codigo.trim() || !nombre.trim() || !descripcionPedagogica.trim()}
              onClick={handleGuardar}
            >
              {t('comun.guardar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          {errorModal && (
            <div className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">
              {errorModal}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('admin.dua.campo_codigo')}
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <Select
              label={t('admin.dua.campo_principio')}
              value={principio}
              onChange={(e) => setPrincipio(e.target.value)}
            >
              <option value="COMPROMISO">{e('principio_dua', 'COMPROMISO')}</option>
              <option value="REPRESENTACION">{e('principio_dua', 'REPRESENTACION')}</option>
              <option value="ACCION_EXPRESION">{e('principio_dua', 'ACCION_EXPRESION')}</option>
            </Select>
          </div>

          <Input
            label={t('admin.dua.campo_nombre')}
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('admin.dua.campo_pauta')}
              required
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
            />
            <Input
              label={t('admin.dua.campo_punto_verificacion')}
              value={puntoVerificacion}
              onChange={(e) => setPuntoVerificacion(e.target.value)}
            />
          </div>

          <Textarea
            label={t('admin.dua.campo_descripcion')}
            required
            rows={3}
            value={descripcionPedagogica}
            onChange={(e) => setDescripcionPedagogica(e.target.value)}
          />

          <Textarea
            label={t('admin.dua.campo_ejemplo')}
            rows={2}
            value={ejemplo}
            onChange={(e) => setEjemplo(e.target.value)}
          />

          <Textarea
            label={t('admin.dua.campo_orientaciones')}
            rows={2}
            value={orientaciones}
            onChange={(e) => setOrientaciones(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Modal Importar */}
      <Dialog
        open={modalImportar}
        onOpenChange={setModalImportar}
        title={t('admin.dua.modal_importar_titulo')}
        description={t('admin.dua.modal_importar_desc')}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setModalImportar(false)}>
              {t('comun.cerrar')}
            </Button>
            <Button
              variant="primaria"
              loading={importando}
              disabled={!archivoImportar}
              onClick={handleEjecutarImportacion}
            >
              {dryRun ? t('admin.dua.boton_validar') : t('admin.dua.boton_importar_confirmar')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <input
            type="file"
            accept=".csv,.json"
            ref={fileInputRef}
            onChange={(e) => setArchivoImportar(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-tinta-suave file:mr-4 file:py-2 file:px-4 file:rounded-control file:border-0 file:text-sm file:font-semibold file:bg-cobalto-claro/20 file:text-cobalto hover:file:bg-cobalto-claro/30"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            <span className="text-sm font-semibold">{t('admin.dua.modo_dry_run')}</span>
          </label>

          {resultadoImportacion && (
            <div className="rounded bg-fondo-suave p-3 text-xs space-y-1">
              <p className="font-bold">{t('admin.dua.resultado_importacion')}:</p>
              <p>{t('admin.dua.filas_procesadas', { n: resultadoImportacion.total ?? resultadoImportacion.procesados ?? 0 })}</p>
              {resultadoImportacion.errores?.length > 0 && (
                <p className="text-alerta font-semibold">
                  {t('admin.dua.con_errores', { n: resultadoImportacion.errores.length })}
                </p>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
