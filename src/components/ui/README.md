# Sistema de diseño (`components/ui`)

Importa SIEMPRE del índice: `import { Button, Card, PageShell } from '@/components/ui'`.
Todo sigue `sti/DESIGN.md`: borde 2px tinta, sombra plana, color con significado fijo, ícono + texto, sin movimiento automático.
Los textos internos salen de `locales/es-CO.json` (`ui.*`, `wizard.*`, `tabla.*`...). **Los textos que tú pasas por props deben venir de `intl.formatMessage`**.
Galería viva con todos los componentes: `npm run dev` y abre `/__galeria` (solo desarrollo).

Reglas para las pantallas:

1. Toda pantalla empieza con `<PageShell>` (título, una línea "qué haces aquí", `nextStep`, contenido, acción principal abajo a la derecha). Una sola acción primaria por pantalla.
2. Estados vacío / cargando / error SIEMPRE: `EmptyState`, `LoadingState`, `ErrorState` (o `DataTable`, que ya los trae).
3. Formularios: `<form noValidate>`; validación con zod + react-hook-form; mensajes de error = qué pasó + cómo arreglarlo.
4. Nunca uses color solo para informar: usa `Semaforo`, `ModuloTag`, `Badge` con texto.
5. Para colores de módulo usa `COLOR_CLASES` / `ModuloId` de `@/lib/pasos`, no hex ni clases sueltas.

---

## Acciones y contenedores

### `Button`

`variant?: 'primaria'|'secundaria'|'peligro'|'fantasma'`, `size?: 'md'|'lg'`, `loading?`, `loadingText?`, `leftIcon?`, `rightIcon?`, `fullWidth?` + atributos de `<button>`.

```tsx
<Button loading={mutation.isPending} rightIcon={<ArrowRight className="size-5" />} onClick={save}>
  Guardar
</Button>
```

Para un enlace con aspecto de botón: `<Link to="/x" className={buttonClasses('primaria','lg')}>`. `CloseButton({label})` para cerrar (ícono X con `aria-label`).

### `Card`, `CardTitle`, `LinkCard`

`Card({ color?: ColorModulo|'tinta', tinted?, as?, padding?: 'none'|'md'|'lg' })` — borde + sombra plana del color del módulo.
`LinkCard({ to, title, description?, icon?, color? })` — tarjeta de acceso, un solo enlace.

```tsx
<Card color="turquesa" tinted><CardTitle>Fortalezas</CardTitle>...</Card>
<LinkCard to="/estudiante/mi-ruta" title="Mi ruta" description="Tus 12 pasos" icon={Map} color="cobalto" />
```

### `PageShell`, `PageHeader`

`PageShell({ title, description?, modulo?: ModuloId, documentTitle?, nextStep?: NextStepBannerProps, primaryAction?, secondaryActions?, contentCard?=true, cardColor?, children })`.
Fija `document.title`. El `h1` tiene `id="titulo-pagina"`: el shell le pasa el foco al navegar.

```tsx
<PageShell
  title="Mi perfil"
  description="Revisa y edita tu caracterización."
  modulo="conocer"
  nextStep={{ title: 'Completa tus fortalezas', href: '/estudiante/fortalezas' }}
  primaryAction={<Button onClick={save}>Guardar</Button>}
>
  ...
</PageShell>
```

Con `contentCard={false}` compones tarjetas propias (las acciones igual van abajo a la derecha).

### `NextStepBanner`

`{ title, description?, actionLabel?='Hacer ahora', href? | onAction?, className? }` — "Lo que sigue", limón. Va siempre bajo el encabezado (PageShell lo hace con `nextStep`).

### `Dialog`, `ConfirmDialog`

`Dialog({ open, onOpenChange, title, description?, footer?, size?: 'sm'|'md'|'lg', children })` — acción principal a la derecha en `footer`.
`ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel?, variant?: 'primaria'|'peligro', loading?, onConfirm })`.
No abras diálogos solos (solo por acción de la persona).

### `Tabs`, `Accordion`, `Tooltip`

`Tabs/TabsList/TabsTrigger/TabsContent` (Radix: `defaultValue`, `value`, `onValueChange`). `Accordion({ items:[{value,title,content}], type?: 'single'|'multiple', defaultValue?, ... })`. `Tooltip({ content, side? , children })` (refuerzo; nada esencial). `TooltipProvider` ya está en `AppProviders`.

### `useToast` (`ToastProvider` ya montado)

```tsx
const { toast } = useToast();
toast({
  title: 'Plan guardado',
  description: 'Los cambios quedaron registrados.',
  variant: 'exito',
}); // 'info'|'exito'|'aviso'|'error'
```

`duration` mínimo 8000 ms (se fuerza); por defecto 10 s; `null` = no se descarta solo. Los errores usan `role="alert"`.

## Formularios

### `Field`

Base accesible: `<Field label help? error? required? hideLabel? group? id?>{(c) => <MiControl {...c} />}</Field>`; `c` = `{ id, aria-describedby, aria-invalid, aria-required }`.

### `Input`, `Textarea`, `Select`

Props: `label` (obligatoria), `help?`, `error?`, `required?`, `hideLabel?` + atributos nativos; `ref` reenviado (sirve con `register`). `Textarea`: `showCount?` + `maxLength`. `Select`: `placeholder?` + `<option>`s hijos (select nativo con el estilo del sistema).

```tsx
<Input
  label="Correo"
  help="El institucional"
  required
  error={errors.email?.message}
  {...register('email')}
/>
```

### `Checkbox`, `RadioGroup`, `Switch`, `Slider` (Radix; controlados — con RHF usa `Controller`)

- `Checkbox({ label, help?, error?, checked, onCheckedChange(boolean), required?, disabled? })`
- `RadioGroup({ legend, options:[{value,label,description?,disabled?}], value, onValueChange, orientation?, help?, error?, required? })`
- `Switch({ label, help?, checked, onCheckedChange })` — muestra "Activado/Desactivado" en texto.
- `Slider({ label, min, max, step?, value, onValueChange, valueText?(v), minLabel?, maxLabel? })`

```tsx
<Controller
  name="acepta"
  control={control}
  render={({ field }) => (
    <Checkbox label="Acepto" checked={field.value} onCheckedChange={field.onChange} />
  )}
/>
```

### `LikertScale` (AQ-10, 4 opciones)

`{ legend, value: string|null, onChange(value), options?: {value,label}[], error?, required?, disabled?, name? }`. Valores por defecto: `totalmente_acuerdo | ligeramente_acuerdo | ligeramente_desacuerdo | totalmente_desacuerdo` (`AQ10_VALUES`). La puntuación es del backend; el frontend solo envía lo elegido.

### `SignatureConsent`, `SignaturePad`, `firmaValida`

`SignatureConsent({ nombre, onNombreChange, aceptado, onAceptadoChange, textoAceptacion, nombreEsperado?, sello?, error?, disabled? })`: nombre tecleado + vista previa + casilla + sello de tiempo (muestra el del servidor en `sello`; antes explica que se registra al firmar). `firmaValida({nombre, aceptado, nombreEsperado})` habilita el botón de firmar. `SignaturePad` = solo la parte del nombre.

### `Wizard`, `StepProgress`, `AutosaveIndicator`, `useAutosave`

`Wizard({ steps:[{id,title,description?,content,canContinue?}], current?, onStepChange?, onFinish?, finishLabel?, finishLoading?, footerStatus? })` — "Paso N de M", Atrás a la izquierda, Siguiente/Terminar abajo a la derecha, foco y anuncio al cambiar de paso. `StepProgress({ current (1..), total, labels? })`.
`AutosaveIndicator({ status: 'idle'|'saving'|'saved'|'error', savedAt?, onRetry? })` → "Guardado a las 14:32".
`useAutosave(value, saveFn, { delay=1500, enabled=true })` (en `@/lib/useAutosave`) → `{ status, savedAt, flush }`:

```tsx
const { status, savedAt, flush } = useAutosave(values, (v) => api.patch(`/f1/${id}`, v), {
  enabled: loaded,
});
<AutosaveIndicator status={status} savedAt={savedAt} onRetry={flush} />;
```

## Datos y estados

### `DataTable<T>`

`{ columns: Column<T>[], data: T[], getRowId, caption, searchable?, filters?, pageSize=10, loading?, error?, onRetry?, emptyTitle?, emptyDescription?, emptyAction?, sort?, onSortChange?, serverSide?: { total, page, onPageChange } }`.
`Column<T> = { id, header, accessor?(row)=>valor (ordena y busca), cell?(row)=>ReactNode, sortable?, rowHeader?, align? }`. `filters: [{ id, label, options:[{value,label}], predicate(row, value) }]`.
Modo cliente por defecto (ordena, busca, filtra y pagina). Con `serverSide` solo pagina (y ordena si das `onSortChange`); filtra en el backend (`?page=&page_size=`).

### `EmptyState`, `ErrorState`, `LoadingState`

`EmptyState({ title, description?, icon?, action? })`; `ErrorState({ error?: unknown, title?, description?, onRetry? })` (traduce `ApiError`); `LoadingState({ label?, rows? })` (estático, sin giros).

```tsx
if (q.isPending) return <LoadingState />;
if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
if (!q.data.items.length)
  return <EmptyState title="Aún no hay ajustes" action={<Button>Crear</Button>} />;
```

### `Stat`

`{ label, value, hint?, icon?, color? }`.

## Color con significado

### `Semaforo`, `SemaforoIcono`, `useSemaforoLabel`

`Semaforo({ estado: 'VERDE'|'AMARILLO'|'ROJO', size?: 'sm'|'md'|'lg' })` → forma + símbolo + palabra (círculo ✔ "Funciona", triángulo ! "Revisar", octágono × "Rediseñar"). `SemaforoIcono({ estado, size })` solo la forma (aria-hidden; ponle texto al lado).

### `ModuloTag`, `ModuloLegend`

`<ModuloTag modulo="barreras" />` o `<ModuloTag paso={3} />` (`size?: 'sm'|'md'`). Módulos: `conocer`(fucsia) `contexto`(mandarina) `barreras`(turquesa) `dua`(cobalto) `apoyos`(limón) `seguimiento`/`evaluar`(uva) `trayectoria`(mandarina). Definiciones en `@/lib/pasos` (`PASOS`, `MODULOS`, `COLOR_CLASES`, `colorDePaso(n)`).

### `Badge`, `Chip`, `Progress`

`Badge({ color?: ColorModulo|'neutro', icon? })`; `Chip({ selected?, onClick?, onRemove? })` (filtro conmutable con `aria-pressed` o etiqueta quitable); `Progress({ value 0-100, label, color?, valueText? })`.

## Mi ruta y gráficos

### `MiRuta`

`{ pasos: { n: 1..12, estado: 'hecho'|'actual'|'pendiente', onSelect?: () => void }[], showLegend?=true }`. Mapa de metro: escritorio (contenedor ≥ 820 px) en dos filas con SVG; móvil vertical con descripción. La `<ol>` de botones es la versión accesible ("Paso 4: Identificar barreras. Estás aquí", `aria-current="step"`). El backend decide el estado de cada paso.

```tsx
<MiRuta
  pasos={pasos.map((p) => ({
    n: p.n,
    estado: p.estado,
    onSelect: () => navigate(rutaDePaso(p.n)),
  }))}
/>
```

### `SemaforoTrend`, `BarChart`, `Donut`, `ChartFigure`

Todos con título, resumen y botón "Ver como tabla" (tabla con los mismos datos).

- `SemaforoTrend({ title, description?, data:[{ corte:'C1', estado?: EstadoSemaforo|null }] })`
- `BarChart({ title, description?, data:[{label,value,color?}], valueLabel?, formatValue? })`
- `Donut({ title, description?, data:[{label,value,color?}], totalLabel? })`
- `ChartFigure({ title, description?, table:{columns,rows}, children })` para gráficos propios.
