import { useState, useRef } from 'react';
import { FileCheck, Upload, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  PageHeader,
  useToast,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT } from '@/lib/useT';

interface FilaError {
  fila: number;
  campo?: string;
  error?: string;
  mensaje?: string;
}

interface ResultadoImportacion {
  nombre_archivo: string;
  dry_run: boolean;
  total_filas: number;
  filas_validas?: number;
  validas?: number;
  estudiantes_creados?: number;
  usuarios_creados?: number;
  creados?: number;
  errores: FilaError[];
}

export default function ImportacionEstudiantes() {
  const t = useT();
  const { toast } = useToast();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [omitirErrores, setOmitirErrores] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescargarPlantillaXLSX = async () => {
    setDescargando(true);
    try {
      await api.downloadFile('/admin/estudiantes/plantilla-xlsx', 'plantilla_estudiantes.xlsx');
      toast({
        variant: 'exito',
        title: 'Plantilla Excel descargada',
        description: 'Se descargó el archivo plantilla_estudiantes.xlsx con el formato oficial.',
      });
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: 'Error al descargar la plantilla Excel',
        description: apiErr.detail || 'No se pudo descargar la plantilla.',
      });
    } finally {
      setDescargando(false);
    }
  };

  const handleDescargarPlantillaCSV = async () => {
    setDescargando(true);
    try {
      await api.downloadFile('/admin/estudiantes/plantilla-csv', 'plantilla_estudiantes.csv');
      toast({
        variant: 'exito',
        title: 'Plantilla CSV descargada',
        description: 'Se descargó el archivo plantilla_estudiantes.csv.',
      });
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: 'Error al descargar la plantilla CSV',
        description: apiErr.detail || 'No se pudo descargar la plantilla.',
      });
    } finally {
      setDescargando(false);
    }
  };

  const ejecutarImportacion = async (esDryRun: boolean) => {
    if (!archivo) return;
    setProcesando(true);
    setErrorGlobal(null);

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res = await api.post<ResultadoImportacion>(
        `/admin/estudiantes/importar?dry_run=${esDryRun}&omitir_errores=${omitirErrores}`,
        formData
      );
      setResultado(res);
      if (!esDryRun) {
        toast({
          variant: 'exito',
          title: 'Importación completada',
          description: `Se procesó exitosamente el archivo ${archivo.name}. Creados: ${res.creados ?? res.estudiantes_creados ?? 0}`,
        });
      } else {
        toast({
          variant: 'info',
          title: 'Validación completada',
          description: `El archivo contiene ${res.total_filas} filas. Filas válidas: ${res.validas ?? res.filas_validas ?? 0}, Errores: ${res.errores.length}`,
        });
      }
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorGlobal(apiErr.detail || t('admin.csv.error_procesar'));
      toast({
        variant: 'error',
        title: 'Error en la importación',
        description: apiErr.detail || 'No fue posible procesar el archivo seleccionado.',
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.csv.titulo')}
          description="Carga masiva de estudiantes matriculados (Vía 3) mediante archivos Excel (.xlsx) o CSV (.csv)."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primaria"
            loading={descargando}
            onClick={handleDescargarPlantillaXLSX}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Descargar plantilla Excel (.xlsx)
          </Button>
          <Button
            variant="secundaria"
            loading={descargando}
            onClick={handleDescargarPlantillaCSV}
          >
            <FileText className="mr-2 h-4 w-4" />
            Descargar plantilla CSV
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6 max-w-2xl">
        <CardTitle>{t('admin.csv.seleccionar_archivo_titulo')}</CardTitle>
        <p className="text-xs text-tinta-suave">
          Soporta formatos <strong>.xlsx (Microsoft Excel)</strong> y <strong>.csv (delimitado por comas o punto y coma)</strong> de hasta 2 MB (máximo 1000 filas).
        </p>

        <div className="space-y-4">
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            ref={fileInputRef}
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setResultado(null);
              setErrorGlobal(null);
            }}
            className="block w-full text-sm text-tinta-suave file:mr-4 file:py-2.5 file:px-4 file:rounded-control file:border-0 file:text-sm file:font-semibold file:bg-cobalto-claro/20 file:text-cobalto hover:file:bg-cobalto-claro/30"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={omitirErrores}
              onChange={(e) => setOmitirErrores(e.target.checked)}
            />
            <span className="text-sm">
              {t('admin.csv.opcion_omitir_errores')}
            </span>
          </label>
        </div>

        {errorGlobal && (
          <div className="rounded-control bg-alerta-fondo p-4 text-sm text-alerta">
            {errorGlobal}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="secundaria"
            loading={procesando}
            disabled={!archivo}
            onClick={() => ejecutarImportacion(true)}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            {t('admin.csv.boton_validar_dry_run')}
          </Button>

          <Button
            variant="primaria"
            loading={procesando}
            disabled={!archivo || (resultado?.errores && resultado.errores.length > 0 && !omitirErrores)}
            onClick={() => ejecutarImportacion(false)}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('admin.csv.boton_importar_definitivo')}
          </Button>
        </div>
      </Card>

      {/* Resultados de validación o importación */}
      {resultado && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-borde pb-3">
            <div>
              <CardTitle>
                {resultado.dry_run
                  ? t('admin.csv.resultado_simulacion')
                  : t('admin.csv.resultado_exito')}
              </CardTitle>
              <p className="text-xs text-tinta-suave">{resultado.nombre_archivo}</p>
            </div>
            <Badge color={resultado.dry_run ? 'mandarina' : 'limon'}>
              {resultado.dry_run ? t('admin.csv.modo_dry_run') : t('admin.csv.importado')}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded bg-fondo-suave p-3">
              <p className="text-xs text-tinta-suave">{t('admin.csv.total_filas')}</p>
              <p className="text-xl font-bold">{resultado.total_filas}</p>
            </div>
            <div className="rounded bg-fondo-suave p-3">
              <p className="text-xs text-tinta-suave">{t('admin.csv.filas_validas')}</p>
              <p className="text-xl font-bold text-semaforo-verde">{resultado.validas ?? resultado.filas_validas ?? 0}</p>
            </div>
            <div className="rounded bg-fondo-suave p-3">
              <p className="text-xs text-tinta-suave">{t('admin.csv.con_errores')}</p>
              <p className="text-xl font-bold text-alerta">{resultado.errores.length}</p>
            </div>
          </div>

          {!resultado.dry_run && (
            <p className="text-sm font-semibold text-semaforo-verde">
              {t('admin.csv.resumen_creados', {
                est: resultado.creados ?? resultado.estudiantes_creados ?? 0,
                usr: resultado.creados ?? resultado.usuarios_creados ?? 0,
              })}
            </p>
          )}

          {resultado.errores.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-alerta font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.csv.detalle_errores')}
              </div>
              <ul className="divide-y divide-borde border border-borde rounded-control max-h-60 overflow-y-auto text-xs">
                {resultado.errores.map((err, idx) => (
                  <li key={idx} className="p-2.5 flex justify-between gap-4">
                    <span className="font-semibold">
                      {t('admin.csv.fila_n', { n: err.fila })}
                      {err.campo && ` · [${err.campo}]`}
                    </span>
                    <span className="text-tinta-suave text-right">{err.mensaje || err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
