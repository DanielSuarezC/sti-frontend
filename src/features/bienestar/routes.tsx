import type { RouteObject } from 'react-router-dom';
import { RoleHome } from '@/features/_shared/RoleHome';

export const bienestarRoutes: RouteObject[] = [
  { index: true, element: <RoleHome rol="BIENESTAR" /> },
  {
    path: 'tablero',
    lazy: async () => {
      const Comp = (await import('./Tablero')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'alta',
    lazy: async () => {
      const Comp = (await import('./AltaEstudiante')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id',
    lazy: async () => {
      const Comp = (await import('./EstudianteDetalle')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/aq10',
    lazy: async () => {
      const Comp = (await import('./AQ10Asistido')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/caracterizacion',
    lazy: async () => {
      const Comp = (await import('./CaracterizacionF1F2')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/contexto-barreras',
    lazy: async () => {
      const Comp = (await import('./ContextoBarreras')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/sugerencias',
    lazy: async () => {
      const Comp = (await import('./SugerenciasDua')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/plan',
    lazy: async () => {
      const Comp = (await import('./plan/PlanConstructor')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/seguimiento',
    lazy: async () => {
      const Comp = (await import('./SeguimientoBienestar')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'estudiantes/:id/evaluacion',
    lazy: async () => {
      const Comp = (await import('./EvaluacionF9F10')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'negociacion',
    lazy: async () => {
      const Comp = (await import('./NegociacionBandeja')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'inasistencia',
    lazy: async () => {
      const Comp = (await import('./Inasistencia')).default;
      return { Component: Comp };
    },
  },
];
