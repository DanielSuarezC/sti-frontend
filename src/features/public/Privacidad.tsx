import { useIntl } from 'react-intl';
import { Card, PageHeader } from '@/components/ui';
import { NarrowPage } from './PublicLayout';
import { useDocumentTitle } from './useDocumentTitle';

/** Secciones del aviso y cuántos párrafos tiene cada una (textos en locales/es-CO.json: privacidad.sN.titulo / sN.pM). */
const SECCIONES: { n: number; parrafos: number; lista?: boolean }[] = [
  { n: 1, parrafos: 2 },
  { n: 2, parrafos: 5, lista: true },
  { n: 3, parrafos: 4, lista: true },
  { n: 4, parrafos: 5, lista: true },
  { n: 5, parrafos: 4, lista: true },
  { n: 6, parrafos: 6, lista: true },
  { n: 7, parrafos: 2 },
  { n: 8, parrafos: 2 },
];

/** Aviso de privacidad (Ley 1581 de 2012), en lenguaje claro. */
export default function Privacidad() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  useDocumentTitle(t('privacidad.titulo'));
  return (
    <NarrowPage>
      <PageHeader title={t('privacidad.titulo')} description={t('privacidad.descripcion')} />
      <div className="space-y-6">
        {SECCIONES.map((s) => (
          <Card key={s.n} color="turquesa" aria-labelledby={`priv-${s.n}`}>
            <h2 id={`priv-${s.n}`} className="mb-3">
              {t(`privacidad.s${s.n}.titulo`)}
            </h2>
            {/* El primer párrafo introduce; el resto son viñetas cuando la sección es lista. */}
            <p>{t(`privacidad.s${s.n}.p1`)}</p>
            {s.lista ? (
              <ul className="mt-3 list-disc space-y-2 pl-6">
                {Array.from({ length: s.parrafos - 1 }, (_, i) => (
                  <li key={i}>{t(`privacidad.s${s.n}.p${i + 2}`)}</li>
                ))}
              </ul>
            ) : (
              Array.from({ length: s.parrafos - 1 }, (_, i) => (
                <p key={i} className="mt-3">
                  {t(`privacidad.s${s.n}.p${i + 2}`)}
                </p>
              ))
            )}
          </Card>
        ))}
      </div>
      <p className="mt-8 rounded-control border-2 border-dashed border-borde bg-limon-tinte p-4 text-sm">
        {t('privacidad.nota_revision')}
      </p>
    </NarrowPage>
  );
}
