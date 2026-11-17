#!/usr/bin/env node
/**
 * Verifica la razón de contraste (WCAG 2.1) de TODAS las parejas texto/fondo
 * y componente/fondo de los tokens de `src/styles/tokens.css`, en los tres modos:
 * normal, calma y alto contraste. Sale con código 1 si alguna pareja no cumple.
 *
 *   texto normal ............ >= 4.5:1
 *   texto grande / gráficos ... >= 3:1
 *
 * Uso: `npm run check:contrast` (añade `--hex` para imprimir la tabla de hex finales).
 * Regla: si falla, se corrige el TOKEN en tokens.css; no se aceptan excepciones.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../src/styles/tokens.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/* ---------- parseo de bloques ---------- */
const blocks = {};
for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const selector = m[1].trim();
  const vars = {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  blocks[selector] = vars;
}
const base = blocks[':root'];
const modes = {
  normal: { ...base },
  calma: { ...base, ...blocks[":root[data-calma='true']"] },
  'alto-contraste': { ...base, ...blocks[":root[data-contraste='alto']"] },
};

function resolveVar(vars, name, depth = 0) {
  const raw = vars[name];
  if (raw === undefined) throw new Error(`Token no definido: ${name}`);
  const ref = raw.match(/^var\((--[\w-]+)\)$/);
  if (ref) {
    if (depth > 8) throw new Error(`Referencia circular en ${name}`);
    return resolveVar(vars, ref[1], depth + 1);
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(raw)) throw new Error(`Valor no hex en ${name}: ${raw}`);
  return raw.toLowerCase();
}

/* ---------- WCAG ---------- */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- parejas [primer plano, fondo, mínimo, uso] ---------- */
const MODULOS = ['cobalto', 'mandarina', 'fucsia', 'turquesa', 'limon', 'uva'];
const pairs = [];
const add = (fg, bg, min, uso) => pairs.push({ fg, bg, min, uso });

// Texto de cuerpo
for (const bg of [
  '--papel',
  '--blanco',
  ...MODULOS.map((m) => `--${m}-tinte`),
  '--verde-tinte',
  '--amarillo-tinte',
  '--rojo-tinte',
]) {
  add('--tinta', bg, 4.5, `texto principal sobre ${bg}`);
}
for (const bg of ['--papel', '--blanco', ...MODULOS.map((m) => `--${m}-tinte`)]) {
  add('--tinta-suave', bg, 4.5, `texto secundario sobre ${bg}`);
}
// Color de módulo sólido + su texto
for (const m of MODULOS)
  add(`--on-${m}`, `--${m}`, 4.5, `texto sobre ${m} (botón, ModuloTag, Badge)`);
// Enlaces y acción principal
for (const bg of ['--papel', '--blanco', '--cobalto-tinte'])
  add('--enlace', bg, 4.5, `enlace sobre ${bg}`);
// Inverso (tooltip, toasts de aviso)
add('--blanco', '--tinta', 4.5, 'texto inverso sobre tinta (tooltip)');
add('--papel', '--tinta', 4.5, 'texto papel sobre tinta');
// Semáforo y estados: texto/ícono de color sobre claro
for (const bg of ['--blanco', '--papel']) {
  add('--verde', bg, 4.5, `verde (Funciona/éxito) sobre ${bg}`);
  add('--amarillo', bg, 4.5, `amarillo (Revisar) sobre ${bg}`);
  add('--rojo', bg, 4.5, `rojo (Rediseñar/error) sobre ${bg}`);
}
add('--verde', '--verde-tinte', 4.5, 'verde sobre su tinte');
add('--amarillo', '--amarillo-tinte', 4.5, 'amarillo sobre su tinte');
add('--rojo', '--rojo-tinte', 4.5, 'rojo sobre su tinte');
// Formas del semáforo (símbolo interior)
add('--blanco', '--verde', 4.5, 'símbolo ✔ blanco dentro del círculo verde');
add('--blanco', '--rojo', 4.5, 'símbolo × blanco dentro del octágono rojo');
add('--tinta', '--amarillo-fondo', 4.5, 'símbolo ! tinta dentro del triángulo amarillo');
// Componentes gráficos (3:1)
for (const bg of ['--papel', '--blanco', ...MODULOS.map((m) => `--${m}-tinte`)]) {
  add('--borde', bg, 3, `borde de 2px sobre ${bg}`);
}
for (const bg of ['--papel', '--blanco', '--limon', '--cobalto-tinte'])
  add('--foco', bg, 3, `anillo de foco sobre ${bg}`);
add('--verde', '--verde-tinte', 3, 'forma verde sobre su tinte');
add('--rojo', '--rojo-tinte', 3, 'forma roja sobre su tinte');
add('--tinta', '--amarillo-fondo', 3, 'contorno tinta del triángulo amarillo');

/* ---------- ejecución ---------- */
let fallos = 0;
let total = 0;
const wantHex = process.argv.includes('--hex');
for (const [modo, vars] of Object.entries(modes)) {
  const filas = [];
  for (const p of pairs) {
    const fg = resolveVar(vars, p.fg);
    const bg = resolveVar(vars, p.bg);
    const r = ratio(fg, bg);
    const ok = r + 1e-9 >= p.min;
    total++;
    if (!ok) fallos++;
    filas.push({ ok, r, min: p.min, fg: p.fg, bg: p.bg, fgHex: fg, bgHex: bg, uso: p.uso });
  }
  const malas = filas.filter((f) => !f.ok);
  const min = Math.min(...filas.map((f) => f.r));
  console.log(
    `\n== Modo: ${modo} — ${filas.length} parejas, mínimo ${min.toFixed(2)}:1, ${malas.length} fallos`,
  );
  for (const f of malas) {
    console.log(
      `  FALLA ${f.r.toFixed(2)}:1 (< ${f.min}) ${f.fg} ${f.fgHex} sobre ${f.bg} ${f.bgHex} — ${f.uso}`,
    );
  }
  if (process.argv.includes('--verbose')) {
    for (const f of filas.filter((x) => x.ok)) {
      console.log(
        `  ok    ${f.r.toFixed(2)}:1 (>= ${f.min}) ${f.fg} ${f.fgHex} / ${f.bg} ${f.bgHex}`,
      );
    }
  }
  if (wantHex) {
    console.log('  Hex finales:');
    for (const [k, v] of Object.entries(vars)) {
      if (!v.startsWith('var(')) console.log(`    ${k.padEnd(20)} ${v.toUpperCase()}`);
    }
  }
}
console.log(`\n${total - fallos}/${total} comprobaciones cumplen.`);
if (fallos > 0) {
  console.error('Contraste insuficiente: corrige los tokens en src/styles/tokens.css.');
  process.exit(1);
}
console.log('Contraste OK en todos los modos.');
