'use strict';
/* PUBLIK ONE — helper tampilan: format, ikon, toast, modal, grafik, peta SVG */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = n => Number(n || 0).toLocaleString('id-ID');
const dec = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const df = ts => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const dfl = ts => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const dtf = ts => new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pid = id => 'PUB-' + id;
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  if (s < 86400 * 30) return Math.floor(s / 86400) + ' hari lalu';
  return df(ts);
}
const badge = s => `<span class="st st-${SKEY[s]}">${esc(s)}</span>`;
const prio = p => `<span class="urg urg-${String(p).toLowerCase()}">${esc(p)}</span>`;
const catLabel = id => { const c = catById(id); return `${GROUPS[c.g]} · ${c.name}`; };

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5M5 9v12h14V9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  grid: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  folder: '<path d="M3 6h6l2 2h10v12H3z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  pin: '<path d="M12 21s-7-6-7-11.5a7 7 0 0 1 14 0C19 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  copy: '<path d="M8 8h12v12H8zM16 8V4H4v12h4"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z"/>',
  wand: '<path d="m4 20 11-11M14 4v3M18 6l-2 2M20 10h-3M11 3l.5 1.5L13 5l-1.5.5L11 7l-.5-1.5L9 5l1.5-.5z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  zin: '<path d="M12 5v14M5 12h14"/>', zout: '<path d="M5 12h14"/>'
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- toast & modal ---------- */
function toast(msg, kind = '') {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}
function openModal(html, cls = '') {
  $('#modal').innerHTML = `<div class="ov" onmousedown="if(event.target===this)closeModal()"><div class="dlg ${cls}" role="dialog" aria-modal="true">
    <button class="dlg-x" onclick="closeModal()" aria-label="Tutup">${ic('x')}</button>${html}</div></div>`;
  document.body.classList.add('locked');
  const f = $('#modal .dlg input, #modal .dlg select, #modal .dlg textarea');
  if (f) f.focus();
}
function closeModal() { $('#modal').innerHTML = ''; document.body.classList.remove('locked'); }
const modalOpen = () => !!$('#modal .ov');
function confirmBox(title, text, ok, fn) {
  openModal(`<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p>
    <div class="dlg-act"><button class="btn" onclick="closeModal()">Batal</button><button class="btn danger" id="cOk">${esc(ok)}</button></div>`, 'sm');
  $('#cOk').onclick = () => { closeModal(); fn(); };
}
function copyText(t) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
    .then(() => toast('Disalin: ' + t), () => toast('Salin manual: ' + t));
}
function compressImage(file, max = 1000, q = .72) {
  return new Promise((ok, no) => {
    if (!file.type.startsWith('image/')) return no(new Error('bukan gambar'));
    const fr = new FileReader();
    fr.onerror = no;
    fr.onload = () => {
      const img = new Image();
      img.onerror = no;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', q));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ---------- grafik ---------- */
function hbars(rows, opt = {}) {
  const max = Math.max(1, ...rows.map(r => r.v)), tot = rows.reduce((s, r) => s + r.v, 0) || 1;
  return `<div class="hbars">${rows.map(r => `<div class="hb">
    <div class="hb-l"><span>${esc(r.l)}</span><b>${opt.unit ? dec(r.v) + ' ' + opt.unit : nf(r.v)}${opt.pct ? `<small>${Math.round(r.v / tot * 100)}%</small>` : ''}</b></div>
    <div class="hb-t"><i style="width:${(r.v / max * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>`;
}
function statusStrip(a) {
  const n = a.length || 1;
  return `<div class="strip">${STATUS.map(s => `<i class="bg-${SKEY[s]}" style="flex:${cnt(a, s)}" title="${s}: ${cnt(a, s)}"></i>`).join('')}</div>
    <ul class="strip-l">${STATUS.map(s => `<li><i class="bg-${SKEY[s]}"></i>${s}<b>${nf(cnt(a, s))}</b><span>${Math.round(cnt(a, s) / n * 100)}%</span></li>`).join('')}</ul>`;
}
let chartSeq = 0;
function lineChart(series, labels) {
  const W = 640, H = 210, L = 34, Rr = 8, T = 12, B = 26, n = labels.length;
  const max = Math.max(4, ...series.flatMap(s => s.v)), top = Math.ceil(max / 4) * 4;
  const X = i => L + (n < 2 ? 0 : i * (W - L - Rr) / (n - 1)), Y = v => T + (1 - v / top) * (H - T - B);
  const step = Math.max(1, Math.ceil(n / 7));
  const grid = [0, .5, 1].map(f => `<line x1="${L}" x2="${W - Rr}" y1="${Y(top * f)}" y2="${Y(top * f)}"/><text x="${L - 8}" y="${Y(top * f) + 4}" text-anchor="end">${Math.round(top * f)}</text>`).join('');
  const xl = labels.map((l, i) => i % step === 0 ? `<text x="${X(i)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>` : '').join('');
  const id = ++chartSeq;
  const body = series.map((s, si) => {
    const d = s.v.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
    return (si === 0 ? `<path d="${d}L${X(n - 1)} ${Y(0)}L${X(0)} ${Y(0)}Z" class="fill-${s.cls}"/>` : '') +
      `<path d="${d}" class="ln ln-${s.cls}"/>` +
      s.v.map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="9" class="hit"><title>${esc(labels[i])} — ${s.name}: ${v}</title></circle>`).join('');
  }).join('');
  return `<div class="chart"><div class="chart-k">${series.map(s => `<span><i class="ln-${s.cls}"></i>${s.name}</span>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik tren laporan" id="ch${id}"><g class="grid">${grid}</g>${body}<g class="xl">${xl}</g></svg></div>`;
}
function series(a, days) {
  const now = Date.now(), byDay = days <= 31;
  const buckets = byDay ? days : Math.ceil(days / 7), size = byDay ? 1 : 7;
  const labels = [], inn = Array(buckets).fill(0), out = Array(buckets).fill(0);
  const start = endOfDay(now) - buckets * size * DAY;
  for (let b = 0; b < buckets; b++) {
    const d = new Date(start + (b * size + 1) * DAY - 1);
    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
  }
  const idx = t => Math.floor((t - start) / (size * DAY));
  a.forEach(r => {
    const i = idx(r.createdAt); if (i >= 0 && i < buckets) inn[i]++;
    if (r.resolvedAt) { const j = idx(r.resolvedAt); if (j >= 0 && j < buckets) out[j]++; }
  });
  return { labels, inn, out };
}

/* ---------- Peta Medan (SVG, tanpa dependensi luar) ---------- */
const CITY = [[3.800, 98.690], [3.792, 98.716], [3.742, 98.714], [3.700, 98.708], [3.662, 98.724], [3.622, 98.748], [3.580, 98.748], [3.540, 98.738],
  [3.505, 98.724], [3.480, 98.682], [3.478, 98.640], [3.490, 98.604], [3.540, 98.597], [3.580, 98.597], [3.622, 98.610], [3.652, 98.630],
  [3.690, 98.640], [3.742, 98.660], [3.782, 98.668]];
const PROJ = { lat0: 3.81, lng0: 98.59, k: 2000 };
const px = (lat, lng) => [(lng - PROJ.lng0) * PROJ.k, (PROJ.lat0 - lat) * PROJ.k];
const unpx = (x, y) => [PROJ.lat0 - y / PROJ.k, x / PROJ.k + PROJ.lng0];
function clipHalf(poly, a, b) { // simpan titik yang lebih dekat ke a daripada b
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
  const side = p => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], sp = side(p), sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0)) { const t = sp / (sp - sq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
const CELLS = (() => {
  const outline = CITY.map(([la, ln]) => px(la, ln)), sites = KEC.map(k => px(k.lat, k.lng));
  return KEC.map((k, i) => {
    let poly = outline;
    sites.forEach((s, j) => { if (j !== i && poly.length) poly = clipHalf(poly, sites[i], s); });
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    return { name: k.name, d: 'M' + poly.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z', cx, cy };
  });
})();
const nearestKec = (lat, lng) => KEC.reduce((b, k) => ((k.lat - lat) ** 2 + (k.lng - lng) ** 2 < (b.lat - lat) ** 2 + (b.lng - lng) ** 2 ? k : b));
const FULL_VIEW = [0, 0, 310, 680], CENTRAL_VIEW = [30, 250, 280, 330];

/* opt: { el, reports, view, heat:{kec:n}, onPick(id), pickMode, marker:[lat,lng], onPoint(lat,lng) } */
function drawMap(opt) {
  const el = opt.el; if (!el) return;
  let vb = (opt.view || FULL_VIEW).slice();
  const heatMax = opt.heat ? Math.max(1, ...Object.values(opt.heat)) : 1;
  const base = CELLS.map(c => `<path d="${c.d}" class="kec"/>`).join('');
  const heatL = opt.heat ? CELLS.map(c => `<path d="${c.d}" class="kech" opacity="${(Math.sqrt((opt.heat[c.name] || 0) / heatMax) * .72).toFixed(3)}"/>`).join('') : '';
  const cells = base + heatL + CELLS.map(c => `<path d="${c.d}" class="keco"><title>${c.name}${opt.heat ? ': ' + (opt.heat[c.name] || 0) + ' laporan aktif' : ''}</title></path>`).join('');
  const labels = CELLS.map(c => `<text x="${c.cx.toFixed(1)}" y="${c.cy.toFixed(1)}" class="kec-l">${c.name.replace('Medan ', '')}</text>`).join('');
  const river = 'M' + [[3.79, 98.688], [3.72, 98.688], [3.67, 98.683], [3.62, 98.680], [3.59, 98.682], [3.56, 98.676], [3.52, 98.668], [3.48, 98.664]].map(p => px(...p).join(' ')).join('L');
  /* Garis koordinat dan label wilayah sekitar, supaya ruang di luar batas kota
     terbaca sebagai konteks peta, bukan area kosong. */
  let gr = '';
  for (let la = 3.35; la <= 3.95; la += .05) { const [x1, y1] = px(la, 98.38), [x2, y2] = px(la, 99.0); gr += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }
  for (let ln = 98.40; ln <= 99.0; ln += .05) { const [x1, y1] = px(3.35, ln), [x2, y2] = px(3.95, ln); gr += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }
  const ctx = [[3.86, 98.74, 'Selat Malaka'], [3.52, 98.56, 'Kab. Deli Serdang'], [3.70, 98.60, 'Kab. Deli Serdang']]
    .map(([la, ln, t]) => { const [x, y] = px(la, ln); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="ctx-l">${t}</text>`; }).join('');
  const pins = (opt.reports || []).map(r => { const [x, y] = px(r.lat, r.lng); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" class="pin p-${SKEY[r.status]}" data-id="${r.id}"><title>${pid(r.id)} · ${esc(catById(r.cat).name)} · ${r.status}</title></circle>`; }).join('');
  el.innerHTML = `<svg class="mapsvg ${opt.pickMode ? 'picking' : ''}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">
    <rect x="-500" y="-500" width="1500" height="1800" class="sea"/><g class="grat">${gr}</g>${ctx}${cells}<path d="${river}" class="river"/>${labels}<g class="pins">${pins}</g><g class="mk"></g></svg>
    <div class="map-z"><button type="button" aria-label="Perbesar" data-z="in">${ic('zin')}</button><button type="button" aria-label="Perkecil" data-z="out">${ic('zout')}</button></div>`;
  const svg = el.querySelector('svg');
  /* 1 satuan viewBox = berapa piksel layar. Dipakai agar ukuran pin dan label
     tetap sama di layar meski peta di-zoom. */
  const ppu = () => {
    const b = svg.getBoundingClientRect();
    if (!b.width || !b.height) return 1;
    return Math.max(.05, Math.min(b.width / vb[2], b.height / vb[3]));
  };
  const scale = () => 1 / ppu();
  const setVB = () => {
    svg.setAttribute('viewBox', vb.join(' '));
    const s = scale();
    svg.querySelectorAll('.pin').forEach(p => p.setAttribute('r', (4.6 * s).toFixed(2)));
    svg.querySelectorAll('.kec-l').forEach(t => t.setAttribute('font-size', (8.6 * s).toFixed(2)));
    svg.querySelectorAll('.ctx-l').forEach(t => t.setAttribute('font-size', (8.2 * s).toFixed(2)));
    svg.querySelector('.grat').setAttribute('stroke-width', (.7 * s).toFixed(2));
    const r = svg.querySelector('.mk-r'), d = svg.querySelector('.mk-d');
    if (r) r.setAttribute('r', (11 * s).toFixed(2));
    if (d) d.setAttribute('r', (4.4 * s).toFixed(2));
  };
  const zoom = (f, cx, cy) => {
    const nw = Math.min(700, Math.max(40, vb[2] * f)), nh = vb[3] * nw / vb[2];
    cx = cx ?? vb[0] + vb[2] / 2; cy = cy ?? vb[1] + vb[3] / 2;
    vb = [cx - (cx - vb[0]) * nw / vb[2], cy - (cy - vb[1]) * nh / vb[3], nw, nh]; setVB();
  };
  setVB();
  el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => zoom(b.dataset.z === 'in' ? .7 : 1.4));
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let drag = null, moved = false;
  svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vb: vb.slice() }; moved = false; });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    if (!moved) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { } }
    const sc = vb[2] / svg.getBoundingClientRect().width;
    vb[0] = drag.vb[0] - dx * sc; vb[1] = drag.vb[1] - dy * sc; setVB();
  });
  const end = e => {
    if (drag && !moved) {
      const t = e.target;
      if (t.classList && t.classList.contains('pin') && opt.onPick) opt.onPick(+t.dataset.id);
      else if (opt.onPoint) { const p = toSvg(e); const [la, ln] = unpx(p.x, p.y); opt.onPoint(+la.toFixed(5), +ln.toFixed(5)); }
    }
    drag = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', () => drag = null);
  const api = {
    marker(lat, lng) { const [x, y] = px(lat, lng), s = scale(); svg.querySelector('.mk').innerHTML = `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="${(8 * s).toFixed(2)}" class="mk-r"/><circle r="${(3.4 * s).toFixed(2)}" class="mk-d"/></g>`; },
    focus(lat, lng, w = 110) { const [x, y] = px(lat, lng), h = w * vb[3] / vb[2]; vb = [x - w / 2, y - h / 2, w, h]; setVB(); },
    select(id) { svg.querySelectorAll('.pin.sel').forEach(p => p.classList.remove('sel')); const p = svg.querySelector(`.pin[data-id="${id}"]`); if (p) { p.classList.add('sel'); p.parentNode.appendChild(p); } }
  };
  if (opt.marker) api.marker(...opt.marker);
  return api;
}
