import type { Config } from 'tailwindcss';

/** Color de módulo: sólido + texto encima (`on`) + tinte claro para fondos de sección. */
const modulo = (n: string) => ({
  DEFAULT: `var(--${n})`,
  on: `var(--on-${n})`,
  tinte: `var(--${n}-tinte)`,
});

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tinta: { DEFAULT: 'var(--tinta)', suave: 'var(--tinta-suave)' },
        papel: 'var(--papel)',
        blanco: 'var(--blanco)',
        cobalto: modulo('cobalto'),
        mandarina: modulo('mandarina'),
        fucsia: modulo('fucsia'),
        turquesa: modulo('turquesa'),
        limon: modulo('limon'),
        uva: modulo('uva'),
        verde: { DEFAULT: 'var(--verde)', tinte: 'var(--verde-tinte)' },
        amarillo: {
          DEFAULT: 'var(--amarillo)',
          fondo: 'var(--amarillo-fondo)',
          tinte: 'var(--amarillo-tinte)',
        },
        rojo: { DEFAULT: 'var(--rojo)', tinte: 'var(--rojo-tinte)' },
        borde: 'var(--borde)',
        foco: 'var(--foco)',
        enlace: 'var(--enlace)',
      },
      fontFamily: {
        titulo: ['var(--fuente-titulo)'],
        cuerpo: ['var(--fuente-cuerpo)'],
      },
      // Escala DESIGN.md (rem; cuerpo = 1.0625rem). El tamaño del usuario escala el <html>.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.5' }],
        sm: ['0.9375rem', { lineHeight: '1.55' }],
        base: ['1.0625rem', { lineHeight: '1.6' }],
        lg: ['1.25rem', { lineHeight: '1.45' }],
        xl: ['1.5625rem', { lineHeight: '1.3' }],
        '2xl': ['1.953rem', { lineHeight: '1.25' }],
        '3xl': ['2.441rem', { lineHeight: '1.2' }],
      },
      borderRadius: { tarjeta: '20px', control: '12px' },
      maxWidth: { medida: '68ch' },
      minHeight: { tactil: '44px' },
      minWidth: { tactil: '44px' },
      boxShadow: {
        // Sombras planas desplazadas: sin difusión, sin degradado.
        plano: '4px 4px 0 0 var(--sombra, var(--tinta))',
        'plano-sm': '2px 2px 0 0 var(--sombra, var(--tinta))',
        'plano-tinta': '4px 4px 0 0 var(--tinta)',
        'plano-cobalto': '4px 4px 0 0 var(--cobalto)',
        'plano-mandarina': '4px 4px 0 0 var(--mandarina)',
        'plano-fucsia': '4px 4px 0 0 var(--fucsia)',
        'plano-turquesa': '4px 4px 0 0 var(--turquesa)',
        'plano-limon': '4px 4px 0 0 var(--limon)',
        'plano-uva': '4px 4px 0 0 var(--uva)',
      },
    },
  },
  plugins: [],
};

export default config;
