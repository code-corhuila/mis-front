const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const calendarDate = value => typeof value === 'string' && /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function pageResult(value, page, limit) {
  if (!Array.isArray(value?.data) || value.data.length > limit || value.meta?.page !== page || value.meta.limit !== limit || !Number.isSafeInteger(value.meta.total) || value.meta.total < 0 || value.meta.total < value.data.length) throw Error('Invalid overview page');
  return value;
}
export function overviewModel(request, canMovements, changed = () => {}) {
  let disposed = false, generation = 0, expiryGeneration = 0;
  let state = { loading: false, metrics: {}, expired: { page: 1, total: null, data: [], loading: false, error: '' }, movements: { data: [], total: null, loading: false, error: '' } };
  const update = patch => { if (!disposed) { state = { ...state, ...patch }; changed(state); } };
  async function loadExpired(page = 1) {
    if (disposed || !Number.isSafeInteger(page) || page < 1 || page > 1000000) return;
    const version = ++expiryGeneration; update({ expired: { page, total: null, data: [], loading: true, error: '' } });
    try {
      const result = pageResult(await request(`/api/v1/stock?page=${page}&limit=20&expired=true`), page, 20);
      if (result.data.some(row => !uuid.test(row.lotId) || typeof row.lotNumber !== 'string' || !row.lotNumber || !calendarDate(row.expiresOn) || row.expired !== true || !Number.isSafeInteger(row.onHandQuantity) || row.onHandQuantity < 0)) throw Error('Invalid expired stock');
      if (!disposed && version === expiryGeneration) update({ expired: { page, total: result.meta.total, data: result.data, loading: false, error: '' } });
    } catch { if (!disposed && version === expiryGeneration) update({ expired: { page, total: null, data: [], loading: false, error: 'No fue posible consultar los vencimientos.' } }); }
  }
  async function load() {
    if (disposed) return;
    const version = ++generation; update({ loading: true, metrics: {}, movements: { data: [], total: null, loading: canMovements, error: '' } });
    const sources = { medications: 'medications', suppliers: 'suppliers', lots: 'stock' };
    const jobs = Object.entries(sources).map(async ([key, source]) => {
      let metric;
      try { const result = pageResult(await request(`/api/v1/${source}?page=1&limit=1`), 1, 1); metric = { value: result.meta.total, error: false }; }
      catch { metric = { value: null, error: true }; }
      if (!disposed && version === generation) update({ metrics: { ...state.metrics, [key]: metric } });
    });
    jobs.push(loadExpired());
    if (canMovements) jobs.push((async () => {
      let movements;
      try {
        const result = pageResult(await request('/api/v1/movements?page=1&limit=5'), 1, 5);
        if (result.data.some(row => !uuid.test(row.id) || typeof row.lotNumber !== 'string' || !['ENTRY', 'EXIT'].includes(row.type) || !Number.isSafeInteger(row.quantity) || row.quantity < 1 || typeof row.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(row.createdAt) || !calendarDate(row.createdAt.slice(0, 10)) || !Number.isFinite(Date.parse(row.createdAt)))) throw Error('Invalid movements');
        movements = { data: result.data, total: result.meta.total, loading: false, error: '' };
      } catch { movements = { data: [], total: null, loading: false, error: 'No fue posible consultar los movimientos.' }; }
      if (!disposed && version === generation) update({ movements });
    })());
    await Promise.all(jobs); if (!disposed && version === generation) update({ loading: false });
  }
  return { load, loadExpired, snapshot: () => state, dispose() { disposed = true; generation++; expiryGeneration++; state = { ...state, metrics: {}, expired: { data: [] }, movements: { data: [] } }; } };
}
