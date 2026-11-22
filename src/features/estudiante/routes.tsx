import type { RouteObject } from 'react-router-dom';
import { RoleHome } from '@/features/_shared/RoleHome';

export const estudianteRoutes: RouteObject[] = [
  { index: true, element: <RoleHome rol="ESTUDIANTE" /> },
  {
    path: 'mi-ruta',
    lazy: async () => {
      const Comp = (await import('./MiRuta')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'aq10',
    lazy: async () => {
      const Comp = (await import('./AQ10')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'perfil',
    lazy: async () => {
      const Comp = (await import('./MiPerfil')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'plan',
    lazy: async () => {
      const Comp = (await import('./MiPlan')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'seguimiento',
    lazy: async () => {
      const Comp = (await import('./Seguimiento')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'familiares',
    lazy: async () => {
      const Comp = (await import('./Familiares')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'derechos',
    lazy: async () => {
      const Comp = (await import('./DerechosArco')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'barreras',
    lazy: async () => {
      const Comp = (await import('./MiPerfil')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'evaluacion',
    lazy: async () => {
      const Comp = (await import('./Seguimiento')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'continuidad',
    lazy: async () => {
      const Comp = (await import('./MiPlan')).default;
      return { Component: Comp };
    },
  },
  {
    path: 'avisos',
    lazy: async () => {
      const Comp = (await import('@/features/_shared/Avisos')).default;
      return { Component: Comp };
    },
  },
];
