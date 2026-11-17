import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderIntl } from '@/test/utils';
import { MiRuta, type EstadoPaso, type MiRutaPaso } from './MiRuta';

const pasos = (actual = 4, onSelect?: (n: number) => void): MiRutaPaso[] =>
  Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const estado: EstadoPaso = n < actual ? 'hecho' : n === actual ? 'actual' : 'pendiente';
    return { n, estado, onSelect: onSelect ? () => onSelect(n) : undefined };
  });

describe('MiRuta', () => {
  it('expone los 12 pasos como lista de botones con nombre claro', () => {
    renderIntl(<MiRuta pasos={pasos(4, () => {})} />);
    const lista = screen.getByRole('list', { name: /12 pasos/i });
    expect(within(lista).getAllByRole('button')).toHaveLength(12);
    expect(
      screen.getByRole('button', { name: 'Paso 1: Conocer al estudiante. Hecho' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Paso 4: Identificar barreras. Estás aquí' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Paso 12: Favorecer trayectoria. Pendiente' }),
    ).toBeInTheDocument();
  });

  it('marca el paso actual con aria-current="step" y el texto "Estás aquí"', () => {
    renderIntl(<MiRuta pasos={pasos(6, () => {})} />);
    const actual = screen.getByRole('button', { name: /Paso 6/ });
    expect(actual).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByText('Estás aquí').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Paso 5/ })).not.toHaveAttribute('aria-current');
  });

  it('cada estación llama a onSelect con su paso', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderIntl(<MiRuta pasos={pasos(3, onSelect)} />);
    await user.click(screen.getByRole('button', { name: /Paso 9:/ }));
    expect(onSelect).toHaveBeenCalledWith(9);
  });

  it('sin onSelect las estaciones solo informan (no son botones)', () => {
    renderIntl(<MiRuta pasos={pasos(3)} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(12);
  });

  it('dibuja el mapa SVG horizontal cuando el contenedor es ancho', () => {
    const spy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    const { container } = renderIntl(<MiRuta pasos={pasos(2, () => {})} />);
    const svg = container.querySelector('svg[viewBox="0 0 1230 680"]');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(12);
    spy.mockRestore();
  });

  it('incluye la leyenda de módulos con color + nombre', () => {
    renderIntl(<MiRuta pasos={pasos(1)} />);
    expect(screen.getByText('Barreras y facilitadores')).toBeInTheDocument();
    expect(screen.getByText('DUA y ajustes')).toBeInTheDocument();
  });
});
