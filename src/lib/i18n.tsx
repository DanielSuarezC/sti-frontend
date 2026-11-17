import { IntlProvider } from 'react-intl';
import type { ReactNode } from 'react';
import esCO from '../locales/es-CO.json';

export const LOCALE = 'es-CO';
export const messages = esCO as Record<string, string>;

export function AppIntlProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider
      locale={LOCALE}
      defaultLocale={LOCALE}
      messages={messages}
      onError={(err) => {
        if (import.meta.env.DEV) console.warn(err.message);
      }}
    >
      {children}
    </IntlProvider>
  );
}
