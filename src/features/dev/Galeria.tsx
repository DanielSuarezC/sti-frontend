/**
 * GALERÍA DE COMPONENTES — solo desarrollo (`/__galeria`, no existe en producción).
 * Sirve para ver y probar el sistema de diseño. Texto de ejemplo en español, sin pasar por intl
 * porque este archivo no se incluye en el build de producción.
 */
import { useState } from 'react';
import { BookOpen, Users, Heart } from 'lucide-react';
import {
  Accordion,
  AutosaveIndicator,
  Badge,
  BarChart,
  Button,
  Card,
  Checkbox,
  Chip,
  ConfirmDialog,
  DataTable,
  Dialog,
  Donut,
  EmptyState,
  ErrorState,
  Input,
  LikertScale,
  LoadingState,
  MiRuta,
  ModuloTag,
  NextStepBanner,
  PageShell,
  Progress,
  RadioGroup,
  Select,
  Semaforo,
  SemaforoTrend,
  SignatureConsent,
  Slider,
  Stat,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  useToast,
  Wizard,
  type EstadoPaso,
} from '@/components/ui';
import { PASOS } from '@/lib/pasos';
import { ApiError } from '@/lib/api';

const filas = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nombre: ['Ana', 'Luis', 'Marta', 'Pedro', 'Sofía'][i % 5]! + ' ' + (i + 1),
  programa: i % 2 ? 'Enfermería' : 'Psicología',
  corte: i % 3,
}));

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b-2 border-borde pb-2">{titulo}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function Galeria() {
  const [dlg, setDlg] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [likert, setLikert] = useState<string | null>('ligeramente_acuerdo');
  const [nombre, setNombre] = useState('Ana María Pérez');
  const [ok, setOk] = useState(true);
  const [slider, setSlider] = useState(3);
  const [sw, setSw] = useState(true);
  const { toast } = useToast();
  const [actual, setActual] = useState(6);
  const pasos = PASOS.map((p) => ({
    n: p.n,
    estado: (p.n < actual ? 'hecho' : p.n === actual ? 'actual' : 'pendiente') as EstadoPaso,
    onSelect: () => setActual(p.n),
  }));

  return (
    <PageShell
      title="Galería del sistema de diseño"
      description="Solo desarrollo. Todos los componentes con datos de ejemplo."
      contentCard={false}
      nextStep={{
        title: 'Completa tu perfil de fortalezas',
        description: 'Te toma unos 10 minutos.',
        href: '/galeria',
      }}
      primaryAction={<Button>Acción principal</Button>}
    >
      <Seccion titulo="Mi ruta (12 pasos)">
        <Card color="cobalto" padding="lg">
          <MiRuta pasos={pasos} />
        </Card>
      </Seccion>

      <Seccion titulo="Botones, badges y chips">
        <div className="flex flex-wrap gap-4">
          <Button>Primaria</Button>
          <Button variant="secundaria">Secundaria</Button>
          <Button variant="peligro">Peligro</Button>
          <Button variant="fantasma">Fantasma</Button>
          <Button loading>Cargando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge>Neutro</Badge>
          <Badge color="fucsia">Fucsia</Badge>
          <Badge color="turquesa">Turquesa</Badge>
          <Badge color="uva">Uva</Badge>
          <Badge color="mandarina">Mandarina</Badge>
          <Badge color="limon">Limón</Badge>
          <Chip selected onClick={() => {}}>
            Filtro activo
          </Chip>
          <Chip onClick={() => {}}>Filtro</Chip>
          <Chip onRemove={() => {}}>Quitable</Chip>
        </div>
        <div className="flex flex-wrap gap-3">
          <Semaforo estado="VERDE" />
          <Semaforo estado="AMARILLO" />
          <Semaforo estado="ROJO" />
        </div>
        <div className="flex flex-wrap gap-3">
          {PASOS.filter((p) => [1, 3, 4, 6, 9, 10, 11, 12].includes(p.n)).map((p) => (
            <ModuloTag key={p.n} paso={p.n} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Tarjetas y cifras">
        <div className="grid gap-5 md:grid-cols-3">
          <Stat
            label="Estudiantes con plan activo"
            value="24"
            hint="de 30 en el piloto"
            icon={Users}
            color="cobalto"
          />
          <Stat label="Ajustes en Verde" value="82 %" icon={BookOpen} color="turquesa" />
          <Stat label="Pendientes de firma" value="3" icon={Heart} color="fucsia" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Card color="mandarina" tinted>
            Tarjeta con tinte mandarina
          </Card>
          <Card color="uva">Tarjeta con sombra uva</Card>
          <Card color="limon">Tarjeta con sombra limón</Card>
        </div>
      </Seccion>

      <Seccion titulo="Formularios">
        <Card padding="lg" className="space-y-5">
          <Input
            label="Correo institucional"
            help="El mismo de tu invitación."
            required
            placeholder="nombre@universidad.edu.co"
          />
          <Input
            label="Con error"
            error="El correo no parece válido. Revisa que tenga @."
            defaultValue="ana@"
          />
          <Textarea
            label="Cuéntanos cómo aprendes mejor"
            showCount
            maxLength={300}
            defaultValue="Aprendo mejor con ejemplos."
          />
          <Select label="Programa" placeholder="Elige un programa">
            <option>Enfermería</option>
            <option>Psicología</option>
          </Select>
          <Checkbox
            label="Acepto que Bienestar vea mi caracterización"
            checked={ok}
            onCheckedChange={setOk}
            help="Puedes retirarlo cuando quieras."
          />
          <RadioGroup
            legend="¿Cómo prefieres recibir avisos?"
            value="correo"
            options={[
              { value: 'correo', label: 'Por correo' },
              {
                value: 'app',
                label: 'Solo en la aplicación',
                description: 'Los verás en la campana.',
              },
            ]}
          />
          <Switch label="Recordatorios de corte" checked={sw} onCheckedChange={setSw} />
          <Slider
            label="Nivel de ruido que tolero"
            min={1}
            max={5}
            value={slider}
            onValueChange={setSlider}
            valueText={(v) => `${v} de 5`}
            minLabel="Muy bajo"
            maxLabel="Muy alto"
          />
          <LikertScale
            legend="1. Suelo notar pequeños sonidos que otros no notan."
            value={likert}
            onChange={setLikert}
          />
        </Card>
        <Card padding="lg">
          <SignatureConsent
            nombre={nombre}
            onNombreChange={setNombre}
            aceptado={ok}
            onAceptadoChange={setOk}
            textoAceptacion="Entiendo y acepto el tratamiento de mis datos, incluidos los sensibles de salud."
            nombreEsperado="Ana María Pérez"
          />
        </Card>
      </Seccion>

      <Seccion titulo="Wizard y guardado automático">
        <Wizard
          steps={[
            {
              id: '1',
              title: 'Datos básicos',
              description: 'Confirma tus datos.',
              content: <Input label="Nombre completo" defaultValue="Ana María Pérez" />,
            },
            {
              id: '2',
              title: 'Comunicación',
              description: 'Cómo prefieres comunicarte.',
              content: <Textarea label="Preferencias" />,
            },
            { id: '3', title: 'Sensorial', content: <Switch label="Me molesta la luz fuerte" /> },
          ]}
          footerStatus={
            <AutosaveIndicator status="saved" savedAt={new Date('2026-11-16T14:32:00')} />
          }
        />
        <div className="flex flex-wrap gap-6">
          <AutosaveIndicator status="saving" />
          <AutosaveIndicator status="error" onRetry={() => {}} />
        </div>
        <Progress label="Avance del plan" value={62} color="uva" />
      </Seccion>

      <Seccion titulo="Gráficos">
        <div className="grid gap-5 lg:grid-cols-2">
          <SemaforoTrend
            title="Evolución del semáforo"
            description="Ajuste de evaluación"
            data={[
              { corte: 'C1', estado: 'ROJO' },
              { corte: 'C2', estado: 'AMARILLO' },
              { corte: 'C3', estado: null },
            ]}
          />
          <BarChart
            title="Ajustes por categoría"
            data={[
              { label: 'Comunicación', value: 12, color: 'cobalto' },
              { label: 'Pedagogía', value: 18, color: 'turquesa' },
              { label: 'Evaluación', value: 9, color: 'uva' },
              { label: 'Ambiente', value: 4, color: 'mandarina' },
            ]}
            valueLabel="Ajustes"
          />
          <Donut
            title="Estado del semáforo"
            totalLabel="ajustes"
            data={[
              { label: 'Funciona', value: 30, color: 'turquesa' },
              { label: 'Revisar', value: 12, color: 'limon' },
              { label: 'Rediseñar', value: 4, color: 'fucsia' },
            ]}
          />
        </div>
      </Seccion>

      <Seccion titulo="Tabla de datos">
        <DataTable
          caption="Estudiantes del piloto"
          data={filas}
          getRowId={(r) => r.id}
          searchable
          pageSize={6}
          filters={[
            {
              id: 'prog',
              label: 'Programa',
              options: [
                { value: 'Enfermería', label: 'Enfermería' },
                { value: 'Psicología', label: 'Psicología' },
              ],
              predicate: (r, v) => r.programa === v,
            },
          ]}
          columns={[
            { id: 'nombre', header: 'Nombre', accessor: (r) => r.nombre, rowHeader: true },
            { id: 'programa', header: 'Programa', accessor: (r) => r.programa },
            {
              id: 'corte',
              header: 'Semáforo',
              accessor: (r) => r.corte,
              cell: (r) => (
                <Semaforo size="sm" estado={(['VERDE', 'AMARILLO', 'ROJO'] as const)[r.corte]!} />
              ),
            },
          ]}
        />
      </Seccion>

      <Seccion titulo="Estados y avisos">
        <div className="grid gap-5 md:grid-cols-3">
          <EmptyState
            title="Aún no tienes ajustes"
            description="Cuando Bienestar los concierte contigo, aparecerán aquí."
            action={<Button>Ir a mi ruta</Button>}
          />
          <ErrorState error={new ApiError(500, '', 'X')} onRetry={() => {}} />
          <LoadingState />
        </div>
        <NextStepBanner
          title="Firma tu consentimiento"
          actionLabel="Firmar ahora"
          href="/galeria"
        />
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secundaria"
            onClick={() =>
              toast({
                title: 'Plan guardado',
                description: 'Se mantiene visible 10 segundos.',
                variant: 'exito',
              })
            }
          >
            Toast éxito
          </Button>
          <Button
            variant="secundaria"
            onClick={() =>
              toast({
                title: 'No se pudo guardar',
                description: 'Revisa tu conexión.',
                variant: 'error',
              })
            }
          >
            Toast error
          </Button>
          <Button variant="secundaria" onClick={() => setDlg(true)}>
            Abrir diálogo
          </Button>
          <Button variant="peligro" onClick={() => setConfirm(true)}>
            Confirmar
          </Button>
          <Tooltip content="Ayuda breve">
            <Button variant="fantasma">Pasa el cursor</Button>
          </Tooltip>
        </div>
        <Dialog
          open={dlg}
          onOpenChange={setDlg}
          title="Un diálogo"
          description="Explica en una frase qué haces aquí."
          footer={<Button onClick={() => setDlg(false)}>Entendido</Button>}
        >
          <p>Contenido del diálogo.</p>
        </Dialog>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="¿Retirar el ajuste?"
          description="El ajuste dejará de aplicarse. Podrás volver a activarlo."
          confirmLabel="Retirar ajuste"
          variant="peligro"
          onConfirm={() => setConfirm(false)}
        />
      </Seccion>

      <Seccion titulo="Pestañas y acordeón">
        <Tabs defaultValue="a">
          <TabsList aria-label="Ejemplo">
            <TabsTrigger value="a">Resumen</TabsTrigger>
            <TabsTrigger value="b">Ajustes</TabsTrigger>
          </TabsList>
          <TabsContent value="a">
            <Card>Contenido del resumen.</Card>
          </TabsContent>
          <TabsContent value="b">
            <Card>Contenido de ajustes.</Card>
          </TabsContent>
        </Tabs>
        <Accordion
          items={[
            { value: '1', title: 'Qué datos recogemos', content: <p>Solo lo necesario.</p> },
            { value: '2', title: 'Quién los ve', content: <p>Cada rol ve lo suyo.</p> },
          ]}
        />
      </Seccion>
    </PageShell>
  );
}
