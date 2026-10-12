export class ApiError extends Error {
  constructor(status, code, traceId) { super(code); this.status = status; this.traceId = traceId; }
}
export function createClient(origin, { fetcher = fetch, now = Date.now, changed = () => {} } = {}) {
  const base = new URL(origin);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw Error('Invalid gateway origin');
  let session = null, generation = 0;
  const logout = () => { generation++; session = null; changed(null); };
  const current = () => {
    if (session && now() >= session.expiresAt) logout();
    return session?.user ?? null;
  };
  async function send(path, options = {}, token) {
    if (!/^\/api\/v1\/[a-zA-Z0-9/?=&._%-]+$/.test(path)) throw Error('Invalid API path');
    const url = new URL(path, base);
    if (!url.pathname.startsWith('/api/v1/')) throw Error('Invalid API path');
    const headers = new Headers(options.headers);
    headers.set('X-Correlation-Id', crypto.randomUUID());
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetcher(url, { ...options, headers, credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, data?.error || 'INVALID_RESPONSE', response.headers.get('X-Correlation-Id'));
    if (!data) throw new ApiError(502, 'INVALID_RESPONSE');
    return data;
  }
  async function request(path, options) {
    if (!current()) throw new ApiError(401, 'UNAUTHORIZED');
    const token = session.token, version = generation;
    try {
      const data = await send(path, options, token);
      if (version !== generation || !current()) throw new ApiError(401, 'UNAUTHORIZED');
      return data;
    } catch (error) { if (error.status === 401 && version === generation) logout(); throw error; }
  }
  async function login(username, password) {
    logout();
    const version = generation, started = now();
    const result = await send('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (result.tokenType !== 'Bearer' || typeof result.accessToken !== 'string' || !result.accessToken || !Number.isInteger(result.expiresIn) || result.expiresIn < 1 || result.expiresIn > 3600) throw new ApiError(502, 'INVALID_RESPONSE');
    const user = await send('/api/v1/auth/me', {}, result.accessToken);
    if (typeof user.id !== 'string' || typeof user.username !== 'string' || typeof user.displayName !== 'string' || !Array.isArray(user.roles) || user.roles.some(role => typeof role !== 'string')) throw new ApiError(502, 'INVALID_RESPONSE');
    if (version !== generation || now() >= started + result.expiresIn * 1000) throw new ApiError(401, 'UNAUTHORIZED');
    session = { token: result.accessToken, expiresAt: started + result.expiresIn * 1000, user: Object.freeze({ ...user, roles: Object.freeze([...user.roles]) }) };
    changed(user);
    return user;
  }
  return Object.freeze({ login, logout, current, request });
}
