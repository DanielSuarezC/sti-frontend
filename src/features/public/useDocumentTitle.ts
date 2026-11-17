import { useEffect } from 'react';
import { useIntl } from 'react-intl';

/** Título de la pestaña: "<página> · STI". Los PageShell ya lo hacen solos; esto es para páginas sin PageShell. */
export function useDocumentTitle(pagina: string) {
  const intl = useIntl();
  useEffect(() => {
    document.title = intl.formatMessage({ id: 'app.titulo_pagina' }, { pagina });
  }, [pagina, intl]);
}
