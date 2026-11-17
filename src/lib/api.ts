/**
 * Cliente API único del STI.
 *
 * - Base: `import.meta.env.VITE_API_URL ?? "/api/v1"`.
 * - Adjunta `Authorization: Bearer <access>` (token SOLO en memoria) y `credentials: 'include'`
 *   (el refresh token viaja en cookie HttpOnly).
 * - Si una petición responde 401, llama UNA vez a `POST /auth/refresh` (una sola petición en vuelo:
 *   las demás 401 esperan en cola) y reintenta; si el refresh falla, limpia la sesión y avisa a `auth.tsx`.
 * - Errores `{detail, code}` -> `ApiError`. Para mostrarlos usa `getErrorMessage(err, intl)`.
 */
import type { IntlShape } from 'react-intl';
import type { AuthResponse } from './types';

export const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;
  constructor(status: number, detail: string, code: string) {
    super(detail || code);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

/** Códigos generados en el cliente (no vienen del backend). */
export const CLIENT_CODES = {
  RED: 'RED_NO_DISPONIBLE',
  RESPUESTA: 'RESPUESTA_INVALIDA',
  DESCONOCIDO: 'ERROR_DESCONOCIDO',
} as const;

/** Mensaje legible para mostrar en pantalla (qué pasó + cómo arreglarlo). */
export function getErrorMessage(err: unknown, intl: IntlShape): string {
  if (err instanceof ApiError) {
    if (err.code === CLIENT_CODES.RED) return intl.formatMessage({ id: 'error.red' });
    if (err.detail) return err.detail;
    if (err.status >= 500) return intl.formatMessage({ id: 'error.servidor' });
  }
  return intl.formatMessage({ id: 'error.desconocido' });
}

/* ---------------- Estado de sesión (solo memoria) ---------------- */

let accessToken: string | null = null;
let authFailureHandler: (() => void) | null = null;

export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;
/** `auth.tsx` registra aquí qué hacer cuando la sesión no se pudo renovar. */
export const setAuthFailureHandler = (fn: (() => void) | null) => {
  authFailureHandler = fn;
};

/* ---------------- Núcleo ---------------- */

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: Query;
  /** Objeto -> JSON; FormData se envía tal cual. */
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** No adjuntar Bearer ni intentar refresh (rutas públicas). */
  anonymous?: boolean;
}

const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/activate',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function buildUrl(path: string, query?: Query): string {
  const base = API_BASE.replace(/\/+$/, '');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

function detailToString(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // 422 de FastAPI: [{loc, msg, type}]
    return detail
      .map((d) =>
        d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : '',
      )
      .filter(Boolean)
      .join('. ');
  }
  return '';
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail = '';
  let code = `HTTP_${res.status}`;
  try {
    const data = (await res.json()) as { detail?: unknown; code?: unknown };
    detail = detailToString(data?.detail);
    if (typeof data?.code === 'string') code = data.code;
  } catch {
    /* cuerpo vacío o no JSON */
  }
  return new ApiError(res.status, detail, code);
}

async function rawFetch(method: string, path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers };
  if (!opts.anonymous && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData || opts.body instanceof Blob) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  try {
    return await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body,
      credentials: 'include',
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, '', CLIENT_CODES.RED);
  }
}

/* ---------------- Refresh con cola ---------------- */

let refreshInFlight: Promise<AuthResponse> | null = null;

/** Renueva el access token con la cookie de refresh. Llamadas simultáneas comparten la misma petición. */
export function refreshSession(): Promise<AuthResponse> {
  refreshInFlight ??= (async () => {
    const res = await rawFetch('POST', '/auth/refresh', { anonymous: true });
    if (!res.ok) throw await toApiError(res);
    const data = (await res.json()) as AuthResponse;
    accessToken = data.access_token;
    return data;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  retried = false,
): Promise<T> {
  const res = await rawFetch(method, path, opts);

  if (
    res.status === 401 &&
    !opts.anonymous &&
    !retried &&
    !NO_REFRESH_PATHS.some((p) => path.startsWith(p))
  ) {
    try {
      await refreshSession();
    } catch {
      accessToken = null;
      authFailureHandler?.();
      throw await toApiError(res);
    }
    return request<T>(method, path, opts, true);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

/* ---------------- Descargas ---------------- */

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
  /** Cabeceras de la respuesta (p. ej. `X-Export-Degradado` cuando el PDF llegó como HTML imprimible). */
  headers?: Headers;
}

/** Descarga un archivo (PDF, Word, Excel...) con autenticación. */
export async function getBlob(
  path: string,
  opts: Omit<RequestOptions, 'body'> = {},
): Promise<DownloadedFile> {
  const run = async () =>
    rawFetch('GET', path, { ...opts, headers: { Accept: '*/*', ...opts.headers } });
  let res = await run();
  if (res.status === 401 && !opts.anonymous) {
    try {
      await refreshSession();
    } catch {
      accessToken = null;
      authFailureHandler?.();
      throw await toApiError(res);
    }
    res = await run();
  }
  if (!res.ok) throw await toApiError(res);
  const disp = res.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disp);
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : null,
    headers: res.headers,
  };
}

/** Guarda un Blob en el equipo del usuario. */
export function saveBlob(file: DownloadedFile, fallbackName = 'descarga') {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Descarga y guarda en un paso. */
export async function downloadFile(
  path: string,
  fallbackName?: string,
  opts: Omit<RequestOptions, 'body'> = {},
) {
  saveBlob(await getBlob(path, opts), fallbackName);
}

/* ---------------- Helpers públicos ---------------- */

type Opts = Omit<RequestOptions, 'body'>;
export const get = <T>(path: string, opts?: Opts) => request<T>('GET', path, opts);
export const post = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>('POST', path, { ...opts, body });
export const patch = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>('PATCH', path, { ...opts, body });
export const put = <T>(path: string, body?: unknown, opts?: Opts) =>
  request<T>('PUT', path, { ...opts, body });
export const del = <T>(path: string, opts?: Opts) => request<T>('DELETE', path, opts);

export const api = { get, post, patch, put, del, getBlob, downloadFile, refreshSession };
