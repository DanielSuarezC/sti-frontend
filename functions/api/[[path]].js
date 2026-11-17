/**
 * Proxy de Cloudflare Pages: /api/* -> env.BACKEND_URL/api/*
 * Así el navegador solo habla con el mismo origen y las cookies (refresh token HttpOnly)
 * son same-origin. Conserva método, cuerpo, cabeceras y los múltiples Set-Cookie.
 */
const HOP_BY_HOP = [
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
  'proxy-authorization',
  'proxy-authenticate',
];

const json = (status, detail, code) =>
  new Response(JSON.stringify({ detail, code }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function onRequest({ request, env }) {
  if (!env.BACKEND_URL) {
    return json(
      502,
      'El servidor no está configurado (falta BACKEND_URL).',
      'PROXY_NO_CONFIGURADO',
    );
  }

  const url = new URL(request.url);
  const destino = new URL(url.pathname + url.search, env.BACKEND_URL.replace(/\/+$/, ''));

  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);
  headers.delete('host');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;

  let respuesta;
  try {
    respuesta = await fetch(new Request(destino, init));
  } catch {
    return json(
      502,
      'No se pudo conectar con el servidor. Intenta de nuevo en unos minutos.',
      'PROXY_SIN_CONEXION',
    );
  }

  // Reconstruir cabeceras conservando cada Set-Cookie por separado.
  const salida = new Headers();
  for (const [k, v] of respuesta.headers) {
    const nombre = k.toLowerCase();
    if (nombre === 'set-cookie' || HOP_BY_HOP.includes(nombre)) continue;
    salida.append(k, v);
  }
  const cookies =
    typeof respuesta.headers.getSetCookie === 'function' ? respuesta.headers.getSetCookie() : [];
  for (const c of cookies) salida.append('set-cookie', c);
  salida.set('cache-control', 'no-store');

  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: salida,
  });
}
