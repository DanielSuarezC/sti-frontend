import type { RouteObject } from 'react-router-dom';
import { RoleHome } from '@/features/_shared/RoleHome';
import MisAsignaturas from './MisAsignaturas';
import MisAjustes from './MisAjustes';

export const docenteRoutes: RouteObject[] = [
  { index: true, element: <RoleHome rol="DOCENTE" /> },
  { path: 'asignaturas', element: <MisAsignaturas /> },
  { path: 'asignatura', element: <MisAsignaturas /> },
  { path: 'ajustes', element: <MisAjustes /> },
  { path: 'ajustes/:id', element: <MisAjustes /> },
  {
    path: 'avisos',
    lazy: async () => {
      const Comp = (await import('@/features/_shared/Avisos')).default;
      return { Component: Comp };
    },
  },
];
