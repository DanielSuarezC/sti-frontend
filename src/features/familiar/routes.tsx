import type { RouteObject } from 'react-router-dom';
import FamiliarHome from './FamiliarHome';
import PlanDetalleFamiliar from './PlanDetalleFamiliar';

export const familiarRoutes: RouteObject[] = [
  { index: true, element: <FamiliarHome /> },
  { path: 'planes', element: <FamiliarHome /> },
  { path: 'planes/:id', element: <PlanDetalleFamiliar /> },
];
