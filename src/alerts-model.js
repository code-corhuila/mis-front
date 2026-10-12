const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const day = value => typeof value === 'string' && /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && day(value.slice(0,10)) && Number.isFinite(Date.parse(value));
function validRow(row) {
  return row && ['id','lotId','evaluatedBy'].every(key => typeof row[key] === 'string' && uuid.test(row[key])) &&
    ['OPEN','RESOLVED'].includes(row.state) && ['EXPIRING','EXPIRED'].includes(row.severity) && day(row.expiresOn) && day(row.evaluatedOn) &&
    Number.isSafeInteger(row.onHandQuantity) && row.onHandQuantity >= 0 && row.onHandQuantity <= 2147483647 &&
    Number.isInteger(row.windowDays) && row.windowDays >= 1 && row.windowDays <= 365 &&
    instant(row.firstDetectedAt) && instant(row.lastEvaluatedAt) && Date.parse(row.lastEvaluatedAt) >= Date.parse(row.firstDetectedAt) &&
    (row.state === 'OPEN' ? row.resolvedAt === null : instant(row.resolvedAt) && Date.parse(row.resolvedAt) >= Date.parse(row.firstDetectedAt) && Date.parse(row.resolvedAt) <= Date.parse(row.lastEvaluatedAt));
}
export function alertsQuery(page, filters) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !['','OPEN','RESOLVED'].includes(filters.state) || !['','EXPIRING','EXPIRED'].includes(filters.severity) || typeof filters.lotId !== 'string' || (filters.lotId && !uuid.test(filters.lotId))) throw Error('Invalid alert filters');
  const query = new URLSearchParams({ page: String(page), limit: '20' });
  for (const key of ['state','severity','lotId']) if (filters[key]) query.set(key,filters[key]);
  return `/api/v1/alerts/expiry?${query}`;
}
export function alertsModel(request, changed = () => {}) {
  let disposed = false, generation = 0;
  let state = { page: 1, total: null, data: [], loading: false, error: '', filters: { state: 'OPEN', severity: '', lotId: '' } };
  const publish = patch => { if (!disposed) { state = { ...state, ...patch }; changed(state); } };
  async function load(page = 1, filters = state.filters) {
    if (disposed) return;
    const version = ++generation; let path;
    publish({ page, filters: { ...filters }, data: [], total: null, loading: true, error: '' });
    try { path = alertsQuery(page,filters); }
    catch { publish({ loading: false, error: 'Revisa el identificador del lote y los filtros.' }); return; }
    try {
      const result = await request(path);
      if (!Array.isArray(result?.data) || result.data.length > 20 || result.meta?.page !== page || result.meta.limit !== 20 || !Number.isSafeInteger(result.meta.total) || result.meta.total < 0 || result.data.length !== Math.min(20,Math.max(0,result.meta.total-(page-1)*20)) || new Set(result.data.map(row => row?.lotId)).size !== result.data.length || result.data.some(row => !validRow(row) || (filters.state && row.state !== filters.state) || (filters.severity && row.severity !== filters.severity) || (filters.lotId && row.lotId !== filters.lotId))) throw Error('Invalid alert response');
      if (!disposed && generation === version) publish({ total: result.meta.total, data: result.data, loading: false });
    } catch (error) {
      if (!disposed && generation === version) publish({ loading: false, error: error.status === 403 ? 'No tienes permiso para consultar alertas.' : error.status === 401 ? 'La sesi\u00f3n ha vencido.' : 'No fue posible consultar las alertas. Vuelve a intentar.' });
    }
  }
  return { load, snapshot: () => state, dispose() { disposed = true; generation++; state = { ...state, data: [], total: null }; } };
}
