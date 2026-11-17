import type { RouteObject } from 'react-router-dom';
import UsuariosAdmin from './UsuariosAdmin';
import CatalogoDuaAdmin from './CatalogoDuaAdmin';
import AQ10Admin from './AQ10Admin';
import CalendarioAdmin from './CalendarioAdmin';
import ImportacionEstudiantes from './ImportacionEstudiantes';
import SolicitudesAdmin from './SolicitudesAdmin';
import AuditoriaAdmin from './AuditoriaAdmin';
import SaludAdmin from './SaludAdmin';

export const adminRoutes: RouteObject[] = [
  { index: true, element: <UsuariosAdmin /> },
  { path: 'usuarios', element: <UsuariosAdmin /> },
  { path: 'catalogo-dua', element: <CatalogoDuaAdmin /> },
  { path: 'aq10', element: <AQ10Admin /> },
  { path: 'calendario', element: <CalendarioAdmin /> },
  { path: 'importacion', element: <ImportacionEstudiantes /> },
  { path: 'solicitudes', element: <SolicitudesAdmin /> },
  { path: 'auditoria', element: <AuditoriaAdmin /> },
  { path: 'salud', element: <SaludAdmin /> },
];
