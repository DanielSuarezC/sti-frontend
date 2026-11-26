import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  EmptyState,
  Input,
  LoadingState,
  PageHeader,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { CampoCopiable } from '@/features/_shared/AccesoEntregado';

interface FamiliarItem {
  id: number;
  nombre_familiar: string;
  email_familiar: string;
  parentesco?: string;
  alcances: string[];
  activo: boolean;
  /** `PENDIENTE` hasta que el familiar se registra con su código. */
  estado?: string;
  /** Solo viene mientras la autorización está `PENDIENTE`. */
  codigo_vinculacion?: string | null;
  created_at: string;
}

export default function FamiliaresEstudiante() {
  const intl = useIntl();
  const t = (id: string, values?: Record<string, any>) => intl.formatMessage({ id }, values);

  const [familiares, setFamiliares] = useState<FamiliarItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Modal para agregar familiar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [alcancePlan, setAlcancePlan] = useState(true);
  const [alcanceSeguimiento, setAlcanceSeguimiento] = useState(true);
  const [alcanceCaracterizacion, setAlcanceCaracterizacion] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarFamiliares = () => {
    setCargando(true);
    api
      .get<{ items: FamiliarItem[] }>('/estudiantes/mi/familiares')
      .then((data) => {
        setFamiliares(data.items || []);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setErrorCarga(apiErr.detail || t('familiares.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarFamiliares();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const alcances: string[] = [];
    if (alcancePlan) alcances.push('PLAN');
    if (alcanceSeguimiento) alcances.push('SEGUIMIENTO');
    if (alcanceCaracterizacion) alcances.push('CARACTERIZACION');

    if (alcances.length === 0) {
      setErrorModal(t('familiares.error_seleccionar_alcance'));
      return;
    }

    setGuardando(true);
    setErrorModal(null);

    try {
      await api.post('/estudiantes/mi/familiares', {
        nombre_familiar: nombre.trim(),
        email_familiar: email.trim(),
        parentesco: parentesco.trim() || null,
        alcances,
      });
      setModalAbierto(false);
      setNombre('');
      setEmail('');
      setParentesco('');
      cargarFamiliares();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorModal(apiErr.detail || t('familiares.error_guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleRevocar = async (id: number) => {
    if (!window.confirm(t('familiares.confirmar_revocar'))) return;
    try {
      await api.del(`/estudiantes/mi/familiares/${id}?motivo=Revocado+por+estudiante`);
      cargarFamiliares();
    } catch {
      // Manejo de error
    }
  };

  if (cargando) {
    return <LoadingState label={t('familiares.cargando')} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('familiares.titulo')}
          description={t('familiares.descripcion')}
        />
        <Button variant="primaria" onClick={() => setModalAbierto(true)}>
          {t('familiares.boton_nuevo')}
        </Button>
      </div>

      {errorCarga && (
        <EmptyState
          title={t('familiares.error_titulo')}
          description={errorCarga}
        />
      )}

      {familiares.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <h3 className="font-titulo text-lg font-bold">{t('familiares.sin_familiares_titulo')}</h3>
          <p className="text-sm text-tinta-suave max-w-medida mx-auto">
            {t('familiares.sin_familiares_desc')}
          </p>
          <div className="pt-2">
            <Button variant="secundaria" onClick={() => setModalAbierto(true)}>
              {t('familiares.boton_nuevo')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {familiares.map((f) => (
            <Card key={f.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-titulo text-base font-bold text-tinta">{f.nombre_familiar}</h3>
                  <p className="text-xs text-tinta-suave">{f.email_familiar}</p>
                  {f.parentesco && (
                    <span className="mt-1 inline-block text-xs font-semibold text-cobalto">
                      {f.parentesco}
                    </span>
                  )}
                </div>
                <Button
                  variant="peligro"
                  size="md"
                  onClick={() => handleRevocar(f.id)}
                >
                  {t('familiares.boton_revocar')}
                </Button>
              </div>

              {f.estado === 'PENDIENTE' && f.codigo_vinculacion && (
                <div className="space-y-3 rounded-control border-2 border-cobalto bg-cobalto-tinte p-3">
                  <p className="text-sm font-bold text-tinta">Falta que tu familiar se registre</p>
                  <p className="text-sm text-tinta">
                    Entrégale este código a {f.nombre_familiar}. Debe entrar a la página de registro, elegir «Familiar» y
                    escribir su correo ({f.email_familiar}) junto con este código. Al terminar, la autorización queda vigente.
                  </p>
                  <CampoCopiable etiqueta="Código de vinculación" valor={f.codigo_vinculacion} />
                </div>
              )}

              <div className="border-t-2 border-borde pt-2">
                <p className="text-xs font-bold text-tinta-suave uppercase">{t('familiares.permisos_otorgados')}:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {f.alcances.map((alcance) => (
                    <span
                      key={alcance}
                      className="rounded bg-cobalto-tinte px-2 py-0.5 text-xs font-bold text-cobalto"
                    >
                      {alcance}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para autorizar familiar */}
      <Dialog
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        title={t('familiares.modal_titulo')}
        description={t('familiares.modal_desc')}
      >
        <form onSubmit={handleCrear} className="space-y-4 pt-2">
          {errorModal && (
            <div
              role="alert"
              className="rounded-control border-2 border-rojo bg-rojo-tinte p-3 text-sm text-rojo font-bold"
            >
              {errorModal}
            </div>
          )}

          <Input
            label={t('familiares.campo_nombre')}
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre completo del familiar"
          />

          <Input
            label={t('familiares.campo_email')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="familiar@ejemplo.com"
          />

          <Input
            label={t('familiares.campo_parentesco')}
            value={parentesco}
            onChange={(e) => setParentesco(e.target.value)}
            placeholder="Madre, Padre, Hermano(a)..."
          />

          <div className="space-y-2 rounded-control border-2 border-borde p-3 bg-papel">
            <p className="text-xs font-bold uppercase text-tinta">{t('familiares.alcances_etiqueta')}:</p>
            <Checkbox
              id="alcance-plan"
              label={t('familiares.alcance_plan')}
              checked={alcancePlan}
              onCheckedChange={setAlcancePlan}
            />
            <Checkbox
              id="alcance-seg"
              label={t('familiares.alcance_seguimiento')}
              checked={alcanceSeguimiento}
              onCheckedChange={setAlcanceSeguimiento}
            />
            <Checkbox
              id="alcance-caract"
              label={t('familiares.alcance_caracterizacion')}
              checked={alcanceCaracterizacion}
              onCheckedChange={setAlcanceCaracterizacion}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secundaria" onClick={() => setModalAbierto(false)}>
              {t('recuperar.volver')}
            </Button>
            <Button type="submit" variant="primaria" loading={guardando}>
              {t('familiares.boton_guardar')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
