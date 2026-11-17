import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppIntlProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { SensoryProvider } from '@/lib/sensory';
import { AnnouncerProvider } from '@/lib/announce';
import { ApiError } from '@/lib/api';
import { ToastProvider, TooltipProvider } from '@/components/ui';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // No reintentar errores del cliente (4xx): son definitivos. Red/5xx: hasta 2 reintentos.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
    },
  });
}

/** Orden: i18n > datos > sesión > preferencias sensoriales > anuncios > tooltips > avisos. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <AppIntlProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <SensoryProvider>
            <AnnouncerProvider>
              <TooltipProvider>
                <ToastProvider>{children}</ToastProvider>
              </TooltipProvider>
            </AnnouncerProvider>
          </SensoryProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppIntlProvider>
  );
}
