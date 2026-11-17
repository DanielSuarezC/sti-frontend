import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderIntl } from '@/test/utils';
import { LikertScale } from './LikertScale';

function Demo({ onChange }: { onChange?: (v: string) => void }) {
  const [v, setV] = useState<string | null>(null);
  return (
    <LikertScale
      legend="Prefiero hacer las cosas siempre de la misma manera."
      value={v}
      onChange={(x) => {
        setV(x);
        onChange?.(x);
      }}
    />
  );
}

describe('LikertScale (AQ-10)', () => {
  it('ofrece las 4 opciones dentro de un grupo con la pregunta como etiqueta', () => {
    renderIntl(<Demo />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(
      screen.getByRole('group', { name: /Prefiero hacer las cosas siempre/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Totalmente de acuerdo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ligeramente de acuerdo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ligeramente en desacuerdo' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Totalmente en desacuerdo' })).toBeInTheDocument();
  });

  it('elegir una opción llama a onChange y la marca como seleccionada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderIntl(<Demo onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: 'Ligeramente en desacuerdo' }));
    expect(onChange).toHaveBeenCalledWith('ligeramente_desacuerdo');
    expect(screen.getByRole('radio', { name: 'Ligeramente en desacuerdo' })).toBeChecked();
  });

  it('se puede usar con el teclado (tabulador, flechas y espacio)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderIntl(<Demo onChange={onChange} />);
    await user.tab();
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(radios[1]).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith('ligeramente_acuerdo');
  });

  it('muestra el error con texto y lo asocia al grupo', () => {
    renderIntl(
      <LikertScale legend="Pregunta" value={null} onChange={() => {}} error="Elige una opción." />,
    );
    expect(screen.getByText('Elige una opción.')).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAttribute('aria-describedby');
  });
});
