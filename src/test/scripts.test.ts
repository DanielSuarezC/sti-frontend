import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const run = (script: string) =>
  spawnSync(process.execPath, [resolve(process.cwd(), 'scripts', script)], { encoding: 'utf8' });

describe('verificaciones de calidad', () => {
  it('el contraste de TODOS los tokens (normal, calma, alto contraste) cumple WCAG AA', () => {
    const r = run('check-contrast.mjs');
    expect(r.stdout + r.stderr).toContain('Contraste OK');
    expect(r.status).toBe(0);
  });

  it('todos los textos usados existen en locales/es-CO.json', () => {
    const r = run('check-i18n.mjs');
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
  });
});
