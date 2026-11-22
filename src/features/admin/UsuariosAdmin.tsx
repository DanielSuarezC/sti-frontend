import { useEffect, useState } from 'react';
import { Mail, Plus, UserCheck, UserX } from 'lucide-react';
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
  useToast,
} from '@/components/ui';
import { api, type ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT, useEnum } from '@/lib/useT';
import type { Pagina } from '@/lib/types';

interface UsuarioItem {
  id: number;
  email: string;
  nombre_completo: string;
  rol: string;
  estado: string;
  numero_documento?: string;
  telefono?: string;
  created_at: string;
  invitacion_pendiente: boolean;
  invitacion_vencida: boolean;
  programa_id?: number;
}

export default function UsuariosAdmin() {
  const t = useT();
  const e = useEnum();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [data, setData] = useState<Pagina<UsuarioItem> | null>(null);
  const [page, setPage] = useState(1);
  const [rolFiltro, setRolFiltro] = useState<string>('');
  const [query, setQuery] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal crear usuario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRol, setNuevoRol] = useState('DOCENTE');
  const [nuevoNumDoc, setNuevoNumDoc] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Acciones rápidas
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargarUsuarios = (numPagina = 1) => {
    setCargando(true);
    const queryParams: Record<string, any> = { page: numPagina, page_size: 15 };
    if (rolFiltro) queryParams.rol = rolFiltro;
    if (query.trim()) queryParams.q = query.trim();

    api
      .get<Pagina<UsuarioItem>>('/usuarios', { query: queryParams })
      .then((res) => {
        setData(res);
        setCargando(false);
      })
      .catch((err: any) => {
        const apiErr = err as ApiError;
        setError(apiErr.detail || t('admin.usuarios.error_cargar'));
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarUsuarios(page);
  }, [page, rolFiltro]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    cargarUsuarios(1);
  };

  const handleCrearUsuario = async () => {
    setGuardando(true);
    setErrorModal(null);
    try {
      await api.post('/usuarios', {
        email: nuevoEmail.trim(),
        nombre_completo: nuevoNombre.trim(),
        rol: nuevoRol,
        numero_documento: nuevoNumDoc.trim() || undefined,
        telefono: nuevoTelefono.trim() || undefined,
      });
      toast({
        variant: 'exito',
        title: 'Usuario creado e invitado',
        description: `Se creó la cuenta para ${nuevoNombre.trim()} y se envió la invitación al correo ${nuevoEmail.trim()} (válida por 72 horas).`,
      });
      setModalAbierto(false);
      setNuevoEmail('');
      setNuevoNombre('');
      setNuevoNumDoc('');
      setNuevoTelefono('');
      cargarUsuarios(page);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setErrorModal(apiErr.detail || t('admin.usuarios.error_crear'));
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (u: UsuarioItem, activar: boolean) => {
    if (!activar && currentUser?.id === u.id) {
      toast({
        variant: 'aviso',
        title: 'Acción no permitida',
        description: 'No es posible desactivar tu propia cuenta de administrador.',
      });
      return;
    }
    setProcesandoId(u.id);
    try {
      if (activar) {
        await api.post(`/usuarios/${u.id}/reactivar`, { motivo: 'Activación administrativa' });
        toast({
          variant: 'exito',
          title: 'Usuario activado',
          description: `La cuenta de ${u.nombre_completo} ha sido activada exitosamente.`,
        });
      } else {
        await api.post(`/usuarios/${u.id}/desactivar`, { motivo: 'Desactivación administrativa' });
        toast({
          variant: 'exito',
          title: 'Usuario desactivado',
          description: `La cuenta de ${u.nombre_completo} ha sido desactivada.`,
        });
      }
      cargarUsuarios(page);
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: t('admin.usuarios.error_cambiar_estado'),
        description: apiErr.detail || 'Ocurrió un error al cambiar el estado del usuario.',
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const handleReenviarInvitacion = async (u: UsuarioItem) => {
    setProcesandoId(u.id);
    try {
      await api.post(`/usuarios/${u.id}/reenviar-invitacion`, {});
      toast({
        variant: 'exito',
        title: t('admin.usuarios.invitacion_reenviada'),
        description: `Se envió un nuevo enlace de activación a ${u.email} válido por 72 horas.`,
      });
      cargarUsuarios(page);
    } catch (err: any) {
      const apiErr = err as ApiError;
      toast({
        variant: 'error',
        title: t('admin.usuarios.error_reenviar_invitacion'),
        description: apiErr.detail || 'Error al reenviar la invitación por correo.',
      });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={t('admin.usuarios.titulo')}
          description={t('admin.usuarios.descripcion')}
        />
        <Button variant="primaria" onClick={() => setModalAbierto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.usuarios.boton_nuevo')}
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label={t('admin.usuarios.filtro_buscar')}
              placeholder={t('admin.usuarios.filtro_buscar_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              label={t('admin.usuarios.filtro_rol')}
              value={rolFiltro}
              onChange={(e) => {
                setRolFiltro(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('admin.usuarios.todos_los_roles')}</option>
              <option value="ESTUDIANTE">{e('rol', 'ESTUDIANTE')}</option>
              <option value="DOCENTE">{e('rol', 'DOCENTE')}</option>
              <option value="COORDINADOR">{e('rol', 'COORDINADOR')}</option>
              <option value="BIENESTAR">{e('rol', 'BIENESTAR')}</option>
              <option value="ADMIN">{e('rol', 'ADMIN')}</option>
              <option value="FAMILIAR">{e('rol', 'FAMILIAR')}</option>
            </Select>
          </div>
          <Button type="submit" variant="secundaria">
            {t('comun.buscar')}
          </Button>
        </form>
      </Card>

      {/* Tabla */}
      {cargando ? (
        <LoadingState label={t('admin.usuarios.cargando')} />
      ) : error || !data ? (
        <EmptyState
          title={t('admin.usuarios.error_titulo')}
          description={error ?? t('admin.usuarios.error_cargar')}
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          title={t('admin.usuarios.sin_resultados_titulo')}
          description={t('admin.usuarios.sin_resultados_desc')}
        />
      ) : (
        <Card className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-borde text-xs uppercase text-tinta-suave">
                <tr>
                  <th className="py-3 px-4">{t('admin.usuarios.columna_nombre')}</th>
                  <th className="py-3 px-4">{t('admin.usuarios.columna_email')}</th>
                  <th className="py-3 px-4">{t('admin.usuarios.columna_rol')}</th>
                  <th className="py-3 px-4">{t('admin.usuarios.columna_estado')}</th>
                  <th className="py-3 px-4">{t('admin.usuarios.columna_acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {data.items.map((u) => {
                  const activo = u.estado === 'ACTIVO';
                  const ocupado = procesandoId === u.id;
                  const esPropioAdmin = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-fondo-suave/50">
                      <td className="py-3 px-4 font-semibold">{u.nombre_completo}</td>
                      <td className="py-3 px-4 text-tinta-suave">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge color="cobalto">{e('rol', u.rol)}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge color={activo ? 'limon' : 'mandarina'}>
                            {e('estado_usuario', u.estado)}
                          </Badge>
                          {u.invitacion_pendiente && (
                            <span className="text-xs text-mandarina font-medium">
                              {u.invitacion_vencida
                                ? t('admin.usuarios.invitacion_vencida')
                                : t('admin.usuarios.invitacion_pendiente')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {u.invitacion_pendiente && (
                            <Button
                              variant="fantasma"
                              loading={ocupado}
                              onClick={() => handleReenviarInvitacion(u)}
                            >
                              <Mail className="mr-1 h-3.5 w-3.5" />
                              {t('admin.usuarios.boton_reenviar')}
                            </Button>
                          )}
                          {esPropioAdmin && activo ? (
                            <span
                              className="inline-flex items-center rounded-control bg-fondo-suave px-2.5 py-1.5 text-xs text-tinta-suave border border-borde font-medium select-none"
                              title="No es posible desactivar tu propia cuenta de administrador"
                            >
                              Tu cuenta actual
                            </span>
                          ) : (
                            <Button
                              variant={activo ? 'peligro' : 'secundaria'}
                              loading={ocupado}
                              onClick={() => handleCambiarEstado(u, !activo)}
                            >
                              {activo ? (
                                <>
                                  <UserX className="mr-1 h-3.5 w-3.5" />
                                  {t('admin.usuarios.boton_desactivar')}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                                  {t('admin.usuarios.boton_activar')}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-borde">
            <span className="text-xs text-tinta-suave">
              Página {data.page} ({data.total} usuarios)
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

      {/* Modal Crear Usuario */}
      <Dialog
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        title={t('admin.usuarios.modal_crear_titulo')}
        description={t('admin.usuarios.modal_crear_desc')}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="fantasma" onClick={() => setModalAbierto(false)}>
              {t('comun.cancelar')}
            </Button>
            <Button
              variant="primaria"
              loading={guardando}
              disabled={!nuevoEmail.trim() || !nuevoNombre.trim()}
              onClick={handleCrearUsuario}
            >
              {t('admin.usuarios.boton_guardar_invitar')}
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
            label={t('admin.usuarios.campo_email')}
            type="email"
            required
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
          />

          <Input
            label={t('admin.usuarios.campo_nombre')}
            required
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />

          <Select
            label={t('admin.usuarios.campo_rol')}
            value={nuevoRol}
            onChange={(e) => setNuevoRol(e.target.value)}
          >
            <option value="DOCENTE">{e('rol', 'DOCENTE')}</option>
            <option value="COORDINADOR">{e('rol', 'COORDINADOR')}</option>
            <option value="BIENESTAR">{e('rol', 'BIENESTAR')}</option>
            <option value="ADMIN">{e('rol', 'ADMIN')}</option>
          </Select>

          <Input
            label={t('admin.usuarios.campo_num_doc')}
            value={nuevoNumDoc}
            onChange={(e) => setNuevoNumDoc(e.target.value)}
          />

          <Input
            label={t('admin.usuarios.campo_telefono')}
            value={nuevoTelefono}
            onChange={(e) => setNuevoTelefono(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
