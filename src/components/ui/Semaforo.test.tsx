import { screen } from '@testing-library/react';
import { renderIntl } from '@/test/utils';
import { Semaforo } from './Semaforo';

describe('Semaforo', () => {
  it('muestra la palabra de cada estado (no depende solo del color)', () => {
    renderIntl(
      <>
        <Semaforo estado="VERDE" />
        <Semaforo estado="AMARILLO" />
        <Semaforo estado="ROJO" />
      </>,
    );
    expect(screen.getByText('Funciona')).toBeInTheDocument();
    expect(screen.getByText('Revisar')).toBeInTheDocument();
    expect(screen.getByText('Rediseñar')).toBeInTheDocument();
  });

  it('cada estado dibuja una forma distinta (círculo, triángulo, octágono)', () => {
    const verde = renderIntl(<Semaforo estado="VERDE" />);
    expect(verde.container.querySelector('svg circle')).not.toBeNull();
    verde.unmount();

    const amarillo = renderIntl(<Semaforo estado="AMARILLO" />);
    const triangulo = amarillo.container.querySelector('svg path')!.getAttribute('d')!;
    amarillo.unmount();

    const rojo = renderIntl(<Semaforo estado="ROJO" />);
    const octagono = rojo.container.querySelector('svg path')!.getAttribute('d')!;

    expect(triangulo).not.toEqual(octagono);
    // Triángulo: 2 aristas L + cierre; octágono: 6 aristas L + cierre.
    expect((triangulo.match(/[LHV]/g) ?? []).length).toBeLessThan(
      (octagono.match(/[LHV]/g) ?? []).length,
    );
  });

  it('el ícono es decorativo para lectores de pantalla (la palabra ya lo dice)', () => {
    const { container } = renderIntl(<Semaforo estado="ROJO" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
