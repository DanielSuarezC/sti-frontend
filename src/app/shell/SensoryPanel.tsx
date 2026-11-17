import { createContext, useContext } from 'react';
import { useIntl } from 'react-intl';
import { Button, Dialog, RadioGroup, Switch } from '@/components/ui';
import { useSensory } from '@/lib/sensory';
import type { Fuente, TamanoTexto } from '@/lib/types';

/** Permite que cualquier pantalla abra el panel "Cómo me siento mejor" (`useSensoryPanel().open()`). */
interface PanelCtx {
  open: () => void;
}
export const SensoryPanelContext = createContext<PanelCtx>({ open: () => {} });
export const useSensoryPanel = () => useContext(SensoryPanelContext);

/** Panel "Cómo me siento mejor": los cambios se aplican en vivo. */
export function SensoryPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const intl = useIntl();
  const { prefs, update, reset } = useSensory();
  const t = (id: string) => intl.formatMessage({ id });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('sensorial.titulo')}
      description={t('sensorial.descripcion')}
      footer={
        <>
          <Button variant="secundaria" onClick={reset}>
            {t('sensorial.restablecer')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t('sensorial.listo')}</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Switch
          label={t('sensorial.calma')}
          help={t('sensorial.calma.ayuda')}
          checked={prefs.modo_calma}
          onCheckedChange={(v) => update({ modo_calma: v })}
        />
        <Switch
          label={t('sensorial.contraste')}
          help={t('sensorial.contraste.ayuda')}
          checked={prefs.alto_contraste}
          onCheckedChange={(v) => update({ alto_contraste: v })}
        />
        <Switch
          label={t('sensorial.movimiento')}
          help={t('sensorial.movimiento.ayuda')}
          checked={prefs.sin_movimiento}
          onCheckedChange={(v) => update({ sin_movimiento: v })}
        />
        <Switch
          label={t('sensorial.espaciado')}
          help={t('sensorial.espaciado.ayuda')}
          checked={prefs.espaciado === 'amplio'}
          onCheckedChange={(v) => update({ espaciado: v ? 'amplio' : 'normal' })}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <RadioGroup
            legend={t('sensorial.texto')}
            orientation="vertical"
            value={String(prefs.tamano_texto)}
            onValueChange={(v) => update({ tamano_texto: Number(v) as TamanoTexto })}
            options={[
              { value: '100', label: t('sensorial.texto.100') },
              { value: '115', label: t('sensorial.texto.115') },
              { value: '130', label: t('sensorial.texto.130') },
            ]}
          />
          <RadioGroup
            legend={t('sensorial.fuente')}
            value={prefs.fuente}
            onValueChange={(v) => update({ fuente: v as Fuente })}
            options={[
              { value: 'predeterminada', label: t('sensorial.fuente.predeterminada') },
              { value: 'dislexia', label: t('sensorial.fuente.dislexia') },
              { value: 'sistema', label: t('sensorial.fuente.sistema') },
            ]}
          />
        </div>
      </div>
    </Dialog>
  );
}
