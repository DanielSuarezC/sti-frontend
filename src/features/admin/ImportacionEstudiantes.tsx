import { useState, useRef } from 'react';
import { Download, FileCheck, Upload, AlertTriangle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useT } from '@/lib/useT';

interface FilaError {
  fila: number;
  campo?: string;
  error: string;
}

interface ResultadoImportacion {
  nombre_archivo: string;
  dry_run: boolean;
  total_filas: number;
  filas_validas: number;
  estudiantes_creados: number;
  usuarios_creados: number;
  errores: FilaError[];
}

export default function ImportacionEstudiantes() {
  const t = useT();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [omitirErrores, setOmitirErrores] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescargarPlantilla = () => {
    window.open('/api/v1/admin/estudiantes/plantilla-csv', '_blank');
  };

  const ejecutarImportacion = async (esDryRun: boolean) => {
    if (!archivo) return;
    setProcesando(true);
    setErrorGlobal(null);

    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res = await api.post<ResultadoImportacion>(
        `/admin/estudiantes/importar-csv?dry_run=${esDryRun}&omitir_errores=${omitirErrores}`,
        formData
      );
      setResultado(res);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorGlobal(apiErr.detail || t('admin.csv.error_procesar'));
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.csv.titulo')}
          description={t('admin.csv.descripcion')}
        />
        <Button variant="secundaria" onClick={handleDescargarPlantilla}>
          <Download className="mr-2 h-4 w-4" />
          {t('admin.csv.boton_descargar_plantilla')}
        </Button>
      </div>

      <Card className="p-6 space-y-6 max-w-2xl">
        <CardTitle>{t('admin.csv.seleccionar_archivo_titulo')}</CardTitle>

        <div className="space-y-4">
          <input
            type="file"
            accept=".csv"
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
              <p className="text-xl font-bold text-semaforo-verde">{resultado.filas_validas}</p>
            </div>
            <div className="rounded bg-fondo-suave p-3">
              <p className="text-xs text-tinta-suave">{t('admin.csv.con_errores')}</p>
              <p className="text-xl font-bold text-alerta">{resultado.errores.length}</p>
            </div>
          </div>

          {!resultado.dry_run && (
            <p className="text-sm font-semibold text-semaforo-verde">
              {t('admin.csv.resumen_creados', {
                est: resultado.estudiantes_creados,
                usr: resultado.usuarios_creados,
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
                    <span className="text-tinta-suave text-right">{err.error}</span>
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
