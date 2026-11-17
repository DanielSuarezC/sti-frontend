/** Sistema de diseño del STI. Importa SIEMPRE desde aquí: `import { Button, Card } from '@/components/ui'`. */
export {
  Button,
  CloseButton,
  buttonClasses,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './Button';
export { Card, CardTitle, LinkCard, type CardProps, type LinkCardProps } from './Card';
export { Field, controlClasses, type FieldBaseProps, type FieldControlProps } from './Field';
export {
  Input,
  Textarea,
  Select,
  type InputProps,
  type TextareaProps,
  type SelectProps,
} from './Inputs';
export {
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  type CheckboxProps,
  type RadioGroupProps,
  type RadioOption,
  type SwitchProps,
  type SliderProps,
} from './Choices';
export { LikertScale, AQ10_VALUES, type LikertScaleProps, type LikertOption } from './LikertScale';
export { Dialog, ConfirmDialog, type DialogProps, type ConfirmDialogProps } from './Dialog';
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  type AccordionProps,
  type AccordionItemData,
} from './Tabs';
export { Tooltip, TooltipProvider } from './Tooltip';
export {
  ToastProvider,
  useToast,
  MIN_TOAST_MS,
  type ToastOptions,
  type ToastVariant,
} from './Toast';
export {
  Badge,
  Chip,
  Progress,
  type BadgeProps,
  type ChipProps,
  type ProgressProps,
} from './Badge';
export {
  Semaforo,
  SemaforoIcono,
  SEMAFORO_ESTADOS,
  useSemaforoLabel,
  type SemaforoProps,
} from './Semaforo';
export { ModuloTag, ModuloLegend, type ModuloTagProps } from './ModuloTag';
export { NextStepBanner, type NextStepBannerProps } from './NextStepBanner';
export { PageShell, PageHeader, type PageShellProps, type PageHeaderProps } from './PageShell';
export {
  Wizard,
  StepProgress,
  type WizardProps,
  type WizardStep,
  type StepProgressProps,
} from './Wizard';
export {
  AutosaveIndicator,
  type AutosaveStatus,
  type AutosaveIndicatorProps,
} from './AutosaveIndicator';
export {
  EmptyState,
  ErrorState,
  LoadingState,
  type EmptyStateProps,
  type ErrorStateProps,
  type LoadingStateProps,
} from './States';
export {
  DataTable,
  type DataTableProps,
  type Column,
  type TableFilter,
  type SortState,
} from './DataTable';
export {
  SignaturePad,
  SignatureConsent,
  firmaValida,
  normalizarNombre,
  type SignaturePadProps,
  type SignatureConsentProps,
} from './Signature';
export { Stat, type StatProps } from './Stat';
export {
  BarChart,
  Donut,
  SemaforoTrend,
  ChartFigure,
  type BarChartProps,
  type BarDatum,
  type DonutProps,
  type DonutDatum,
  type SemaforoTrendProps,
  type SemaforoPoint,
  type ChartTable,
} from './Charts';
export { MiRuta, type MiRutaProps, type MiRutaPaso, type EstadoPaso } from './MiRuta';
