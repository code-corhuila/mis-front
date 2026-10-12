import { alertsModel } from './alerts-model.js';
const css = `:host{display:block;color:#172a3b;font:14px Arial,sans-serif;letter-spacing:0}*{box-sizing:border-box}[hidden]{display:none!important}h1{font-size:24px;margin:0}header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}button,input,select{font:inherit;color:inherit}button{min-height:42px;border:1px solid #c5d1de;border-radius:6px;background:white;cursor:pointer;padding:8px 14px}button:hover:not(:disabled){background:#edf3fa}button:disabled{opacity:.5;cursor:default}.icon{width:42px;height:42px;padding:10px;display:inline-grid;place-items:center}.icon img{width:20px;height:20px}:focus-visible{outline:3px solid #187dca;outline-offset:2px}form{display:grid;grid-template-columns:160px 200px minmax(180px,1fr) auto auto;gap:14px;align-items:end;border-top:1px solid #dbe3ee;border-bottom:1px solid #dbe3ee;padding:20px 0}label{display:block;font-size:12px;font-weight:600;margin-bottom:8px}select,input{width:100%;min-width:0;height:42px;padding:0 10px;border:1px solid #a7b9ca;border-radius:6px;background:white}.primary{background:#2563eb;border-color:#2563eb;color:white}.primary:hover:not(:disabled){background:#1d4ed8}.status{min-height:20px;margin:20px 0;color:#637486}[role=alert]{color:#b42335}.table-scroll{overflow:auto;border:1px solid #dbe3ee;border-radius:6px;background:white}table{width:100%;min-width:980px;border-collapse:collapse;table-layout:fixed;text-align:left;font-size:13px}caption{text-align:left;padding:16px;font-weight:600}th,td{padding:14px 12px;border-bottom:1px solid #e2e8f0;overflow-wrap:anywhere;vertical-align:top}th{background:#edf2f8;color:#3d4e68}th:first-child{width:210px}th:nth-child(2){width:145px}th:nth-child(3){width:105px}th:nth-child(6){width:180px}tbody tr:last-child td{border:0}.tag{display:inline-block;border-radius:4px;padding:5px 7px;font-size:12px}.expired{color:#b42335;background:#fee2e2}.expiring{color:#8d540a;background:#fef3c7}.open{color:#b42335;background:#fce7eb}.resolved{color:#15803d;background:#dcfce7}small{display:block;color:#637486;font-size:11px;margin-top:7px}nav{display:flex;justify-content:flex-end;align-items:center;gap:14px;margin-top:20px;flex-wrap:wrap}.empty{padding:30px 0;color:#637486;border-bottom:1px solid #dbe3ee}@media(max-width:1100px){form{grid-template-columns:repeat(2,minmax(0,1fr))}.lot-filter{grid-column:1/-1}}@media(max-width:480px){form{grid-template-columns:minmax(0,1fr)}.lot-filter{grid-column:auto}nav{justify-content:space-between;gap:8px;font-size:12px}}`;
function el(tag, text, className) { const value = document.createElement(tag); if (text !== undefined) value.textContent = text; if (className) value.className = className; return value; }
function icon(name, label) { const button = el('button',undefined,'icon'), img = el('img'); button.type = 'button'; button.title = label; button.setAttribute('aria-label',label); img.src = `/assets/${name}.svg`; img.alt = ''; button.append(img); return button; }
export async function mount(host, context) {
  if (!(host instanceof HTMLElement) || context?.canAlerts !== true || typeof context.request !== 'function') throw Error('Invalid alerts context');
  const shadow = host.attachShadow({mode:'open'}), section = el('section'), style = el('style',css);
  section.setAttribute('aria-labelledby','alerts-title'); shadow.append(style,section);
  const title = el('h1','Alertas de vencimiento'); title.id = 'alerts-title'; title.tabIndex = -1;
  const heading = el('header'), refresh = icon('refresh-cw','Actualizar alertas'); heading.append(title,refresh);
  const form = el('form'), controls = {};
  for (const [key,label,values] of [['state','Estado',[['OPEN','Abiertas'],['RESOLVED','Resueltas'],['','Todos']]],['severity','Severidad',[['','Todas'],['EXPIRING','Pr\u00f3ximo a vencer'],['EXPIRED','Vencido']]]]) {
    const field = el('div'), caption = el('label',label), select = el('select'); select.id = `alert-${key}`; caption.htmlFor = select.id;
    for (const [value,text] of values) { const option = el('option',text); option.value = value; select.append(option); } field.append(caption,select); form.append(field); controls[key] = select;
  }
  const lotField = el('div',undefined,'lot-filter'), label = el('label','Identificador del lote'), lot = el('input'); lot.id = 'alert-lot'; lot.maxLength = 36; lot.placeholder = 'UUID del lote'; label.htmlFor = lot.id; lotField.append(label,lot); controls.lotId = lot;
  const apply = el('button','Filtrar','primary'), clear = el('button','Limpiar'); apply.type = 'submit'; clear.type = 'button'; form.append(lotField,apply,clear);
  const status = el('p',undefined,'status'); status.setAttribute('aria-live','polite');
  const tableWrap = el('div',undefined,'table-scroll'); tableWrap.tabIndex = 0; tableWrap.setAttribute('aria-label','Evaluaciones guardadas por lote');
  const table = el('table'), head = el('thead'), header = el('tr'), rows = el('tbody'); table.append(el('caption','Evaluaciones guardadas'),head,rows);
  for (const text of ['Lote','Severidad','Estado','Vencimiento','Unidades evaluadas','\u00daltima evaluaci\u00f3n','Resoluci\u00f3n']) { const th = el('th',text); th.scope = 'col'; header.append(th); } head.append(header); tableWrap.append(table);
  const empty = el('p',undefined,'empty'), pager = el('nav'), previous = icon('chevron-left','Pagina anterior'), next = icon('chevron-right','Pagina siguiente'), pageText = el('span'); pager.setAttribute('aria-label','Paginacion de alertas'); pager.append(previous,pageText,next);
  section.append(heading,form,status,tableWrap,empty,pager);
  const dateTime = value => new Intl.DateTimeFormat('es-CO',{dateStyle:'short',timeStyle:'short',timeZone:'America/Bogota'}).format(new Date(value));
  const model = alertsModel(context.request,state => {
    section.setAttribute('aria-busy',String(state.loading)); refresh.disabled = apply.disabled = clear.disabled = state.loading;
    for (const control of Object.values(controls)) control.disabled = state.loading;
    status.textContent = state.loading ? 'Consultando alertas...' : state.error || `${new Intl.NumberFormat('es-CO').format(state.total)} registros`; status.setAttribute('role',state.error ? 'alert' : 'status');
    rows.replaceChildren(); tableWrap.hidden = !state.data.length; empty.hidden = state.loading || !!state.error || !!state.data.length; empty.textContent = 'No hay evaluaciones guardadas para estos filtros.';
    for (const alert of state.data) {
      const tr = el('tr'), severity = el('td'), statusCell = el('td'), evaluated = el('td',dateTime(alert.lastEvaluatedAt));
      severity.append(el('span',alert.severity === 'EXPIRED' ? 'Vencido' : 'Pr\u00f3ximo a vencer',`tag ${alert.severity.toLowerCase()}`));
      statusCell.append(el('span',alert.state === 'OPEN' ? 'Abierta' : 'Resuelta',`tag ${alert.state.toLowerCase()}`));
      evaluated.append(el('small',`Ventana: ${alert.windowDays} d\u00edas`));
      tr.append(el('td',alert.lotId),severity,statusCell,el('td',alert.expiresOn),el('td',new Intl.NumberFormat('es-CO').format(alert.onHandQuantity)),evaluated,el('td',alert.resolvedAt ? dateTime(alert.resolvedAt) : '-')); rows.append(tr);
    }
    const pages = state.total == null ? null : Math.max(1,Math.ceil(state.total/20)); pageText.textContent = pages == null || state.page > pages ? `Pagina ${state.page}` : `Pagina ${state.page} de ${pages}`;
    previous.disabled = state.loading || state.page <= 1; next.disabled = state.loading || pages == null || state.page >= pages || state.page >= 1000000;
  });
  const filters = () => ({state:controls.state.value,severity:controls.severity.value,lotId:lot.value.trim()});
  form.addEventListener('submit',event => {event.preventDefault(); model.load(1,filters());});
  clear.addEventListener('click',() => {controls.state.value = 'OPEN'; controls.severity.value = lot.value = ''; model.load(1,filters());});
  refresh.addEventListener('click',() => model.load(model.snapshot().page)); previous.addEventListener('click',() => model.load(model.snapshot().page-1)); next.addEventListener('click',() => model.load(model.snapshot().page+1));
  model.load(); title.focus(); return () => {model.dispose(); shadow.replaceChildren();};
}
