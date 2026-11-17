import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/lexend';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import './styles/index.css';
import App from './App';
import { aplicarPreferencias, cargarPreferenciasLocales } from './lib/sensory';

// Aplicar preferencias sensoriales guardadas ANTES del primer render (sin destellos).
aplicarPreferencias(cargarPreferenciasLocales());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
