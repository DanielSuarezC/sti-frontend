import type { RouteObject } from 'react-router-dom';
import { RoleHome } from '@/features/_shared/RoleHome';

export const coordinadorRoutes: RouteObject[] = [
  { index: true, element: <RoleHome rol="COORDINADOR" /> },
  {
    path: 'planes',
    lazy: async () => {
      const Comp = (await import('./PlanesValidacion')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'planes/:id',
    lazy: async () => {
      const Comp = (await import('./PlanDetalleCoordinador')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'metricas',
    lazy: async () => {
      const Comp = (await import('./DashboardMetricas')).default;
      return { Component: Comp };
    },
  },
];
