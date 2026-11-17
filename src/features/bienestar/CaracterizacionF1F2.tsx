import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';

export default function CaracterizacionF1F2() {
  const { id } = useParams<{ id: string }>();
  const intl = useIntl();
  const navigate = useNavigate();
  const t = (k: string, values?: Record<string, any>) => intl.formatMessage({ id: k }, values);

  const [tab, setTab] = useState<'f1' | 'f2'>('f1');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // F1 campos
  const [trayectoriaEscolar, setTrayectoriaEscolar] = useState('');
  const [apoyosPrevios, setApoyosPrevios] = useState('');
  const [tipoComunicacion, setTipoComunicacion] = useState('Verbal');
  const [descComunicacion, setDescComunicacion] = useState('');
  const [tipoSensorial, setTipoSensorial] = useState('AUDITIVA');
  const [descSensorial, setDescSensorial] = useState('');
  const [contextoAutonomia, setContextoAutonomia] = useState('Estudio en aula');
  const [nivelAutonomia, setNivelAutonomia] = useState('ALTA');
  const [tipoPreferencia, setTipoPreferencia] = useState('Material anticipado');
  const [descPreferencia, setDescPreferencia] = useState('');
  const [resumenEjecutivo, setResumenEjecutivo] = useState('');
  const [f1Confirmada, setF1Confirmada] = useState(false);

  // F2 campos
  const [nombreFortaleza, setNombreFortaleza] = useState('');
  const [descFortaleza, setDescFortaleza] = useState('');
  const [nombreInteres, setNombreInteres] = useState('');
  const [descInteres, setDescInteres] = useState('');
  const [metaDescripcion, setMetaDescripcion] = useState('');
  const [metaTipo, setMetaTipo] = useState('PROFESIONAL');
  const [f2Confirmada, setF2Confirmada] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargarDatos = () => {
    setCargando(true);
    Promise.all([
      api.get<any>(`/estudiantes/${id}/caracterizacion`).catch(() => null),
      api.get<any>(`/estudiantes/${id}/fortalezas`).catch(() => null),
    ])
      .then(([f1Data, f2Data]) => {
        if (f1Data && f1Data.existe) {
          setTrayectoriaEscolar(f1Data.historia_academica?.trayectoria_escolar || '');
          setApoyosPrevios(f1Data.historia_academica?.apoyos_previos || '');
          if (f1Data.comunicacion?.[0]) {
            setTipoComunicacion(f1Data.comunicacion[0].tipo_comunicacion || 'Verbal');
            setDescComunicacion(f1Data.comunicacion[0].descripcion || '');
          }
          if (f1Data.sensorial?.[0]) {
            setTipoSensorial(f1Data.sensorial[0].tipo_sensorial || 'AUDITIVA');
            setDescSensorial(f1Data.sensorial[0].descripcion_experiencia || '');
          }
          if (f1Data.autonomia?.[0]) {
            setContextoAutonomia(f1Data.autonomia[0].contexto_autonomia || 'Estudio en aula');
            setNivelAutonomia(f1Data.autonomia[0].nivel_autonomia || 'ALTA');
          }
          if (f1Data.preferencias?.[0]) {
            setTipoPreferencia(f1Data.preferencias[0].tipo_preferencia || 'Material anticipado');
            setDescPreferencia(f1Data.preferencias[0].descripcion || '');
          }
          setResumenEjecutivo(f1Data.resumen_ejecutivo || '');
          setF1Confirmada(f1Data.estado === 'COMPLETA');
        }

        if (f2Data && f2Data.existe) {
          if (f2Data.fortalezas?.[0]) {
            setNombreFortaleza(f2Data.fortalezas[0].nombre_fortaleza || '');
            setDescFortaleza(f2Data.fortalezas[0].descripcion_detallada || '');
          }
          if (f2Data.intereses?.[0]) {
            setNombreInteres(f2Data.intereses[0].nombre_interes || '');
            setDescInteres(f2Data.intereses[0].descripcion || '');
          }
          if (f2Data.metas?.[0]) {
            setMetaDescripcion(f2Data.metas[0].descripcion || '');
            setMetaTipo(f2Data.metas[0].tipo || 'PROFESIONAL');
          }
          setF2Confirmada(f2Data.estado === 'COMPLETA');
        }
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('bienestar.error_cargar_caracterizacion'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const handleGuardarF1 = async () => {
    setGuardando(true);
    setErrorAccion(null);
    setMensajeGuardado(null);

    try {
      await api.patch(`/estudiantes/${id}/caracterizacion/historia_academica`, {
        trayectoria_escolar: trayectoriaEscolar.trim() || null,
        apoyos_previos: apoyosPrevios.trim() || null,
      });

      if (descComunicacion.trim()) {
        await api.patch(`/estudiantes/${id}/caracterizacion/comunicacion`, {
          items: [{ tipo_comunicacion: tipoComunicacion, descripcion: descComunicacion.trim() }],
        });
      }

      if (descSensorial.trim()) {
        await api.patch(`/estudiantes/${id}/caracterizacion/sensorial`, {
          items: [{ tipo_sensorial: tipoSensorial, descripcion_experiencia: descSensorial.trim() }],
        });
      }

      await api.patch(`/estudiantes/${id}/caracterizacion/autonomia`, {
        items: [{ contexto_autonomia: contextoAutonomia, nivel_autonomia: nivelAutonomia }],
      });

      if (descPreferencia.trim()) {
        await api.patch(`/estudiantes/${id}/caracterizacion/preferencias`, {
          items: [{ tipo_preferencia: tipoPreferencia, descripcion: descPreferencia.trim() }],
        });
      }

      if (resumenEjecutivo.trim()) {
        await api.patch(`/estudiantes/${id}/caracterizacion/resumen`, {
          resumen_ejecutivo: resumenEjecutivo.trim(),
        });
      }

      setMensajeGuardado(t('bienestar.f1_guardado_exito'));
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_guardar_f1'));
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarF1 = async () => {
    setGuardando(true);
    setErrorAccion(null);
    try {
      await api.post(`/estudiantes/${id}/caracterizacion/confirmar`);
      setF1Confirmada(true);
      setMensajeGuardado(t('bienestar.f1_confirmada_exito'));
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_confirmar_f1'));
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarF2 = async () => {
    setGuardando(true);
    setErrorAccion(null);
    setMensajeGuardado(null);

    try {
      if (nombreFortaleza.trim()) {
        await api.patch(`/estudiantes/${id}/fortalezas/fortalezas`, {
          items: [
            {
              nombre_fortaleza: nombreFortaleza.trim(),
              descripcion_detallada: descFortaleza.trim() || null,
            },
          ],
        });
      }

      if (nombreInteres.trim()) {
        await api.patch(`/estudiantes/${id}/fortalezas/intereses`, {
          items: [
            {
              nombre_interes: nombreInteres.trim(),
              descripcion: descInteres.trim() || null,
            },
          ],
        });
      }

      if (metaDescripcion.trim()) {
        await api.patch(`/estudiantes/${id}/fortalezas/metas`, {
          items: [{ tipo: metaTipo, descripcion: metaDescripcion.trim() }],
        });
      }

      setMensajeGuardado(t('bienestar.f2_guardado_exito'));
      cargarDatos();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_guardar_f2'));
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarF2 = async () => {
    setGuardando(true);
    setErrorAccion(null);
    try {
      await api.post(`/estudiantes/${id}/fortalezas/confirmar`);
      setF2Confirmada(true);
      setMensajeGuardado(t('bienestar.f2_confirmada_exito'));
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorAccion(apiErr.detail || t('bienestar.error_confirmar_f2'));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <LoadingState label={t('bienestar.cargando_caracterizacion')} />;
  }

  if (errorCarga) {
    return <EmptyState title={t('bienestar.error_titulo')} description={errorCarga} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('bienestar.caracterizacion_titulo')}
          description={t('bienestar.caracterizacion_descripcion')}
        />
        <Button variant="secundaria" onClick={() => navigate(`/bienestar/estudiantes/${id}`)}>
          {t('bienestar.volver_al_expediente')}
        </Button>
      </div>

      {mensajeGuardado && (
        <div className="rounded-control border-2 border-verde bg-verde-tinte p-3 text-sm text-verde-oscuro font-bold">
          {mensajeGuardado}
        </div>
      )}

      {errorAccion && (
        <div className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold">
          {errorAccion}
        </div>
      )}

      {/* Tabs F1 / F2 */}
      <div className="flex border-b-2 border-borde">
        <button
          type="button"
          onClick={() => setTab('f1')}
          className={`px-6 py-3 font-titulo text-base font-bold transition-colors border-b-4 -mb-[2px] ${
            tab === 'f1'
              ? 'border-cobalto text-cobalto'
              : 'border-transparent text-tinta-suave hover:text-tinta'
          }`}
        >
          {t('bienestar.tab_f1_caracterizacion')} {f1Confirmada && '✓'}
        </button>
        <button
          type="button"
          onClick={() => setTab('f2')}
          className={`px-6 py-3 font-titulo text-base font-bold transition-colors border-b-4 -mb-[2px] ${
            tab === 'f2'
              ? 'border-cobalto text-cobalto'
              : 'border-transparent text-tinta-suave hover:text-tinta'
          }`}
        >
          {t('bienestar.tab_f2_fortalezas')} {f2Confirmada && '✓'}
        </button>
      </div>

      {tab === 'f1' ? (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_historia_titulo')}</h3>
            <Textarea
              label={t('bienestar.f1_trayectoria_label')}
              value={trayectoriaEscolar}
              onChange={(e) => setTrayectoriaEscolar(e.target.value)}
              placeholder="Colegio de procedencia, experiencias previas..."
              rows={3}
            />
            <Textarea
              label={t('bienestar.f1_apoyos_previos_label')}
              value={apoyosPrevios}
              onChange={(e) => setApoyosPrevios(e.target.value)}
              placeholder="Apoyos escolares o terapéuticos utilizados..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_comunicacion_titulo')}</h3>
            <Input
              label={t('bienestar.f1_tipo_comunicacion_label')}
              value={tipoComunicacion}
              onChange={(e) => setTipoComunicacion(e.target.value)}
              placeholder="Verbal, apoyo visual, gestual..."
            />
            <Textarea
              label={t('bienestar.f1_desc_comunicacion_label')}
              value={descComunicacion}
              onChange={(e) => setDescComunicacion(e.target.value)}
              placeholder="Cómo interactúa y se comunica con docentes y compañeros..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_sensorial_titulo')}</h3>
            <Select
              label={t('bienestar.f1_tipo_sensorial_label')}
              value={tipoSensorial}
              onChange={(e) => setTipoSensorial(e.target.value)}
            >
              <option value="AUDITIVA">AUDITIVA</option>
              <option value="VISUAL">VISUAL</option>
              <option value="TACTIL">TACTIL</option>
              <option value="OLFATIVA">OLFATIVA</option>
              <option value="GUSTATIVA">GUSTATIVA</option>
              <option value="VESTIBULAR">VESTIBULAR</option>
              <option value="PROPIOCEPCION">PROPIOCEPCION</option>
            </Select>
            <Textarea
              label={t('bienestar.f1_desc_sensorial_label')}
              value={descSensorial}
              onChange={(e) => setDescSensorial(e.target.value)}
              placeholder="Sensibilidad a ruidos fuertes, iluminación, aglomeraciones..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_autonomia_titulo')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('bienestar.f1_contexto_autonomia_label')}
                value={contextoAutonomia}
                onChange={(e) => setContextoAutonomia(e.target.value)}
                placeholder="Estudio en aula, prácticas, traslados..."
              />
              <Select
                label={t('bienestar.f1_nivel_autonomia_label')}
                value={nivelAutonomia}
                onChange={(e) => setNivelAutonomia(e.target.value)}
              >
                <option value="ALTA">ALTA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="BAJA">BAJA</option>
              </Select>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_preferencias_titulo')}</h3>
            <Input
              label={t('bienestar.f1_tipo_preferencia_label')}
              value={tipoPreferencia}
              onChange={(e) => setTipoPreferencia(e.target.value)}
              placeholder="Anticipación de agenda, instrucciones escritas..."
            />
            <Textarea
              label={t('bienestar.f1_desc_preferencia_label')}
              value={descPreferencia}
              onChange={(e) => setDescPreferencia(e.target.value)}
              placeholder="Detalle de las preferencias expresadas..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f1_resumen_titulo')}</h3>
            <Textarea
              label={t('bienestar.f1_resumen_ejecutivo_label')}
              value={resumenEjecutivo}
              onChange={(e) => setResumenEjecutivo(e.target.value)}
              placeholder="Síntesis funcional del perfil para orientar el plan..."
              rows={3}
            />
          </Card>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <Button variant="secundaria" onClick={handleGuardarF1} loading={guardando}>
              {t('bienestar.boton_guardar_borrador_f1')}
            </Button>
            <Button variant="primaria" onClick={handleConfirmarF1} loading={guardando}>
              {t('bienestar.boton_confirmar_f1')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f2_fortalezas_titulo')}</h3>
            <Input
              label={t('bienestar.f2_nombre_fortaleza_label')}
              value={nombreFortaleza}
              onChange={(e) => setNombreFortaleza(e.target.value)}
              placeholder="p. ej. Atención al detalle, constancia, memoria visual..."
            />
            <Textarea
              label={t('bienestar.f2_desc_fortaleza_label')}
              value={descFortaleza}
              onChange={(e) => setDescFortaleza(e.target.value)}
              placeholder="Cómo se manifiesta en el ámbito universitario..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f2_intereses_titulo')}</h3>
            <Input
              label={t('bienestar.f2_nombre_interes_label')}
              value={nombreInteres}
              onChange={(e) => setNombreInteres(e.target.value)}
              placeholder="Áreas de especial interés o afinidad..."
            />
            <Textarea
              label={t('bienestar.f2_desc_interes_label')}
              value={descInteres}
              onChange={(e) => setDescInteres(e.target.value)}
              placeholder="Cómo puede vincularse con su formación profesional..."
              rows={2}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-titulo text-lg font-bold">{t('bienestar.f2_metas_titulo')}</h3>
            <Select
              label={t('bienestar.f2_tipo_meta_label')}
              value={metaTipo}
              onChange={(e) => setMetaTipo(e.target.value)}
            >
              <option value="ACADEMICA">ACADEMICA</option>
              <option value="PROFESIONAL">PROFESIONAL</option>
              <option value="PERSONAL">PERSONAL</option>
            </Select>
            <Textarea
              label={t('bienestar.f2_desc_meta_label')}
              value={metaDescripcion}
              onChange={(e) => setMetaDescripcion(e.target.value)}
              placeholder="Metas que el estudiante se propone alcanzar..."
              rows={2}
            />
          </Card>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <Button variant="secundaria" onClick={handleGuardarF2} loading={guardando}>
              {t('bienestar.boton_guardar_borrador_f2')}
            </Button>
            <Button variant="primaria" onClick={handleConfirmarF2} loading={guardando}>
              {t('bienestar.boton_confirmar_f2')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
