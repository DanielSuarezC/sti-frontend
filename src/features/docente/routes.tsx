import type { RouteObject } from 'react-router-dom';
import MisAsignaturas from './MisAsignaturas';
import MisAjustes from './MisAjustes';

export const docenteRoutes: RouteObject[] = [
  { index: true, element: <MisAsignaturas /> },
  { path: 'asignaturas', element: <MisAsignaturas /> },
  { path: 'ajustes', element: <MisAjustes /> },
];
