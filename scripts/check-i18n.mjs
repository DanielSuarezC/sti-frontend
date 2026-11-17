#!/usr/bin/env node
/**
 * Verifica que todo id de mensaje usado en src/ exista en src/locales/es-CO.json
 * (y avisa de claves sin usar). Detecta ids literales con forma `area.clave` y expande los dinámicos conocidos.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const messages = JSON.parse(readFileSync(join(root, 'locales/es-CO.json'), 'utf8'));
const defined = new Set(Object.keys(messages));

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) files.push(p);
  }
})(root);

const PREFIXES = [
  'ui',
  'app',
  'autosave',
  'wizard',
  'tabla',
  'firma',
  'grafico',
  'semaforo',
  'likert',
  'modulo',
  'paso',
  'miruta',
  'shell',
  'sensorial',
  'notif',
  'auth',
  'error',
  'publico',
  'login',
  'validacion',
  'clave',
  'activar',
  'restablecer',
  'recuperar',
  'solicitar',
  'f0',
  'nav',
  'rol',
  'inicio',
  'privacidad',
  'admin',
  'coord',
  'comun',
  'enum',
  'aq10',
  'perfil',
  'miplan',
  'seguimiento',
  'familiares',
  'arco',
  'bienestar',
  'docente',
  'familiar',
];
const used = new Set();
const re = /['"`]((?:[a-z0-9]+)(?:\.[A-Za-z0-9_]+)+)['"`]/g;
for (const f of files) {
  const src = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const m of src.matchAll(re)) {
    const id = m[1];
    if (PREFIXES.includes(id.split('.')[0])) used.add(id);
  }
}
// Ids dinámicos conocidos
for (let n = 1; n <= 12; n++) ['nombre', 'desc'].forEach((k) => used.add(`paso.${n}.${k}`));
['VERDE', 'AMARILLO', 'ROJO'].forEach((e) => used.add(`semaforo.${e}`));
['hecho', 'actual', 'pendiente'].forEach((e) => used.add(`miruta.estado.${e}`));
[
  'conocer',
  'contexto',
  'barreras',
  'dua',
  'apoyos',
  'seguimiento',
  'evaluar',
  'trayectoria',
].forEach((m) => used.add(`modulo.${m}`));
['estudiante', 'bienestar', 'coordinador', 'docente', 'familiar', 'admin'].forEach((r) =>
  used.add(`inicio.${r}.descripcion`),
);
for (let n = 1; n <= 8; n++) used.add(`privacidad.s${n}.titulo`);

const faltan = [...used].filter((id) => !defined.has(id) && !/\.(tsx?|json)$/.test(id));
const sinUsar = [...defined].filter(
  (id) => !used.has(id) && !/^privacidad\.s\d\.p\d$/.test(id) && !id.startsWith('likert.') && !id.startsWith('enum.'),
);
if (faltan.length) {
  console.error('Faltan en es-CO.json:\n  ' + faltan.join('\n  '));
  process.exit(1);
}
console.log(`i18n OK: ${used.size} ids usados, todos definidos.`);
if (sinUsar.length) console.log(`(Aviso) Sin usar: ${sinUsar.join(', ')}`);
