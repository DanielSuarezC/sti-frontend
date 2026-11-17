import {
  ApiError,
  get,
  post,
  setAccessToken,
  getAccessToken,
  setAuthFailureHandler,
  refreshSession,
  getBlob,
} from './api';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const authResp = (token: string) => ({
  access_token: token,
  token_type: 'bearer',
  expires_in: 28800,
  user: { id: 1 },
});

let fetchMock: ReturnType<typeof vi.fn>;
const authHeader = (call: unknown[]) =>
  ((call[1] as RequestInit).headers as Record<string, string>).Authorization;
const urlOf = (call: unknown[]) => String(call[0]);

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setAccessToken(null);
  setAuthFailureHandler(null);
});
afterEach(() => vi.unstubAllGlobals());

describe('cliente API', () => {
  it('adjunta Bearer, credentials:include y usa la base /api/v1', async () => {
    setAccessToken('abc');
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    const r = await get<{ ok: boolean }>('/auth/me');
    expect(r.ok).toBe(true);
    const call = fetchMock.mock.calls[0]!;
    expect(urlOf(call)).toBe('/api/v1/auth/me');
    expect(authHeader(call)).toBe('Bearer abc');
    expect((call[1] as RequestInit).credentials).toBe('include');
  });

  it('serializa query y cuerpo JSON', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await post('/x', { a: 1 }, { query: { page: 2, vacio: undefined, q: 'hola' } });
    const call = fetchMock.mock.calls[0]!;
    expect(urlOf(call)).toBe('/api/v1/x?page=2&q=hola');
    expect((call[1] as RequestInit).body).toBe('{"a":1}');
  });

  it('401 -> refresca con POST /auth/refresh y reintenta con el token nuevo', async () => {
    setAccessToken('viejo');
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: 'Sesión vencida', code: 'TOKEN_EXPIRADO' }))
      .mockResolvedValueOnce(json(200, authResp('nuevo')))
      .mockResolvedValueOnce(json(200, { items: [1] }));

    const r = await get<{ items: number[] }>('/planes');

    expect(r.items).toEqual([1]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(urlOf(fetchMock.mock.calls[1]!)).toBe('/api/v1/auth/refresh');
    expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('POST');
    expect(authHeader(fetchMock.mock.calls[2]!)).toBe('Bearer nuevo');
    expect(getAccessToken()).toBe('nuevo');
  });

  it('varias peticiones con 401 simultáneas comparten UN solo refresh (cola)', async () => {
    setAccessToken('viejo');
    let refreshes = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes++;
        await new Promise((r) => setTimeout(r, 10));
        return json(200, authResp('nuevo'));
      }
      const bearer = (init.headers as Record<string, string>).Authorization;
      return bearer === 'Bearer nuevo' ? json(200, { url }) : json(401, { detail: 'x', code: 'X' });
    });

    const [a, b, c] = await Promise.all([get('/a'), get('/b'), get('/c')]);

    expect(refreshes).toBe(1);
    expect(a).toEqual({ url: '/api/v1/a' });
    expect(b).toEqual({ url: '/api/v1/b' });
    expect(c).toEqual({ url: '/api/v1/c' });
  });

  it('si el refresh falla: limpia el token, avisa a auth y lanza ApiError', async () => {
    setAccessToken('viejo');
    const onFail = vi.fn();
    setAuthFailureHandler(onFail);
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: 'Sesión vencida', code: 'TOKEN_EXPIRADO' }))
      .mockResolvedValueOnce(json(401, { detail: 'Refresh inválido', code: 'REFRESH_INVALIDO' }));

    await expect(get('/planes')).rejects.toMatchObject({ status: 401, code: 'TOKEN_EXPIRADO' });
    expect(getAccessToken()).toBeNull();
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2); // sin bucle infinito
  });

  it('un 401 en /auth/login NO intenta refresh (credenciales incorrectas)', async () => {
    fetchMock.mockResolvedValueOnce(
      json(401, { detail: 'Correo o contraseña incorrectos.', code: 'CREDENCIALES_INVALIDAS' }),
    );
    await expect(
      post('/auth/login', { email: 'a', password: 'b' }, { anonymous: true }),
    ).rejects.toMatchObject({
      detail: 'Correo o contraseña incorrectos.',
      code: 'CREDENCIALES_INVALIDAS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('un reintento tras refresh que vuelve a dar 401 no se repite', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { detail: 'a', code: 'A' }))
      .mockResolvedValueOnce(json(200, authResp('t2')))
      .mockResolvedValueOnce(json(401, { detail: 'sigue', code: 'B' }));
    await expect(get('/x')).rejects.toMatchObject({ code: 'B' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('normaliza errores {detail, code} a ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      json(409, { detail: 'Ya existe un plan activo.', code: 'PLAN_DUPLICADO' }),
    );
    const err = await get('/planes').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 409,
      detail: 'Ya existe un plan activo.',
      code: 'PLAN_DUPLICADO',
    });
  });

  it('convierte el detalle de validación 422 (lista) en texto', async () => {
    fetchMock.mockResolvedValueOnce(
      json(422, { detail: [{ loc: ['body', 'email'], msg: 'Correo inválido', type: 'x' }] }),
    );
    await expect(get('/x')).rejects.toMatchObject({ status: 422, detail: 'Correo inválido' });
  });

  it('error de red -> ApiError con status 0 y código RED_NO_DISPONIBLE', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = (await get('/x').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.isNetwork).toBe(true);
    expect(err.code).toBe('RED_NO_DISPONIBLE');
  });

  it('204 devuelve undefined', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await post('/notificaciones/1/leer')).toBeUndefined();
  });

  it('refreshSession guarda el token y devuelve la respuesta', async () => {
    fetchMock.mockResolvedValueOnce(json(200, authResp('zzz')));
    const r = await refreshSession();
    expect(r.access_token).toBe('zzz');
    expect(getAccessToken()).toBe('zzz');
  });

  it('descarga blobs con autenticación y lee el nombre de archivo', async () => {
    setAccessToken('t');
    fetchMock.mockResolvedValueOnce(
      new Response('pdf', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="plan-ana.pdf"',
        },
      }),
    );
    const f = await getBlob('/planes/1/export');
    expect(f.filename).toBe('plan-ana.pdf');
    expect(f.blob).toBeInstanceOf(Blob);
    expect(authHeader(fetchMock.mock.calls[0]!)).toBe('Bearer t');
  });
});
