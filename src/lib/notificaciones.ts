/** Notificaciones in-app (M10): polling cada 30 s a `GET /notificaciones`. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from './api';
import { useAuth } from './auth';
import type { NotificacionesResponse } from './types';

export const NOTIFICACIONES_KEY = ['notificaciones'] as const;
export const INTERVALO_NOTIFICACIONES_MS = 30_000;

export function useNotificaciones(opts: { soloNoLeidas?: boolean } = {}) {
  const { status } = useAuth();
  return useQuery({
    queryKey: [...NOTIFICACIONES_KEY, { soloNoLeidas: !!opts.soloNoLeidas }],
    queryFn: ({ signal }) =>
      get<NotificacionesResponse>('/notificaciones', {
        query: { solo_no_leidas: opts.soloNoLeidas ? true : undefined },
        signal,
      }),
    enabled: status === 'autenticado',
    refetchInterval: INTERVALO_NOTIFICACIONES_MS,
    refetchIntervalInBackground: false,
  });
}

export function useMarcarLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => post<void>(`/notificaciones/${id}/leer`),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICACIONES_KEY }),
  });
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post<void>('/notificaciones/leer-todas'),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICACIONES_KEY }),
  });
}
