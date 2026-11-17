import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import {
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

interface BarreraItem {
  id: number;
  tipo_barrera: string;
  escenario?: string | null;
  descripcion_barrera: string;
  frecuencia?: string;
  severidad?: string;
  estado: string;
}

interface FacilitadorItem {
  id: number;
  tipo_facilitador: string;
  nombre_facilitador: string;
  descripcion_detallada?: string;
  intensidad_impacto?: string;
}

export default function ContextoBarreras() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [tab, setTab] = useState<'barreras' | 'facilitadores'>('barreras');
  const [barreras, setBarreras] = useState<BarreraItem[]>([]);
  const [facilitadores, setFacilitadores] = useState<FacilitadorItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Modal nueva barrera
  const [modalBarrera, setModalBarrera] = useState(false);
  const [tipoBarrera, setTipoBarrera] = useState('PEDAGOGICA');
  const [escenarioBarrera, setEscenarioBarrera] = useState('AULA');
  const [descBarrera, setDescBarrera] = useState('');
  const [severidadBarrera, setSeveridadBarrera] = useState('MODERADA');
  const [guardandoBarrera, setGuardandoBarrera] = useState(false);
  const [errorBarrera, setErrorBarrera] = useState<string | null>(null);

  // Modal nuevo facilitador
  const [modalFacilitador, setModalFacilitador] = useState(false);
  const [tipoFacilitador, setTipoFacilitador] = useState('PEDAGOGICO');
  const [nombreFacilitador, setNombreFacilitador] = useState('');
  const [descFacilitador, setDescFacilitador] = useState('');
  const [guardandoFacilitador, setGuardandoFacilitador] = useState(false);
  const [errorFacilitador, setErrorFacilitador] = useState<string | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      api.get<{ items: BarreraItem[] }>(`/estudiantes/${id}/barreras`).catch(() => ({ items: [] })),
      api.get<{ items: FacilitadorItem[] }>(`/estudiantes/${id}/facilitadores`).catch(() => ({ items: [] })),
    ])
      .then(([bData, fData]) => {
        setBarreras(bData.items || []);
        setFacilitadores(fData.items || []);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('bienestar.error_cargar_barreras'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const handleCrearBarrera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descBarrera.trim().length < 3) return;

    setGuardandoBarrera(true);
    setErrorBarrera(null);

    try {
      await api.post(`/estudiantes/${id}/barreras`, {
        tipo_barrera: tipoBarrera,
        escenario: escenarioBarrera,
        descripcion_barrera: descBarrera.trim(),
        severidad: severidadBarrera,
        frecuencia: 'FRECUENTE',
      });
      setModalBarrera(false);
      setDescBarrera('');
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorBarrera(apiErr.detail || t('bienestar.error_crear_barrera'));
    } finally {
      setGuardandoBarrera(false);
    }
  };

  const handleMarcarPersistente = async (barreraId: number) => {
    try {
      await api.post(`/barreras/${barreraId}/persistente`, {
        observacion: 'Confirmada como persistente para justificar ajuste razonable.',
      });
      cargarDatos();
    } catch {
      // Manejo de error
    }
  };

  const handleCrearFacilitador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nombreFacilitador.trim().length < 2) return;

    setGuardandoFacilitador(true);
    setErrorFacilitador(null);

    try {
      await api.post(`/estudiantes/${id}/facilitadores`, {
        tipo_facilitador: tipoFacilitador,
        nombre_facilitador: nombreFacilitador.trim(),
        descripcion_detallada: descFacilitador.trim() || undefined,
        intensidad_impacto: 'MODERADA',
        renovabilidad: 'FIJO',
      });
      setModalFacilitador(false);
      setNombreFacilitador('');
      setDescFacilitador('');
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorFacilitador(apiErr.detail || t('bienestar.error_crear_facilitador'));
    } finally {
      setGuardandoFacilitador(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_barreras')} />;
  }

  if (errorCarga) {
    return <EmptyState title={t('bienestar.error_titulo')} description={errorCarga} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.barreras_facilitadores_titulo')}
          description={t('bienestar.barreras_facilitadores_desc')}
        />
        <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
          {t('bienestar.volver_al_expediente')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-borde">
        <button
          type="button"
          onClick={() => setTab('barreras')}
          className={`px-6 py-3 font-titulo text-base font-bold transition-colors border-b-4 -mb-[2px] ${
            tab === 'barreras'
              ? 'border-cobalto text-cobalto'
              : 'border-transparent text-tinta-suave hover:text-tinta'
          }`}
        >
          {t('bienestar.tab_barreras')} ({barreras.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('facilitadores')}
          className={`px-6 py-3 font-titulo text-base font-bold transition-colors border-b-4 -mb-[2px] ${
            tab === 'facilitadores'
              ? 'border-cobalto text-cobalto'
              : 'border-transparent text-tinta-suave hover:text-tinta'
          }`}
        >
          {t('bienestar.tab_facilitadores')} ({facilitadores.length})
        </button>
      </div>

      {tab === 'barreras' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primaria" onClick={() => setModalBarrera(true)}>
              {t('bienestar.boton_nueva_barrera')}
            </Button>
          </div>

          {barreras.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <h3 className="font-titulo text-lg font-bold">{t('bienestar.sin_barreras_titulo')}</h3>
              <p className="text-sm text-tinta-suave">{t('bienestar.sin_barreras_desc')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {barreras.map((b) => (
                <Card key={b.id} className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-cobalto-tinte px-2 py-0.5 text-xs font-bold text-cobalto">
                        {b.tipo_barrera}
                      </span>
                      {b.escenario && (
                        <span className="rounded bg-papel px-2 py-0.5 text-xs font-semibold text-tinta-suave border border-borde">
                          {b.escenario}
                        </span>
                      )}
                      <span className="rounded bg-mandarina-tinte px-2 py-0.5 text-xs font-bold text-mandarina-oscuro">
                        {b.estado}
                      </span>
                    </div>
                    <p className="font-medium text-tinta">{b.descripcion_barrera}</p>
                  </div>

                  {b.estado !== 'PERSISTENTE' && (
                    <Button
                      variant="secundaria"
                      size="md"
                      onClick={() => handleMarcarPersistente(b.id)}
                    >
                      {t('bienestar.marcar_persistente')}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primaria" onClick={() => setModalFacilitador(true)}>
              {t('bienestar.boton_nuevo_facilitador')}
            </Button>
          </div>

          {facilitadores.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <h3 className="font-titulo text-lg font-bold">{t('bienestar.sin_facilitadores_titulo')}</h3>
              <p className="text-sm text-tinta-suave">{t('bienestar.sin_facilitadores_desc')}</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {facilitadores.map((f) => (
                <Card key={f.id} className="p-5 space-y-2">
                  <span className="rounded bg-verde-tinte px-2 py-0.5 text-xs font-bold text-verde">
                    {f.tipo_facilitador}
                  </span>
                  <h4 className="font-titulo text-base font-bold text-tinta">{f.nombre_facilitador}</h4>
                  {f.descripcion_detallada && (
                    <p className="text-sm text-tinta-suave">{f.descripcion_detallada}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Barrera */}
      <Dialog
        open={modalBarrera}
        onOpenChange={setModalBarrera}
        title={t('bienestar.modal_barrera_titulo')}
        description={t('bienestar.modal_barrera_desc')}
      >
        <form onSubmit={handleCrearBarrera} className="space-y-4 pt-2">
          {errorBarrera && (
            <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
              {errorBarrera}
            </div>
          )}

          <Select
            label={t('bienestar.campo_tipo_barrera')}
            value={tipoBarrera}
            onChange={(e) => setTipoBarrera(e.target.value)}
          >
            <option value="PEDAGOGICA">PEDAGOGICA</option>
            <option value="COMUNICATIVA">COMUNICATIVA</option>
            <option value="ACTITUDINAL">ACTITUDINAL</option>
            <option value="EVALUATIVA">EVALUATIVA</option>
            <option value="SENSORIAL">SENSORIAL</option>
            <option value="SOCIAL">SOCIAL</option>
            <option value="INSTITUCIONAL">INSTITUCIONAL</option>
            <option value="TECNOLOGICA">TECNOLOGICA</option>
          </Select>

          <Select
            label={t('bienestar.campo_escenario_barrera')}
            value={escenarioBarrera}
            onChange={(e) => setEscenarioBarrera(e.target.value)}
          >
            <option value="AULA">AULA</option>
            <option value="CAMPUS">CAMPUS</option>
            <option value="VIRTUALIDAD">VIRTUALIDAD</option>
            <option value="LABORATORIOS">LABORATORIOS</option>
            <option value="PRACTICA_CLINICA">PRACTICA_CLINICA</option>
            <option value="PRACTICA_SALUD_PUBLICA">PRACTICA_SALUD_PUBLICA</option>
            <option value="EVENTOS">EVENTOS</option>
            <option value="PASANTIAS">PASANTIAS</option>
          </Select>

          <Textarea
            label={t('bienestar.campo_desc_barrera')}
            required
            value={descBarrera}
            onChange={(e) => setDescBarrera(e.target.value)}
            placeholder="Describe el obstáculo del entorno con precisión..."
            rows={3}
          />

          <Select
            label={t('bienestar.campo_severidad_barrera')}
            value={severidadBarrera}
            onChange={(e) => setSeveridadBarrera(e.target.value)}
          >
            <option value="LEVE">LEVE</option>
            <option value="MODERADA">MODERADA</option>
            <option value="SEVERA">SEVERA</option>
          </Select>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalBarrera(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button type="submit" variant="primaria" loading={guardandoBarrera}>
              {t('bienestar.boton_guardar_barrera')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Nuevo Facilitador */}
      <Dialog
        open={modalFacilitador}
        onOpenChange={setModalFacilitador}
        title={t('bienestar.modal_facilitador_titulo')}
        description={t('bienestar.modal_facilitador_desc')}
      >
        <form onSubmit={handleCrearFacilitador} className="space-y-4 pt-2">
          {errorFacilitador && (
            <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
              {errorFacilitador}
            </div>
          )}

          <Select
            label={t('bienestar.campo_tipo_facilitador')}
            value={tipoFacilitador}
            onChange={(e) => setTipoFacilitador(e.target.value)}
          >
            <option value="PEDAGOGICO">PEDAGOGICO</option>
            <option value="PERSONAL">PERSONAL</option>
            <option value="SOCIAL">SOCIAL</option>
            <option value="INSTITUCIONAL">INSTITUCIONAL</option>
            <option value="TECNOLOGICO">TECNOLOGICO</option>
          </Select>

          <Input
            label={t('bienestar.campo_nombre_facilitador')}
            required
            value={nombreFacilitador}
            onChange={(e) => setNombreFacilitador(e.target.value)}
            placeholder="p. ej. Apoyo visual, tutor de pares, lector digital..."
          />

          <Textarea
            label={t('bienestar.campo_desc_facilitador')}
            value={descFacilitador}
            onChange={(e) => setDescFacilitador(e.target.value)}
            placeholder="Cómo favorece el desempeño del estudiante..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalFacilitador(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button type="submit" variant="primaria" loading={guardandoFacilitador}>
              {t('bienestar.boton_guardar_facilitador')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
