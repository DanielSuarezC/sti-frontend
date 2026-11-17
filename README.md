# STI — Frontend (Plan MAAR-TEA)

React 18 + TypeScript estricto + Vite + Tailwind 3 + Radix UI + React Router 6 + TanStack Query 5 + react-hook-form + zod + react-intl (es-CO) + lucide-react. Fuentes autoalojadas (`@fontsource`: Lexend, Atkinson Hyperlegible, OpenDyslexic).
Contratos: `../BUILD_SPEC.md` (funcional) y `../DESIGN.md` (sistema visual, **contrato del cliente**). Catálogo de componentes: `src/components/ui/README.md`.

## Comandos
```
npm install
npm run dev              # http://localhost:5173 — proxy /api -> http://localhost:8000
npm run build            # tsc + vite build
npm run lint             # eslint (jsx-a11y) — debe quedar limpio
npm run typecheck        # tsc --noEmit
npm test                 # vitest (incluye contraste e i18n)
npm run check:contrast   # razón de contraste de TODOS los tokens en 3 modos (falla < 4.5:1)
node scripts/check-i18n.mjs   # todos los ids de mensaje existen en es-CO.json
```
Galería de componentes (solo dev): `/__galeria`.

## Estructura
```
src/
├── app/          router.tsx (rutas), guards.tsx, nav.ts (MENÚ POR ROL), providers.tsx, shell/ (AppShell, riel, barra inferior, campana, panel sensorial)
├── components/ui/  sistema de diseño (+ README con el catálogo)
├── features/
│   ├── public/     login, activar, recuperar/restablecer, privacidad, 403/404/error, SolicitarAcceso (placeholder)
│   ├── estudiante|bienestar|coordinador|docente|familiar|admin/routes.tsx   <- cada agente de rol trabaja AQUÍ
│   ├── _shared/RoleHome.tsx   inicio genérico (saludo + "Lo que sigue" + accesos desde nav.ts)
│   └── dev/Galeria.tsx
├── lib/          api.ts, auth.tsx, sensory.tsx, notificaciones.ts, announce.tsx, i18n.tsx, pasos.ts, useAutosave.ts, types.ts, cn.ts
├── locales/es-CO.json   TODO texto visible
├── styles/       tokens.css (colores = fuente única), index.css
└── test/         setup y utilidades (renderWithProviders, usuarioDemo)
functions/api/[[path]].js   proxy Cloudflare Pages -> env.BACKEND_URL (cookies same-origin)
public/_headers, _redirects  CSP/HSTS y SPA fallback
```

## Cómo añadir una pantalla (flujo para agentes de rol)
1. Crea `src/features/<rol>/MiPantalla.tsx` con `<PageShell>`; textos con `useIntl()` y ids nuevos en `locales/es-CO.json` (`area.clave`).
2. Regístrala en `src/features/<rol>/routes.tsx` (rutas **relativas**, p. ej. `{ path: 'mi-ruta', element: <MiRuta /> }`; admite `lazy`). El 404 interno y el guard de rol ya los pone el router.
3. Añade UN ítem a `NAV[<ROL>]` en `src/app/nav.ts` (ícono lucide + `labelId`, `descId?`, `color?`). Aparece en riel, barra móvil y tarjetas del Inicio.
4. Datos: `useQuery`/`useMutation` con `get/post/patch/put/del` de `@/lib/api`. Errores: `ErrorState error={q.error}` o `getErrorMessage(err, intl)`.
5. `npm run lint && npx tsc --noEmit && npm test && node scripts/check-i18n.mjs`.

Para reemplazar el Inicio de un rol, cambia `{ index: true, element: <RoleHome rol="X" /> }` por tu componente; o pasa `nextStep` real a `RoleHome`.

## Convenciones y decisiones
- **Sin lógica de negocio** (P6): semáforo, puntajes, estados y reglas llegan del backend; aquí solo se muestran.
- **Rutas**: `/estudiante/*`, `/bienestar/*`, `/coordinador/*`, `/docente/*`, `/familiar/*`, `/admin/*`. Pública: `/login`, `/activar?token=`, `/recuperar`, `/restablecer?token=`, `/privacidad`, `/solicitar-acceso`, `/403`, `/404`. Sin sesión -> `/login` (vuelve a donde iba). Rol equivocado -> `/403`.
- **F0**: estudiante con `consentimiento_firmado=false` solo ve `/estudiante/consentimiento` (layout `minimal`, sin riel). El agente de F0 reemplaza `features/estudiante/Consentimiento.tsx` y, al firmar, llama `useAuth().refreshUser()` y navega a `/estudiante`.
- **Sesión**: access token solo en memoria; al cargar se restaura con `POST /auth/refresh` (cookie HttpOnly). 401 -> un único refresh compartido (cola) y un reintento; si falla -> sesión cerrada.
- **API**: base `VITE_API_URL ?? "/api/v1"`. Usa solo `@/lib/api` (nunca `fetch` directo). Paginación `{items,total,page,page_size}` (`Pagina<T>` en `lib/types`). Descargas: `downloadFile(path)` / `getBlob`.
- **Preferencias sensoriales** (`useSensory()`): `{ modo_calma, tamano_texto: 100|115|130, espaciado: 'normal'|'amplio', sin_movimiento, alto_contraste, fuente: 'predeterminada'|'dislexia'|'sistema' }`. Se aplican como `data-*` en `<html>`, se guardan en localStorage y se envían a `PATCH /auth/me/preferencias` (el backend manda al iniciar sesión). **Supuesto**: los valores de `espaciado` y `fuente` los asumimos como los de arriba; `normalizarPreferencias` tolera variantes. Confirmar con el backend.
- **Notificaciones**: `useNotificaciones()` consulta cada 30 s; la campana ya está en el shell.
- **Movimiento**: nada se anima solo; transiciones ≤150 ms solo como respuesta a una acción; `prefers-reduced-motion` y "Sin movimiento" las anulan. Los "cargando" son estáticos.
- **Selects** son `<select>` nativos con el estilo del sistema (más predecibles en teclado, móvil y lectores). El resto de controles sí usan Radix.
- **Aviso de privacidad**: texto de trabajo en lenguaje claro; la oficina jurídica debe revisarlo.
- **Colores**: no uses hex ni `bg-blue-*`; usa tokens (`bg-cobalto`, `text-cobalto-on`, `bg-fucsia-tinte`, `shadow-plano-uva`, `border-borde`, `text-tinta-suave`...). Si necesitas un color nuevo, agrégalo a `tokens.css` en los 3 modos y ejecuta `check:contrast`.
- **Accesibilidad**: foco global 2px blanco + 3px cobalto; objetivos ≥44 px (`min-h-tactil`); un solo `h1` (PageShell); "Saltar al contenido" y región live (`useAnnounce()`) ya están en el shell.

## Despliegue (Cloudflare Pages)
Build: `npm run build`, salida `dist/`. Variable `BACKEND_URL` (URL del backend en Render, sin `/`) como variable del proyecto Pages. `functions/api/[[path]].js` hace el proxy de `/api/*` conservando método, cuerpo, cabeceras y cada `Set-Cookie`; así el refresh token es same-origin. `public/_redirects` = fallback SPA; `public/_headers` = CSP, HSTS, nosniff, Referrer-Policy. Prueba local del proxy: `npx wrangler pages dev dist` con `BACKEND_URL=http://localhost:8000`.
