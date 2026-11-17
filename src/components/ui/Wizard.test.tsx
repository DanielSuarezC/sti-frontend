import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderIntl } from '@/test/utils';
import { Wizard, StepProgress, type WizardStep } from './Wizard';

const steps = (canContinue = true): WizardStep[] => [
  { id: 'a', title: 'Datos básicos', content: <p>Contenido A</p>, canContinue },
  { id: 'b', title: 'Comunicación', content: <p>Contenido B</p> },
  { id: 'c', title: 'Sensorial', content: <p>Contenido C</p> },
];

describe('StepProgress', () => {
  it('muestra "Paso 3 de 8" en texto y marca el paso actual', () => {
    renderIntl(<StepProgress current={3} total={8} />);
    expect(screen.getByText('Paso 3 de 8')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(8);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
  });
});

describe('Wizard', () => {
  it('avanza y retrocede un tema por pantalla', async () => {
    const user = userEvent.setup();
    renderIntl(<Wizard steps={steps()} />);
    expect(screen.getByText('Paso 1 de 3', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Contenido A')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /atrás/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText('Contenido B')).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 3', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /atrás/i }));
    expect(screen.getByText('Contenido A')).toBeInTheDocument();
  });

  it('bloquea "Siguiente" si el paso no es válido', () => {
    renderIntl(<Wizard steps={steps(false)} />);
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('en el último paso ofrece "Terminar" y llama a onFinish', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    renderIntl(<Wizard steps={steps()} current={2} onFinish={onFinish} />);
    await user.click(screen.getByRole('button', { name: /terminar/i }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('al cambiar de paso lleva el foco al título del nuevo paso', async () => {
    const user = userEvent.setup();
    renderIntl(<Wizard steps={steps()} />);
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByRole('heading', { name: 'Comunicación' })).toHaveFocus();
  });
});
