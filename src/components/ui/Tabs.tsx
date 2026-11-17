import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ------------------------------ Tabs ------------------------------ */
/**
 * Uso:
 *   <Tabs defaultValue="a">
 *     <TabsList aria-label="Secciones"><TabsTrigger value="a">Uno</TabsTrigger>...</TabsList>
 *     <TabsContent value="a">...</TabsContent>
 *   </Tabs>
 * Flechas izquierda/derecha cambian de pestaña. La pestaña activa tiene relleno + borde inferior grueso.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('mb-4 flex flex-wrap gap-2', className)} {...rest} />;
}

export function TabsTrigger({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'min-h-tactil rounded-control border-2 border-borde bg-blanco px-4 py-2 font-titulo text-base font-semibold',
        'data-[state=active]:bg-cobalto data-[state=active]:text-cobalto-on data-[state=active]:shadow-plano-tinta',
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('rounded-tarjeta', className)} {...rest} />;
}

/* ------------------------------ Accordion ------------------------------ */

export interface AccordionItemData {
  value: string;
  title: ReactNode;
  content: ReactNode;
}

export type AccordionProps = {
  items: AccordionItemData[];
  className?: string;
} & (
  | { type?: 'single'; defaultValue?: string; value?: string; onValueChange?: (v: string) => void }
  | {
      type: 'multiple';
      defaultValue?: string[];
      value?: string[];
      onValueChange?: (v: string[]) => void;
    }
);

/** Acordeón de contenido (p. ej. texto legal del F0 por secciones). Cerrado por defecto: nada se abre solo. */
export function Accordion({ items, className, ...root }: AccordionProps) {
  const rootProps = (
    root.type === 'multiple' ? root : { collapsible: true, ...root, type: 'single' }
  ) as ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
  return (
    <AccordionPrimitive.Root className={cn('flex flex-col gap-3', className)} {...rootProps}>
      {items.map((it) => (
        <AccordionPrimitive.Item
          key={it.value}
          value={it.value}
          className="rounded-control border-2 border-borde bg-blanco"
        >
          <AccordionPrimitive.Header className="m-0">
            <AccordionPrimitive.Trigger className="group flex min-h-tactil w-full items-center justify-between gap-3 rounded-control px-4 py-3 text-left font-titulo text-base font-semibold data-[state=open]:bg-limon-tinte">
              {it.title}
              <ChevronDown
                aria-hidden
                className="size-5 shrink-0 group-data-[state=open]:rotate-180"
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="border-t-2 border-borde px-4 py-3">
            {it.content}
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
