'use strict';
/* PUBLIK ONE — rute, tampilan, dan aksi */

const SESS_KEY = 'publikone_sess';
const NEXT = { 'Menunggu Verifikasi': 'Diverifikasi', 'Diverifikasi': 'Diproses', 'Diproses': 'Selesai' };
let U = null, MAP = null;
const V = {
  q: '', st: '', cat: '', kec: '', from: '', to: '', sort: 'new', page: 1, per: 25,
  sel: new Set(), fOpen: false, mapSt: '', mapCat: '', days: 30,
  pt: null, photos: [], sug: null, cq: '', cst: ''
};

/* ---------- sesi ---------- */
function loadSess() { try { U = userById(localStorage.getItem(SESS_KEY)) || null; } catch (e) { U = null; } }
function setSess(u) { U = u || null; try { u ? localStorage.setItem(SESS_KEY, u.id) : localStorage.removeItem(SESS_KEY); } catch (e) { } }
const isAdmin = () => U && U.role === 'admin';
const myReports = () => U ? DB.d.reports.filter(r => r.citizenId === U.id) : [];
const myNotifs = () => U ? DB.d.notifs.filter(n => n.userId === U.id) : [];
const unread = () => myNotifs().filter(n => !n.read).length;

/* ---------- rute ---------- */
const ROUTES = {
  '': pubHome, 'transparansi': pubTrans, 'peta': pubMap, 'lacak': pubTrack, 'masuk': vLogin, 'daftar': vRegister,
  'warga': cDash, 'warga/baru': cNew, 'warga/laporan': cList, 'warga/notifikasi': cNotif, 'warga/profil': cProfile,
  'admin': aDash, 'admin/laporan': aList, 'admin/peta': aMap, 'admin/statistik': aStats, 'admin/petugas': aOfficers
};
const go = p => { location.hash = '#/' + p; };
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const seg = h.split('/').filter(Boolean);
  if (seg[0] === 'lacak') return { key: 'lacak', arg: seg[1] || '' };
  const k2 = seg.slice(0, 2).join('/');
  if (ROUTES[k2]) return { key: k2, arg: seg[2] || '' };
  if (ROUTES[seg[0] || '']) return { key: seg[0] || '', arg: seg[1] || '' };
  return { key: '', arg: '' };
}

function render() {
  const { key, arg } = parseHash();
  MAP = null;
  if (key.startsWith('warga') && !U) return go('masuk');
  if (key.startsWith('admin') && !isAdmin()) return go('masuk');
  if (key.startsWith('warga') && isAdmin()) return go('admin');
  const fn = ROUTES[key] || pubHome;
  const pub = !key.startsWith('warga') && !key.startsWith('admin');
  document.title = 'PUBLIK ONE — Pengaduan Layanan Publik Kota Medan';
  $('#root').innerHTML = pub ? shellPublic(key, fn(arg)) : shellApp(key, fn(arg));
  $$('[data-after]').forEach(el => (AFTER[el.dataset.after] || (() => { }))(el));
  window.scrollTo(0, 0);
}

/* ---------- kerangka halaman ---------- */
function brand(sub) {
  return `<a class="brand" href="#/"><i>P1</i><span><b>PUBLIK ONE</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></a>`;
}
const PUBNAV = [['', 'Beranda'], ['transparansi', 'Transparansi'], ['peta', 'Peta pengaduan'], ['lacak', 'Lacak laporan']];
function shellPublic(key, main) {
  const nav = PUBNAV.map(([k, l]) => `<a href="#/${k}"${k === key ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<header class="top"><div class="wrap top-in">${brand('Kota Medan')}
    <nav class="nav desk" aria-label="Navigasi utama">${nav}</nav>
    <div class="top-act">${themeBtn()}${U ? `<a class="btn sm" href="#/${isAdmin() ? 'admin' : 'warga'}">Buka dasbor</a>` : `<a class="btn sm" href="#/masuk">Masuk</a>`}</div>
  </div><nav class="nav mob" aria-label="Navigasi utama">${nav}</nav></header>
  <main id="main">${main}</main>
  <footer class="foot"><div class="wrap foot-in">
    <div><div class="foot-b">PUBLIK ONE</div><p class="muted sm">Kanal pengaduan layanan publik Kota Medan. Setiap laporan tercatat dengan nomor dan dapat dipantau publik.</p></div>
    <div><h4>Kanal</h4><a href="#/lacak">Lacak laporan</a><a href="#/transparansi">Transparansi</a><a href="#/peta">Peta pengaduan</a></div>
    <div><h4>Akun</h4><a href="#/masuk">Masuk warga</a><a href="#/daftar">Daftar akun</a><a href="#/masuk">Login admin</a></div>
    <div><h4>Kontak</h4><p class="sm">Call center 112</p><p class="sm">Balai Kota, Jl. Kapten Maulana Lubis No. 2</p></div>
  </div><div class="wrap foot-end sm">Prototipe untuk keperluan demo — data bersifat contoh dan tersimpan di peramban Anda.</div></footer>`;
}
const CNAV = [['warga', 'Dasbor', 'home'], ['warga/baru', 'Buat pengaduan', 'plus'], ['warga/laporan', 'Pengaduan saya', 'list'], ['warga/notifikasi', 'Notifikasi', 'bell'], ['warga/profil', 'Profil', 'user']];
const ANAV = [['admin', 'Ringkasan', 'grid'], ['admin/laporan', 'Kelola pengaduan', 'folder'], ['admin/peta', 'Peta sebaran', 'map'], ['admin/statistik', 'Statistik', 'chart'], ['admin/petugas', 'Petugas', 'users']];
function shellApp(key, main) {
  const adm = isAdmin(), nav = adm ? ANAV : CNAV;
  const item = ([k, l, i]) => `<a href="#/${k}"${k === key ? ' aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${k === 'warga/notifikasi' && unread() ? `<em class="dot">${unread()}</em>` : ''}</a>`;
  return `<div class="app ${adm ? 'adm' : ''}">
    <header class="top"><div class="wrap top-in">${brand(adm ? 'Panel Admin' : 'Akun Warga')}
      <nav class="nav desk ${adm ? 'hide-lg' : ''}" aria-label="Navigasi">${nav.map(item).join('')}</nav>
      <div class="top-act">${themeBtn()}
        <div class="who"><span class="av">${initials(U.name)}</span><span class="who-t"><b>${esc(U.name)}</b><small>${adm ? 'Administrator' : 'Warga'}</small></span></div>
        <button class="btn sm" data-act="logout">${ic('out')}<span class="lbl">Keluar</span></button></div>
    </div></header>
    ${adm ? `<aside class="side"><nav aria-label="Navigasi admin">${nav.map(item).join('')}</nav>
      <div class="side-f"><a href="#/" class="sm">${ic('back')} Lihat situs publik</a></div></aside>` : ''}
    <main id="main" class="appmain">${main}</main>
    <nav class="tabbar" aria-label="Navigasi">${nav.map(([k, l, i]) => `<a href="#/${k}"${k === key ? ' aria-current="page"' : ''}>${ic(i)}<span>${l.split(' ')[0]}</span>${k === 'warga/notifikasi' && unread() ? '<em class="dot"></em>' : ''}</a>`).join('')}</nav>
  </div>`;
}
const themeBtn = () => `<button class="btn ico" data-act="theme" aria-label="Ganti tema terang/gelap" title="Tema terang/gelap">${ic('moon')}</button>`;
const page = (title, lead, body, act) => `<div class="wrap pg"><div class="pg-h"><div><h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</div>${act || ''}</div>${body}</div>`;
const sec = (label, body, act) => `<section class="blk"><div class="blk-h"><h2 class="eyebrow">${esc(label)}</h2>${act || ''}</div>${body}</section>`;
const card = (title, body, act) => `<div class="card"><div class="card-h"><h3>${esc(title)}</h3>${act || ''}</div><div class="card-b">${body}</div></div>`;
const figs = rows => `<div class="figs">${rows.map(r => `<div class="fig"><b>${r.v}</b><span>${esc(r.l)}</span>${r.s ? `<small class="${r.c || ''}">${esc(r.s)}</small>` : ''}</div>`).join('')}</div>`;
const empty = (t, s, a) => `<div class="empty">${ic('folder')}<b>${esc(t)}</b>${s ? `<p class="muted sm">${esc(s)}</p>` : ''}${a || ''}</div>`;

/* ---------- komponen laporan ---------- */
function stepper(r) {
  const i = STATUS.indexOf(r.status);
  return `<ol class="step">${STATUS.map((s, k) => `<li class="${k < i ? 'ok' : k === i ? 'now' : ''}"><i>${k < i || i === 3 ? '✓' : k + 1}</i><span>${k === 0 ? 'Diterima' : s}</span></li>`).join('')}</ol>`;
}
function history(r) {
  return `<ol class="log">${r.history.slice().reverse().map(ev => {
    const t = ev.assign ? `Petugas ditugaskan: <b>${esc(officerById(ev.assign).name)}</b> — ${esc(UNITS[officerById(ev.assign).unit])}${ev.deadline ? `, target ${dfl(ev.deadline)}` : ''}`
      : ev.edit ? 'Data laporan diperbarui' : `Status menjadi <b>${esc(ev.s)}</b>`;
    return `<li class="${ev.s ? 's-' + SKEY[ev.s] : ''}"><div class="log-t">${t}</div><div class="log-m sm muted">${dtf(ev.at)} · ${esc(ev.by)}</div>${ev.note ? `<p class="sm muted">${esc(ev.note)}</p>` : ''}</li>`;
  }).join('')}</ol>`;
}
function repMeta(r) {
  const o = r.officerId ? officerById(r.officerId) : null;
  const rows = [['Kategori', catLabel(r.cat)], ['Lokasi', r.address], ['Kecamatan', r.kec], ['Pelapor', r.reporter || '—'],
  ['Tanggal lapor', dfl(r.createdAt)], ['Instansi', UNITS[r.unit]], ['Petugas', o ? `${o.name}` : 'Belum ditugaskan'],
  ['Target selesai', r.deadline ? dfl(r.deadline) + (isOverdue(r) ? ' (terlewat)' : '') : '—'],
  ['Waktu penyelesaian', r.resolvedAt ? dec(resDays(r)) + ' hari' : '—'], ['Koordinat', `${r.lat}, ${r.lng}`]];
  return `<dl class="meta">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}
function openReport(id) {
  const r = rep(id); if (!r) return toast('Laporan tidak ditemukan.');
  const adm = isAdmin(), mine = U && r.citizenId === U.id;
  const acts = [];
  if (adm) {
    if (NEXT[r.status]) acts.push(`<button class="btn pri" data-act="next" data-id="${r.id}">Ubah ke ${NEXT[r.status]}</button>`);
    acts.push(`<button class="btn" data-act="assign" data-id="${r.id}">${ic('users')} Penugasan</button>`);
    acts.push(`<button class="btn" data-act="edit" data-id="${r.id}">${ic('edit')} Ubah data</button>`);
    acts.push(`<button class="btn danger" data-act="del" data-id="${r.id}">${ic('trash')} Hapus</button>`);
  } else if (mine && r.status === 'Menunggu Verifikasi') {
    acts.push(`<button class="btn danger" data-act="withdraw" data-id="${r.id}">Tarik laporan</button>`);
  }
  openModal(`<div class="dlg-h"><div><span class="eyebrow">Rincian pengaduan</span><h2 class="mono">${pid(r.id)}</h2></div>
    <div class="chips">${badge(r.status)}${prio(r.priority)}${isOverdue(r) ? '<span class="st st-late">Melewati target</span>' : ''}</div></div>
    ${stepper(r)}
    <p class="desc">${esc(r.desc)}</p>
    ${r.photos && r.photos.length ? `<div class="shots">${r.photos.map((p, i) => `<img src="${p}" alt="Bukti foto ${i + 1} laporan ${pid(r.id)}" loading="lazy">`).join('')}</div>` : ''}
    ${repMeta(r)}
    <h3 class="eyebrow mt">Riwayat penanganan</h3>${history(r)}
    ${acts.length ? `<div class="dlg-act">${acts.join('')}</div>` : ''}`, 'lg');
}

function repTable(list, mode) {
  const adm = mode === 'admin';
  if (!list.length) return empty('Tidak ada laporan yang cocok', 'Ubah kata kunci atau filter yang dipakai.');
  const head = adm
    ? `<th class="cb"><input type="checkbox" data-act="selall" aria-label="Pilih semua"></th><th>Nomor</th><th>Kategori</th><th>Lokasi</th><th>Pelapor</th><th>Tanggal</th><th>Status</th><th>Petugas</th><th></th>`
    : `<th>Nomor</th><th>Kategori</th><th>Lokasi</th><th>Tanggal</th><th>Status</th><th></th>`;
  const row = r => {
    const o = r.officerId ? officerById(r.officerId) : null;
    const open = `<button class="btn sm" data-act="open" data-id="${r.id}">Rincian</button>`;
    return `<tr${isOverdue(r) ? ' class="late"' : ''}>
      ${adm ? `<td class="cb" data-l=""><input type="checkbox" data-act="sel" data-id="${r.id}"${V.sel.has(r.id) ? ' checked' : ''} aria-label="Pilih ${pid(r.id)}"></td>` : ''}
      <td data-l="Nomor"><b class="mono">${pid(r.id)}</b></td>
      <td data-l="Kategori"><span class="ct">${esc(catById(r.cat).name)}</span><small class="muted">${esc(GROUPS[catById(r.cat).g])}</small></td>
      <td data-l="Lokasi" class="wr">${esc(r.address)}<small class="muted">${esc(r.kec)}</small></td>
      ${adm ? `<td data-l="Pelapor">${esc(r.reporter || '—')}</td>` : ''}
      <td data-l="Tanggal"><span title="${dtf(r.createdAt)}">${df(r.createdAt)}</span></td>
      <td data-l="Status">${badge(r.status)}${isOverdue(r) ? '<small class="late-t">target terlewat</small>' : ''}</td>
      ${adm ? `<td data-l="Petugas">${o ? esc(o.name) : '<span class="muted">—</span>'}</td>` : ''}
      <td data-l="" class="act">${open}${adm ? `<button class="btn sm ico" data-act="edit" data-id="${r.id}" aria-label="Ubah ${pid(r.id)}" title="Ubah">${ic('edit')}</button><button class="btn sm ico danger" data-act="del" data-id="${r.id}" aria-label="Hapus ${pid(r.id)}" title="Hapus">${ic('trash')}</button>` : ''}</td></tr>`;
  };
  return `<div class="tw"><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`;
}
function pager(total, pageNo, per) {
  const last = Math.max(1, Math.ceil(total / per));
  if (last === 1) return `<div class="pager"><span class="sm muted">${nf(total)} laporan</span></div>`;
  const a = Math.max(1, pageNo - 1), b = Math.min(last, pageNo + 1), nums = [];
  for (let i = a; i <= b; i++) nums.push(`<button class="btn sm${i === pageNo ? ' on' : ''}" data-act="page" data-p="${i}">${i}</button>`);
  return `<div class="pager"><span class="sm muted">${nf(total)} laporan · halaman ${pageNo} dari ${last}</span><div class="pg-b">
    <button class="btn sm" data-act="page" data-p="${pageNo - 1}"${pageNo === 1 ? ' disabled' : ''}>Sebelumnya</button>
    ${pageNo > 2 ? `<button class="btn sm" data-act="page" data-p="1">1</button><span class="sm muted">…</span>` : ''}
    ${nums.join('')}
    ${b < last ? `<span class="sm muted">…</span><button class="btn sm" data-act="page" data-p="${last}">${last}</button>` : ''}
    <button class="btn sm" data-act="page" data-p="${pageNo + 1}"${pageNo === last ? ' disabled' : ''}>Berikutnya</button></div></div>`;
}

/* ---------- halaman publik ---------- */
function pubHome() {
  const a = DB.d.reports, act = a.filter(isActive), r7 = a.filter(x => x.createdAt > Date.now() - 7 * DAY);
  const s = series(a, 30);
  const recent = a.slice().sort((x, y) => y.createdAt - x.createdAt).slice(0, 6);
  return `<section class="hero"><div class="wrap hero-in">
    <div class="hero-t">
      <span class="eyebrow">Pemerintah Kota Medan · Kanal pengaduan resmi</span>
      <h1 class="disp">Laporkan masalah di lingkungan Anda, lalu ikuti penanganannya sampai tuntas.</h1>
      <p class="lead">Jalan berlubang, lampu padam, sampah menumpuk, atau layanan instansi yang lambat. Satu laporan mendapat satu nomor, dan setiap perubahan statusnya tercatat terbuka.</p>
      <div class="hero-a"><a class="btn pri lg" href="#/${U ? (isAdmin() ? 'admin' : 'warga/baru') : 'masuk'}">${ic('plus')} Buat pengaduan</a>
        <a class="btn lg" href="#/transparansi">${ic('chart')} Lihat kinerja layanan</a></div>
      <form class="trackbar" data-form="track"><label for="tq">Sudah pernah melapor? Masukkan nomor laporan</label>
        <div class="row"><input id="tq" name="q" inputmode="numeric" placeholder="contoh: 10482" autocomplete="off"><button class="btn pri">${ic('search')} Lacak</button></div></form>
    </div>
    <aside class="panel"><div class="panel-h"><h2>Ringkasan langsung</h2><span class="pulse">diperbarui otomatis</span></div>
      <dl class="rows">
        <div><dt>Total laporan tercatat</dt><dd class="mono">${nf(a.length)}</dd></div>
        <div><dt>Masuk 7 hari terakhir</dt><dd class="mono">${nf(r7.length)}</dd></div>
        <div><dt>Sedang ditangani</dt><dd class="mono">${nf(act.length)}</dd></div>
        <div><dt>Selesai</dt><dd class="mono">${nf(cnt(a, 'Selesai'))}</dd></div>
        <div><dt>Rata-rata penyelesaian</dt><dd class="mono">${dec(avgRes(a))} hari</dd></div>
      </dl>
      <div class="panel-s">${statusStrip(a)}</div>
    </aside></div></section>

  <div class="wrap">
    ${sec('Alur penanganan', `<ol class="flow">${[['Diterima', 'Laporan masuk dan langsung mendapat nomor resmi.'], ['Diverifikasi', 'Petugas memeriksa lokasi serta jenis masalah.'], ['Diproses', 'Laporan diteruskan ke instansi dan petugas pelaksana.'], ['Selesai', 'Pekerjaan tuntas, hasilnya tercatat dan terbuka.']].map(([t, d], i) => `<li><span class="n mono">0${i + 1}</span><b>${t}</b><p class="muted sm">${d}</p></li>`).join('')}</ol>`)}

    ${sec('Tren 30 hari terakhir', `<div class="card"><div class="card-b">${lineChart([{ name: 'Laporan masuk', v: s.inn, cls: 'in' }, { name: 'Laporan selesai', v: s.out, cls: 'out' }], s.labels)}</div></div>`)}

    ${sec('Laporan terbaru', `<div class="feed">${recent.map(r => `<article class="fi"><div class="fi-h"><b class="mono">${pid(r.id)}</b>${badge(r.status)}</div>
      <h3>${esc(catById(r.cat).name)}</h3><p class="muted sm">${esc(r.address)}, ${esc(r.kec)}</p>
      <p class="fi-d">${esc(r.desc)}</p><div class="fi-f sm muted">${ago(r.createdAt)}<button class="btn sm" data-act="open" data-id="${r.id}">Rincian</button></div></article>`).join('')}</div>`,
    `<a class="btn sm" href="#/peta">Lihat semua di peta ${ic('arrow')}</a>`)}
  </div>`;
}

function pubTrack(arg) {
  const r = arg ? rep(arg) : null;
  return page('Lacak laporan', 'Masukkan nomor laporan yang Anda terima saat melapor.', `
    <form class="trackbar solo" data-form="track"><label for="tq">Nomor laporan</label>
      <div class="row"><input id="tq" name="q" inputmode="numeric" value="${esc(arg || '')}" placeholder="contoh: 10482" autocomplete="off"><button class="btn pri">${ic('search')} Lacak</button></div>
      <p class="sm muted">Format nomor: PUB-xxxxx. Anda cukup mengetik angkanya.</p></form>
    ${arg ? (r ? trackResult(r) : `<div class="note bad">${ic('x')}<div><b>Nomor ${esc(arg)} tidak ditemukan.</b><p class="sm">Periksa kembali nomor pada bukti laporan Anda.</p></div></div>`) : ''}`);
}
function trackResult(r) {
  const o = r.officerId ? officerById(r.officerId) : null;
  return `<div class="card res"><div class="res-h"><div><span class="eyebrow">Nomor laporan</span><h2 class="mono">${pid(r.id)}</h2>
      <p class="muted">${esc(catLabel(r.cat))} · ${esc(r.address)}, ${esc(r.kec)}</p></div>
    <div class="chips">${badge(r.status)}${prio(r.priority)}</div></div>
    ${stepper(r)}
    <div class="res-g">
      <div><span class="eyebrow">Keterangan</span><p>${esc(r.desc)}</p>
        <span class="eyebrow mt">Penanganan</span><p class="sm">${esc(UNITS[r.unit])}${o ? ` · ${esc(o.name)}` : ''}${r.deadline ? ` · target ${dfl(r.deadline)}` : ''}</p></div>
      <div><span class="eyebrow">Riwayat</span>${history(r)}</div>
    </div></div>`;
}

function pubTrans() {
  const a = DB.d.reports, n = a.length || 1, s = series(a, V.days);
  const byGroup = Object.keys(GROUPS).map(g => ({ l: GROUPS[g], v: a.filter(r => catById(r.cat).g === g).length })).sort((x, y) => y.v - x.v);
  const byCat = CATS.map(c => ({ l: c.name, v: a.filter(r => r.cat === c.id).length })).sort((x, y) => y.v - x.v);
  const byKec = KEC.map(k => ({ l: k.name, v: a.filter(r => r.kec === k.name).length })).sort((x, y) => y.v - x.v);
  const done = a.filter(r => r.resolvedAt);
  const fast = CATS.map(c => ({ l: c.name, v: avgRes(a.filter(r => r.cat === c.id)) })).filter(x => x.v).sort((x, y) => x.v - y.v);
  return page('Transparansi pelayanan', 'Angka di halaman ini dihitung langsung dari seluruh laporan yang masuk. Tidak perlu masuk akun untuk melihatnya.', `
    ${figs([{ l: 'Total laporan', v: nf(a.length) }, { l: 'Selesai', v: nf(cnt(a, 'Selesai')), s: Math.round(cnt(a, 'Selesai') / n * 100) + '% dari total' },
    { l: 'Sedang ditangani', v: nf(a.filter(isActive).length) }, { l: 'Menunggu verifikasi', v: nf(cnt(a, STATUS[0])) },
    { l: 'Rata-rata penyelesaian', v: dec(avgRes(a)) + ' hari' }, { l: 'Selesai dalam 3 hari', v: Math.round(done.filter(r => resDays(r) <= 3).length / (done.length || 1) * 100) + '%' },
    { l: 'Melewati target', v: nf(a.filter(isOverdue).length), c: 'bad' }, { l: 'Kecamatan terlayani', v: nf(KEC.length) }])}
    ${sec('Komposisi status', `<div class="card"><div class="card-b">${statusStrip(a)}</div></div>`)}
    ${sec('Tren laporan', `<div class="card"><div class="card-b">${lineChart([{ name: 'Masuk', v: s.inn, cls: 'in' }, { name: 'Selesai', v: s.out, cls: 'out' }], s.labels)}</div></div>`,
      `<div class="segs">${[[30, '30 hari'], [90, '90 hari'], [180, '6 bulan']].map(([d, l]) => `<button class="btn sm${V.days === d ? ' on' : ''}" data-act="days" data-d="${d}">${l}</button>`).join('')}</div>`)}
    ${sec('Sebaran masalah', `<div class="g2">
      ${card('Kelompok masalah', hbars(byGroup, { pct: 1 }))}
      ${card('Kategori terbanyak', hbars(byCat.slice(0, 8), { pct: 1 }))}
      ${card('Kecamatan dengan laporan terbanyak', hbars(byKec.slice(0, 8)))}
      ${card('Rata-rata waktu penyelesaian tercepat', hbars(fast.slice(0, 8), { unit: 'hari' }))}</div>`)}
    ${sec('Rekap per kecamatan', `<div class="card"><div class="card-b"><div class="tw"><table class="tbl"><thead><tr><th>Kecamatan</th><th>Total</th><th>Menunggu</th><th>Ditangani</th><th>Selesai</th><th>Rata-rata</th></tr></thead><tbody>
      ${byKec.map(k => { const g = a.filter(r => r.kec === k.l); return `<tr><td data-l="Kecamatan"><b>${esc(k.l)}</b></td><td data-l="Total" class="mono">${nf(g.length)}</td>
        <td data-l="Menunggu" class="mono">${nf(cnt(g, STATUS[0]))}</td><td data-l="Ditangani" class="mono">${nf(g.filter(isActive).length)}</td>
        <td data-l="Selesai" class="mono">${nf(cnt(g, 'Selesai'))}</td><td data-l="Rata-rata" class="mono">${dec(avgRes(g))} hari</td></tr>`; }).join('')}
    </tbody></table></div></div></div>`)}`);
}

function mapFilters() {
  return `<div class="filt"><div class="fgrp"><label for="mst">Status</label><select id="mst" data-act="mapst"><option value="">Semua status</option>
    ${STATUS.map(s => `<option${V.mapSt === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="fgrp"><label for="mcat">Kategori</label><select id="mcat" data-act="mapcat"><option value="">Semua kategori</option>
    ${CATS.map(c => `<option value="${c.id}"${V.mapCat === c.id ? ' selected' : ''}>${c.name}</option>`).join('')}</select></div>
    <div class="legend">${STATUS.map(s => `<span><i class="bg-${SKEY[s]}"></i>${s}</span>`).join('')}</div></div>`;
}
function mapList() {
  const a = mapData();
  return `<div class="mapside"><div class="mapside-h sm muted">${nf(a.length)} titik ditampilkan (maks. 500 terbaru)</div>
    <ul class="mlist">${a.slice(0, 500).map(r => `<li><button data-act="focus" data-id="${r.id}"><span class="dot-s bg-${SKEY[r.status]}"></span>
      <span><b class="mono">${pid(r.id)}</b> ${esc(catById(r.cat).name)}<small class="muted">${esc(r.kec)} · ${ago(r.createdAt)}</small></span></button></li>`).join('')}</ul></div>`;
}
function mapData() {
  return DB.d.reports.filter(r => (!V.mapSt || r.status === V.mapSt) && (!V.mapCat || r.cat === V.mapCat))
    .sort((x, y) => y.createdAt - x.createdAt).slice(0, 500);
}
function pubMap() {
  return page('Peta pengaduan', 'Seluruh laporan ditampilkan menurut kecamatan. Warna gelap berarti laporan aktif lebih banyak.',
    `${mapFilters()}<div class="maplay"><div class="mapbox" data-after="map"></div>${mapList()}</div>`);
}
const AFTER = {
  sug() { runSuggest(); },
  map(el) {
    const heat = {}; DB.d.reports.filter(isActive).forEach(r => heat[r.kec] = (heat[r.kec] || 0) + 1);
    MAP = drawMap({ el, reports: mapData(), heat, view: FULL_VIEW, onPick: openReport });
  },
  pickmap(el) {
    MAP = drawMap({
      el, view: CENTRAL_VIEW, marker: V.pt || undefined,
      onPoint: (lat, lng) => { V.pt = [lat, lng]; MAP.marker(lat, lng); const k = nearestKec(lat, lng); const s = $('#fkec'); if (s) s.value = k.name; const o = $('#ptout'); if (o) o.textContent = `${lat}, ${lng} · ${k.name}`; }
    });
  }
};

/* ---------- masuk & daftar ---------- */
function vLogin() {
  return `<div class="auth"><div class="auth-b">
    <a class="brand" href="#/"><i>P1</i><span><b>PUBLIK ONE</b><small>Kota Medan</small></span></a>
    <h1 class="disp">Masuk ke akun Anda</h1><p class="lead">Warga memakai akun untuk melapor dan memantau. Admin memakai akun untuk mengelola seluruh pengaduan.</p>
    <form class="form" data-form="login">
      <div class="fgrp"><label for="le">Email</label><input id="le" name="email" type="email" required autocomplete="username" value="warga@publikone.id"></div>
      <div class="fgrp"><label for="lp">Kata sandi</label><input id="lp" name="password" type="password" required autocomplete="current-password" value="123456"></div>
      <button class="btn pri w">Masuk</button>
      <p class="sm muted">Belum punya akun? <a href="#/daftar">Daftar di sini</a></p>
    </form>
    <div class="demo"><span class="eyebrow">Akun demo</span>
      <button class="demo-i" data-act="fill" data-e="warga@publikone.id" data-p="123456"><b>Warga</b><span class="mono sm">warga@publikone.id · 123456</span></button>
      <button class="demo-i" data-act="fill" data-e="admin@publikone.id" data-p="admin123"><b>Admin</b><span class="mono sm">admin@publikone.id · admin123</span></button></div>
  </div><div class="auth-s"><blockquote><p>“Laporan saya sudah sampai mana?” — pertanyaan itu yang ingin kami jawab tanpa warga perlu datang ke kantor.</p></blockquote>
    <dl class="rows inv"><div><dt>Laporan tercatat</dt><dd class="mono">${nf(DB.d.reports.length)}</dd></div>
    <div><dt>Selesai ditangani</dt><dd class="mono">${nf(cnt(DB.d.reports, 'Selesai'))}</dd></div>
    <div><dt>Rata-rata penyelesaian</dt><dd class="mono">${dec(avgRes(DB.d.reports))} hari</dd></div></dl></div></div>`;
}
function vRegister() {
  return `<div class="auth"><div class="auth-b">
    <a class="brand" href="#/"><i>P1</i><span><b>PUBLIK ONE</b><small>Kota Medan</small></span></a>
    <h1 class="disp">Daftar akun warga</h1><p class="lead">Akun dipakai untuk mengirim pengaduan dan menerima pemberitahuan status.</p>
    <form class="form" data-form="register">
      <div class="fgrp"><label for="rn">Nama lengkap</label><input id="rn" name="name" required autocomplete="name"></div>
      <div class="fgrp"><label for="re">Email</label><input id="re" name="email" type="email" required autocomplete="email"></div>
      <div class="f2"><div class="fgrp"><label for="rt">Nomor HP</label><input id="rt" name="phone" inputmode="tel" placeholder="08xx"></div>
      <div class="fgrp"><label for="rk">Kecamatan</label><select id="rk" name="kec">${KEC.map(k => `<option>${k.name}</option>`).join('')}</select></div></div>
      <div class="fgrp"><label for="rp">Kata sandi</label><input id="rp" name="password" type="password" required minlength="6" autocomplete="new-password"><small class="muted">Minimal 6 karakter.</small></div>
      <button class="btn pri w">Buat akun</button>
      <p class="sm muted">Sudah punya akun? <a href="#/masuk">Masuk</a></p></form>
  </div><div class="auth-s"><blockquote><p>Data pada prototipe ini disimpan di peramban Anda sendiri, bukan di server.</p></blockquote></div></div>`;
}

/* ---------- halaman warga ---------- */
function cDash() {
  const m = myReports(), act = m.filter(isActive), ns = myNotifs().slice(0, 4);
  const recent = m.slice().sort((x, y) => y.createdAt - x.createdAt).slice(0, 4);
  return page(`Selamat datang, ${U.name.split(' ')[0]}`, 'Ringkasan pengaduan Anda dan perkembangan penanganannya.', `
    ${figs([{ l: 'Total pengaduan', v: nf(m.length) }, { l: 'Menunggu verifikasi', v: nf(cnt(m, STATUS[0])) }, { l: 'Sedang diproses', v: nf(act.length) }, { l: 'Selesai', v: nf(cnt(m, 'Selesai')) }])}
    <div class="cta-row"><div><h2>Ada masalah di sekitar Anda?</h2><p class="muted sm">Tulis singkat saja. Sistem akan menyarankan kategori dan instansi yang menangani.</p></div>
      <form class="row" data-form="quick"><input name="q" placeholder="Contoh: lampu di depan sekolah mati sejak kemarin" aria-label="Tulis masalah Anda"><button class="btn pri">${ic('wand')} Lanjutkan</button></form></div>
    <div class="g2">
      ${card('Pengaduan terbaru saya', recent.length ? `<ul class="plist">${recent.map(r => `<li><button data-act="open" data-id="${r.id}"><div><b class="mono">${pid(r.id)}</b> ${esc(catById(r.cat).name)}<small class="muted">${esc(r.address)} · ${ago(r.createdAt)}</small></div>${badge(r.status)}</button></li>`).join('')}</ul>`
      : empty('Belum ada pengaduan', 'Laporan pertama Anda akan muncul di sini.', `<a class="btn pri sm" href="#/warga/baru">Buat pengaduan</a>`), m.length ? `<a class="btn sm" href="#/warga/laporan">Semua ${ic('arrow')}</a>` : '')}
      ${card('Notifikasi terbaru', ns.length ? `<ul class="nlist">${ns.map(n => `<li class="${n.read ? '' : 'un'}"><button data-act="open" data-id="${n.reportId}">${ic(n.kind === 'done' ? 'check' : n.kind === 'assign' ? 'users' : 'bell')}<div><p>${esc(n.text)}</p><small class="muted">${ago(n.at)}</small></div></button></li>`).join('')}</ul>`
      : empty('Belum ada notifikasi', 'Pemberitahuan status akan tampil di sini.'), unread() ? `<button class="btn sm" data-act="readall">Tandai dibaca</button>` : '')}
    </div>`);
}

function catOptions(sel) {
  return Object.keys(GROUPS).map(g => `<optgroup label="${GROUPS[g]}">${CATS.filter(c => c.g === g).map(c => `<option value="${c.id}"${sel === c.id ? ' selected' : ''}>${c.name}</option>`).join('')}</optgroup>`).join('');
}
function cNew() {
  const today = dateStr(Date.now());
  return page('Buat pengaduan', 'Lengkapi data berikut. Tanda * wajib diisi.', `
    <div class="newlay"><form class="form card" data-form="new" id="newForm"><div class="card-b">
      <div class="fgrp"><label for="fdesc">Ceritakan masalahnya *</label>
        <textarea id="fdesc" name="desc" rows="4" required placeholder="Sudah berapa lama, di titik mana, dan apa dampaknya bagi warga?">${esc(V.sug || '')}</textarea>
        <small class="muted">Minimal 15 karakter. Sistem membaca teks ini untuk menyarankan kategori.</small></div>
      <div id="sugbox" class="sug" hidden data-after="sug"></div>
      <div class="f2"><div class="fgrp"><label for="fcat">Kategori *</label><select id="fcat" name="cat" required>${catOptions('')}</select></div>
        <div class="fgrp"><label for="fpri">Tingkat urgensi</label><select id="fpri" name="priority">${PRIORITIES.map(p => `<option${p === 'Sedang' ? ' selected' : ''}>${p}</option>`).join('')}</select></div></div>
      <div class="f2"><div class="fgrp"><label for="fkec">Kecamatan *</label><select id="fkec" name="kec" required>${KEC.map(k => `<option${U.kec === k.name ? ' selected' : ''}>${k.name}</option>`).join('')}</select></div>
        <div class="fgrp"><label for="fdate">Tanggal kejadian</label><input id="fdate" name="date" type="date" value="${today}" max="${today}"></div></div>
      <div class="fgrp"><label for="faddr">Alamat atau patokan lokasi *</label><input id="faddr" name="address" required placeholder="Contoh: Jl. Merdeka No. 10, depan SD Negeri 5"></div>
      <div class="fgrp"><label>Foto bukti <span class="muted">(opsional, maks. 3)</span></label>
        <label class="drop" for="fphoto">${ic('camera')}<span>Pilih foto dari galeri atau kamera</span><small class="muted">JPG/PNG, otomatis dikecilkan sebelum disimpan</small></label>
        <input id="fphoto" type="file" accept="image/*" multiple data-act="photos" class="vis-h">
        <div id="shots" class="shots edit"></div></div>
      <button class="btn pri w lg">${ic('check')} Kirim pengaduan</button>
      <p class="sm muted">Dengan mengirim, Anda menyatakan laporan ini benar. Laporan palsu dapat dihapus admin.</p>
    </div></form>
    <aside class="card side-c"><div class="card-h"><h3>Tandai titik lokasi</h3></div><div class="card-b">
      <p class="sm muted">Ketuk peta untuk menandai titik. Kecamatan akan ikut terisi.</p>
      <div class="mapbox pick" data-after="pickmap"></div>
      <p class="sm mono" id="ptout">${V.pt ? V.pt.join(', ') : 'Belum ditandai — titik tengah kecamatan akan dipakai'}</p>
      <span class="eyebrow mt">Yang terjadi setelah ini</span>
      <ol class="mini">${['Laporan mendapat nomor PUB-xxxxx.', 'Petugas memverifikasi dalam 1×24 jam kerja.', 'Instansi terkait menugaskan petugas pelaksana.', 'Anda menerima notifikasi tiap status berubah.'].map(t => `<li>${t}</li>`).join('')}</ol>
    </div></aside></div>`);
}
function cList() {
  let m = myReports();
  if (V.cst) m = m.filter(r => r.status === V.cst);
  if (V.cq) { const q = V.cq.toLowerCase(); m = m.filter(r => (pid(r.id) + ' ' + catById(r.cat).name + ' ' + r.address + ' ' + r.kec + ' ' + r.desc).toLowerCase().includes(q)); }
  m.sort((x, y) => y.createdAt - x.createdAt);
  const all = myReports();
  return page('Pengaduan saya', 'Seluruh laporan yang Anda kirim beserta status terkininya.', `
    <div class="filt"><div class="segs">${[['', 'Semua', all.length]].concat(STATUS.map(s => [s, s, cnt(all, s)])).map(([v, l, c]) => `<button class="btn sm${V.cst === v ? ' on' : ''}" data-act="cst" data-v="${v}">${l} <em>${c}</em></button>`).join('')}</div>
      <div class="fgrp grow"><label for="cq" class="vis-h">Cari</label><div class="ipre">${ic('search')}<input id="cq" value="${esc(V.cq)}" data-act="cq" placeholder="Cari nomor, lokasi, atau kata kunci" autocomplete="off"></div></div></div>
    ${repTable(m, 'citizen')}`, `<a class="btn pri" href="#/warga/baru">${ic('plus')} Buat pengaduan</a>`);
}
function cNotif() {
  const ns = myNotifs();
  return page('Notifikasi', 'Pemberitahuan otomatis setiap kali status pengaduan Anda berubah.',
    ns.length ? `<ul class="nlist big">${ns.map(n => `<li class="${n.read ? '' : 'un'}"><button data-act="open" data-id="${n.reportId}">${ic(n.kind === 'done' ? 'check' : n.kind === 'assign' ? 'users' : n.kind === 'new' ? 'plus' : 'bell')}
      <div><p>${esc(n.text)}</p><small class="muted">${dtf(n.at)} · ${ago(n.at)}</small></div>${n.read ? '' : '<em class="dot"></em>'}</button></li>`).join('')}</ul>`
      : empty('Belum ada notifikasi', 'Kirim pengaduan terlebih dahulu untuk menerima pemberitahuan.'),
    unread() ? `<button class="btn" data-act="readall">${ic('check')} Tandai semua dibaca</button>` : '');
}
function cProfile() {
  const m = myReports();
  return page('Profil saya', 'Data akun dipakai petugas untuk menghubungi Anda bila perlu konfirmasi.', `
    <div class="g2">
      ${card('Data akun', `<form class="form" data-form="profile">
        <div class="prof"><span class="av lg">${initials(U.name)}</span><div><b>${esc(U.name)}</b><small class="muted">${esc(U.email)}</small></div></div>
        <div class="fgrp"><label for="pn">Nama lengkap</label><input id="pn" name="name" value="${esc(U.name)}" required></div>
        <div class="f2"><div class="fgrp"><label for="pt">Nomor HP</label><input id="pt" name="phone" value="${esc(U.phone)}"></div>
          <div class="fgrp"><label for="pk">Kecamatan</label><select id="pk" name="kec">${KEC.map(k => `<option${U.kec === k.name ? ' selected' : ''}>${k.name}</option>`).join('')}</select></div></div>
        <button class="btn pri">Simpan perubahan</button></form>`)}
      <div class="col">
        ${card('Ganti kata sandi', `<form class="form" data-form="pass">
          <div class="fgrp"><label for="o1">Kata sandi saat ini</label><input id="o1" name="old" type="password" required autocomplete="current-password"></div>
          <div class="fgrp"><label for="o2">Kata sandi baru</label><input id="o2" name="new" type="password" required minlength="6" autocomplete="new-password"></div>
          <button class="btn pri">Perbarui</button></form>`)}
        ${card('Ringkasan aktivitas', `<dl class="rows"><div><dt>Total pengaduan</dt><dd class="mono">${nf(m.length)}</dd></div>
          <div><dt>Selesai</dt><dd class="mono">${nf(cnt(m, 'Selesai'))}</dd></div>
          <div><dt>Sedang ditangani</dt><dd class="mono">${nf(m.filter(isActive).length)}</dd></div></dl>
          <div class="dlg-act"><button class="btn" data-act="logout">${ic('out')} Keluar</button><button class="btn danger" data-act="reset">Reset data demo</button></div>`)}
      </div></div>`);
}

/* ---------- halaman admin ---------- */
function aDash() {
  const a = DB.d.reports, s = series(a, V.days), late = a.filter(isOverdue);
  const queue = a.filter(r => r.status !== 'Selesai').sort((x, y) => (isOverdue(y) - isOverdue(x)) || x.createdAt - y.createdAt).slice(0, 7);
  const feed = a.flatMap(r => r.history.map(ev => ({ r, ev }))).sort((x, y) => y.ev.at - x.ev.at).slice(0, 8);
  const done = a.filter(r => r.resolvedAt);
  return page('Ringkasan', `Kondisi pelayanan per ${dfl(Date.now())}.`, `
    ${figs([{ l: 'Total laporan', v: nf(a.length) }, { l: 'Menunggu verifikasi', v: nf(cnt(a, STATUS[0])) },
    { l: 'Sedang ditangani', v: nf(a.filter(isActive).length) }, { l: 'Selesai', v: nf(cnt(a, 'Selesai')), s: Math.round(cnt(a, 'Selesai') / (a.length || 1) * 100) + '% dari total' },
    { l: 'Rata-rata penyelesaian', v: dec(avgRes(a)) + ' hari' }, { l: 'Selesai dalam 3 hari', v: Math.round(done.filter(r => resDays(r) <= 3).length / (done.length || 1) * 100) + '%' },
    { l: 'Melewati target', v: nf(late.length), c: late.length ? 'bad' : '' }, { l: 'Masuk hari ini', v: nf(a.filter(r => r.date === dateStr(Date.now())).length) }])}
    <div class="g21">
      ${card('Laporan masuk dan selesai', lineChart([{ name: 'Masuk', v: s.inn, cls: 'in' }, { name: 'Selesai', v: s.out, cls: 'out' }], s.labels),
      `<div class="segs">${[[30, '30 hari'], [90, '90 hari'], [180, '6 bulan']].map(([d, l]) => `<button class="btn sm${V.days === d ? ' on' : ''}" data-act="days" data-d="${d}">${l}</button>`).join('')}</div>`)}
      ${card('Komposisi status', statusStrip(a))}
    </div>
    <div class="g21">
      ${card('Perlu tindakan', `<ul class="qlist">${queue.map(r => `<li${isOverdue(r) ? ' class="late"' : ''}>
        <div class="q-t"><button class="lnk mono" data-act="open" data-id="${r.id}">${pid(r.id)}</button> ${esc(catById(r.cat).name)}
          <small class="muted">${esc(r.kec)} · masuk ${ago(r.createdAt)}${isOverdue(r) ? ` · <span class="late-t">target ${df(r.deadline)} terlewat</span>` : ''}</small></div>
        <div class="q-a">${badge(r.status)}${NEXT[r.status] ? `<button class="btn sm" data-act="next" data-id="${r.id}">${NEXT[r.status]}</button>` : ''}
          ${r.officerId ? '' : `<button class="btn sm" data-act="assign" data-id="${r.id}">Tugaskan</button>`}</div></li>`).join('')}</ul>`,
      `<a class="btn sm" href="#/admin/laporan">Kelola semua ${ic('arrow')}</a>`)}
      ${card('Aktivitas terakhir', `<ol class="log tight">${feed.map(({ r, ev }) => `<li class="${ev.s ? 's-' + SKEY[ev.s] : ''}"><div class="log-t"><button class="lnk mono" data-act="open" data-id="${r.id}">${pid(r.id)}</button> ${ev.assign ? 'ditugaskan ke ' + esc(officerById(ev.assign).name) : ev.edit ? 'data diperbarui' : esc(ev.s)}</div>
        <div class="log-m sm muted">${ago(ev.at)} · ${esc(ev.by)}</div></li>`).join('')}</ol>`)}
    </div>`);
}

function filtered() {
  let a = DB.d.reports;
  if (V.st) a = a.filter(r => r.status === V.st);
  if (V.cat) a = a.filter(r => r.cat === V.cat);
  if (V.kec) a = a.filter(r => r.kec === V.kec);
  if (V.from) a = a.filter(r => r.createdAt >= parseDate(V.from));
  if (V.to) a = a.filter(r => r.createdAt <= endOfDay(parseDate(V.to)));
  if (V.q) { const q = V.q.toLowerCase().replace('pub-', '').trim(); a = a.filter(r => (String(r.id) + ' ' + catById(r.cat).name + ' ' + GROUPS[catById(r.cat).g] + ' ' + r.address + ' ' + r.kec + ' ' + r.desc + ' ' + (r.reporter || '')).toLowerCase().includes(q)); }
  const S = { new: (x, y) => y.createdAt - x.createdAt, old: (x, y) => x.createdAt - y.createdAt, id: (x, y) => y.id - x.id, pri: (x, y) => PRIORITIES.indexOf(y.priority) - PRIORITIES.indexOf(x.priority) || y.createdAt - x.createdAt, st: (x, y) => STATUS.indexOf(x.status) - STATUS.indexOf(y.status) || x.createdAt - y.createdAt };
  return a.sort(S[V.sort] || S.new);
}
function aList() {
  const a = filtered(), last = Math.max(1, Math.ceil(a.length / V.per));
  if (V.page > last) V.page = last;
  const slice = a.slice((V.page - 1) * V.per, V.page * V.per);
  const active = [V.st && ['Status: ' + V.st, 'st'], V.cat && ['Kategori: ' + catById(V.cat).name, 'cat'], V.kec && ['Kecamatan: ' + V.kec, 'kec'], V.from && ['Dari ' + V.from, 'from'], V.to && ['Sampai ' + V.to, 'to'], V.q && ['Cari: ' + V.q, 'q']].filter(Boolean);
  return page('Kelola pengaduan', 'Tambah, ubah, perbarui status, dan hapus laporan. Perubahan langsung terlihat oleh warga.', `
    <div class="bar">
      <div class="ipre grow"><label for="aq" class="vis-h">Cari</label>${ic('search')}<input id="aq" value="${esc(V.q)}" data-act="q" placeholder="Cari nomor, kategori, lokasi, pelapor, atau isi laporan" autocomplete="off"></div>
      <button class="btn${V.fOpen ? ' on' : ''}" data-act="togglef" aria-expanded="${V.fOpen}">${ic('list')} Filter${active.length ? ` <em>${active.length}</em>` : ''}</button>
      <button class="btn" data-act="csv">${ic('down')}<span class="lbl">Ekspor CSV</span></button>
      <button class="btn pri" data-act="create">${ic('plus')} Tambah laporan</button>
    </div>
    ${V.fOpen ? `<div class="filt box">
      <div class="fgrp"><label for="fst">Status</label><select id="fst" data-act="st"><option value="">Semua</option>${STATUS.map(s => `<option${V.st === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="fgrp"><label for="fcat2">Kategori</label><select id="fcat2" data-act="cat"><option value="">Semua</option>${CATS.map(c => `<option value="${c.id}"${V.cat === c.id ? ' selected' : ''}>${c.name}</option>`).join('')}</select></div>
      <div class="fgrp"><label for="fkec2">Kecamatan</label><select id="fkec2" data-act="kec"><option value="">Semua</option>${KEC.map(k => `<option${V.kec === k.name ? ' selected' : ''}>${k.name}</option>`).join('')}</select></div>
      <div class="fgrp"><label for="ffrom">Dari tanggal</label><input id="ffrom" type="date" value="${V.from}" data-act="from"></div>
      <div class="fgrp"><label for="fto">Sampai tanggal</label><input id="fto" type="date" value="${V.to}" data-act="to"></div>
      <div class="fgrp"><label for="fsort">Urutkan</label><select id="fsort" data-act="sort">${[['new', 'Terbaru'], ['old', 'Terlama'], ['id', 'Nomor'], ['pri', 'Urgensi'], ['st', 'Status']].map(([v, l]) => `<option value="${v}"${V.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <button class="btn" data-act="clearf">Bersihkan filter</button></div>` : ''}
    ${active.length ? `<div class="chipbar">${active.map(([l, k]) => `<button class="chip" data-act="rmf" data-k="${k}">${esc(l)} ${ic('x')}</button>`).join('')}</div>` : ''}
    ${V.sel.size ? `<div class="bulk"><b>${V.sel.size} dipilih</b>
      <select data-act="bulkst"><option value="">Ubah status ke…</option>${STATUS.map(s => `<option>${s}</option>`).join('')}</select>
      <button class="btn danger sm" data-act="bulkdel">${ic('trash')} Hapus terpilih</button>
      <button class="btn sm" data-act="selnone">Batalkan pilihan</button></div>` : ''}
    ${repTable(slice, 'admin')}
    ${pager(a.length, V.page, V.per)}`);
}
function aMap() {
  const heat = {}; DB.d.reports.filter(isActive).forEach(r => heat[r.kec] = (heat[r.kec] || 0) + 1);
  const top = Object.entries(heat).sort((x, y) => y[1] - x[1]).slice(0, 5);
  return page('Peta sebaran', 'Titik masalah dan kecamatan dengan beban laporan aktif tertinggi.', `
    ${mapFilters()}
    <div class="maplay"><div class="mapbox" data-after="map"></div>
      <div class="col">${card('Beban tertinggi', hbars(top.map(([l, v]) => ({ l, v }))))}${mapList()}</div></div>`);
}
function aStats() {
  const a = DB.d.reports, s = series(a, 180), done = a.filter(r => r.resolvedAt);
  const byCat = CATS.map(c => ({ id: c.id, l: c.name, g: GROUPS[c.g], unit: UNITS[c.unit], v: a.filter(r => r.cat === c.id).length })).sort((x, y) => y.v - x.v);
  const byKec = KEC.map(k => ({ l: k.name, v: a.filter(r => r.kec === k.name).length })).sort((x, y) => y.v - x.v);
  const byUnit = Object.keys(UNITS).map(u => ({ l: UNITS[u], v: a.filter(r => r.unit === u).length })).filter(x => x.v).sort((x, y) => y.v - x.v);
  const buckets = [[1, 'Kurang dari 1 hari'], [3, '2 sampai 3 hari'], [7, '4 sampai 7 hari'], [14, '8 sampai 14 hari'], [999, 'Lebih dari 14 hari']];
  let prev = 0; const dist = buckets.map(([d, l]) => { const v = done.filter(r => resDays(r) > prev && resDays(r) <= d).length; prev = d; return { l, v }; });
  return page('Statistik', 'Rekap kinerja penanganan untuk bahan evaluasi.', `
    ${figs([{ l: 'Total laporan', v: nf(a.length) }, { l: 'Tingkat penyelesaian', v: Math.round(cnt(a, 'Selesai') / (a.length || 1) * 100) + '%' },
    { l: 'Rata-rata penyelesaian', v: dec(avgRes(a)) + ' hari' }, { l: 'Laporan terbuka', v: nf(a.filter(r => r.status !== 'Selesai').length) }])}
    ${sec('Tren 6 bulan', `<div class="card"><div class="card-b">${lineChart([{ name: 'Masuk', v: s.inn, cls: 'in' }, { name: 'Selesai', v: s.out, cls: 'out' }], s.labels)}</div></div>`)}
    ${sec('Distribusi', `<div class="g2">
      ${card('Laporan per kategori', hbars(byCat.map(c => ({ l: c.l, v: c.v })), { pct: 1 }))}
      ${card('Laporan per kecamatan', hbars(byKec, {}))}
      ${card('Beban per instansi', hbars(byUnit, { pct: 1 }))}
      ${card('Lama penyelesaian', hbars(dist, { pct: 1 }))}</div>`)}
    ${sec('Rincian per kategori', `<div class="card"><div class="card-b"><div class="tw"><table class="tbl"><thead><tr><th>Kategori</th><th>Instansi</th><th>Total</th><th>Terbuka</th><th>Selesai</th><th>% selesai</th><th>Rata-rata</th></tr></thead><tbody>
      ${byCat.map(c => { const g = a.filter(r => r.cat === c.id); return `<tr><td data-l="Kategori"><b>${esc(c.l)}</b><small class="muted">${esc(c.g)}</small></td><td data-l="Instansi">${esc(c.unit)}</td>
        <td data-l="Total" class="mono">${nf(g.length)}</td><td data-l="Terbuka" class="mono">${nf(g.filter(r => r.status !== 'Selesai').length)}</td><td data-l="Selesai" class="mono">${nf(cnt(g, 'Selesai'))}</td>
        <td data-l="% selesai" class="mono">${Math.round(cnt(g, 'Selesai') / (g.length || 1) * 100)}%</td><td data-l="Rata-rata" class="mono">${dec(avgRes(g))} hari</td></tr>`; }).join('')}
    </tbody></table></div></div></div>`)}`);
}
function aOfficers() {
  const a = DB.d.reports;
  const rows = OFFICERS.map(o => {
    const g = a.filter(r => r.officerId === o.id);
    return { o, tot: g.length, act: g.filter(r => r.status !== 'Selesai').length, done: cnt(g, 'Selesai'), late: g.filter(isOverdue).length, avg: avgRes(g) };
  }).sort((x, y) => y.act - x.act);
  return page('Petugas pelaksana', 'Beban kerja petugas dan ketepatan terhadap target penyelesaian.', `
    ${figs([{ l: 'Petugas aktif', v: nf(OFFICERS.length) }, { l: 'Instansi terlibat', v: nf(Object.keys(UNITS).length) },
    { l: 'Laporan ditugaskan', v: nf(a.filter(r => r.officerId).length) }, { l: 'Melewati target', v: nf(a.filter(isOverdue).length), c: 'bad' }])}
    <div class="card"><div class="card-b"><div class="tw"><table class="tbl"><thead><tr><th>Petugas</th><th>Instansi</th><th>Ditangani</th><th>Aktif</th><th>Selesai</th><th>Telat</th><th>Rata-rata</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td data-l="Petugas"><span class="av sm">${initials(r.o.name)}</span> <b>${esc(r.o.name)}</b></td><td data-l="Instansi">${esc(UNITS[r.o.unit])}</td>
        <td data-l="Ditangani" class="mono">${nf(r.tot)}</td><td data-l="Aktif" class="mono">${nf(r.act)}</td><td data-l="Selesai" class="mono">${nf(r.done)}</td>
        <td data-l="Telat" class="mono${r.late ? ' bad' : ''}">${nf(r.late)}</td><td data-l="Rata-rata" class="mono">${r.avg ? dec(r.avg) + ' hari' : '—'}</td></tr>`).join('')}
    </tbody></table></div></div></div>`);
}

/* ---------- formulir admin ---------- */
function formFields(r) {
  const today = dateStr(Date.now());
  return `<div class="f2"><div class="fgrp"><label for="mc">Kategori</label><select id="mc" name="cat" required>${catOptions(r ? r.cat : '')}</select></div>
    <div class="fgrp"><label for="mp">Urgensi</label><select id="mp" name="priority">${PRIORITIES.map(p => `<option${r && r.priority === p ? ' selected' : ''}>${p}</option>`).join('')}</select></div></div>
  <div class="f2"><div class="fgrp"><label for="mk">Kecamatan</label><select id="mk" name="kec" required>${KEC.map(k => `<option${r && r.kec === k.name ? ' selected' : ''}>${k.name}</option>`).join('')}</select></div>
    <div class="fgrp"><label for="md2">Tanggal</label><input id="md2" name="date" type="date" value="${r ? r.date : today}" max="${today}"></div></div>
  <div class="fgrp"><label for="ma">Alamat / patokan</label><input id="ma" name="address" required value="${r ? esc(r.address) : ''}"></div>
  <div class="fgrp"><label for="mr">Nama pelapor</label><input id="mr" name="reporter" value="${r ? esc(r.reporter) : ''}" placeholder="Kosongkan bila laporan langsung"></div>
  <div class="fgrp"><label for="mdz">Keterangan</label><textarea id="mdz" name="desc" rows="4" required>${r ? esc(r.desc) : ''}</textarea></div>
  <div class="fgrp"><label for="ms">Status</label><select id="ms" name="status">${STATUS.map(s => `<option${r && r.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select></div>`;
}
function formCreate() { openModal(`<h2>Tambah laporan</h2><p class="muted sm">Dipakai untuk laporan yang masuk lewat telepon, surat, atau kunjungan langsung.</p><form class="form" data-form="admcreate">${formFields(null)}<div class="dlg-act"><button type="button" class="btn" onclick="closeModal()">Batal</button><button class="btn pri">Simpan laporan</button></div></form>`, 'lg'); }
function formEdit(id) {
  const r = rep(id); if (!r) return;
  openModal(`<h2>Ubah ${pid(r.id)}</h2><p class="muted sm">Perubahan status akan mengirim notifikasi ke pelapor.</p><form class="form" data-form="admedit" data-id="${r.id}">${formFields(r)}<div class="dlg-act"><button type="button" class="btn" onclick="closeModal()">Batal</button><button class="btn pri">Simpan perubahan</button></div></form>`, 'lg');
}
function formAssign(id) {
  const r = rep(id); if (!r) return;
  const dl = dateStr(Date.now() + 3 * DAY);
  openModal(`<h2>Penugasan ${pid(r.id)}</h2><p class="muted sm">${esc(catLabel(r.cat))} · ${esc(r.address)}, ${esc(r.kec)}</p>
    <form class="form" data-form="assign" data-id="${r.id}">
      <div class="fgrp"><label for="au">Instansi</label><select id="au" name="unit" data-act="unit">${Object.keys(UNITS).map(u => `<option value="${u}"${r.unit === u ? ' selected' : ''}>${UNITS[u]}</option>`).join('')}</select></div>
      <div class="fgrp"><label for="ao">Petugas pelaksana</label><select id="ao" name="officer" required>${OFFICERS.filter(o => o.unit === r.unit).map(o => `<option value="${o.id}"${r.officerId === o.id ? ' selected' : ''}>${o.name}</option>`).join('')}</select></div>
      <div class="fgrp"><label for="ad">Target selesai</label><input id="ad" name="deadline" type="date" value="${r.deadline ? dateStr(r.deadline) : dl}" min="${dateStr(Date.now())}" required></div>
      <p class="sm muted">Status otomatis menjadi “Diproses” bila masih di tahap sebelumnya.</p>
      <div class="dlg-act"><button type="button" class="btn" onclick="closeModal()">Batal</button><button class="btn pri">Tugaskan</button></div></form>`, 'sm');
}

/* ---------- aksi ---------- */
const ACT = {
  theme() {
    const r = document.documentElement;
    const dark = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('publikone_theme', r.dataset.theme); } catch (e) { }
  },
  logout() { setSess(null); closeModal(); toast('Anda sudah keluar.'); go(''); },
  reset() { confirmBox('Reset data demo?', 'Semua laporan kembali ke data awal dan laporan yang Anda buat akan hilang.', 'Reset', () => { DB.reset(); setSess(null); toast('Data demo dikembalikan ke awal.'); go(''); }); },
  open(el) { openReport(el.dataset.id); },
  fill(el) { $('#le').value = el.dataset.e; $('#lp').value = el.dataset.p; toast('Akun demo dimuat. Tekan Masuk.'); },
  days(el) { V.days = +el.dataset.d; render(); },
  readall() { myNotifs().forEach(n => n.read = true); DB.save(); toast('Semua notifikasi ditandai sudah dibaca.'); render(); },
  cst(el) { V.cst = el.dataset.v; render(); },
  cq(el) { V.cq = el.value; const t = $('#cq'); clearTimeout(ACT._t); ACT._t = setTimeout(() => { render(); const i = $('#cq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260); },
  q(el) { V.q = el.value; V.page = 1; clearTimeout(ACT._t); ACT._t = setTimeout(() => { render(); const i = $('#aq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260); },
  togglef() { V.fOpen = !V.fOpen; render(); },
  st(el) { V.st = el.value; V.page = 1; render(); },
  cat(el) { V.cat = el.value; V.page = 1; render(); },
  kec(el) { V.kec = el.value; V.page = 1; render(); },
  from(el) { V.from = el.value; V.page = 1; render(); },
  to(el) { V.to = el.value; V.page = 1; render(); },
  sort(el) { V.sort = el.value; render(); },
  clearf() { Object.assign(V, { st: '', cat: '', kec: '', from: '', to: '', q: '', page: 1 }); render(); },
  rmf(el) { V[el.dataset.k] = ''; V.page = 1; render(); },
  page(el) { V.page = Math.max(1, +el.dataset.p); render(); },
  mapst(el) { V.mapSt = el.value; render(); },
  mapcat(el) { V.mapCat = el.value; render(); },
  focus(el) { const r = rep(el.dataset.id); if (r && MAP) { MAP.focus(r.lat, r.lng, 90); MAP.select(r.id); } openReport(el.dataset.id); },
  sel(el) { const id = +el.dataset.id; el.checked ? V.sel.add(id) : V.sel.delete(id); render(); },
  selall(el) { const ids = filtered().slice((V.page - 1) * V.per, V.page * V.per).map(r => r.id); el.checked ? ids.forEach(i => V.sel.add(i)) : ids.forEach(i => V.sel.delete(i)); render(); },
  selnone() { V.sel.clear(); render(); },
  bulkst(el) {
    const s = el.value; if (!s) return;
    const ids = [...V.sel]; ids.forEach(id => Ops.status(id, s, U.name, 'Pembaruan massal oleh admin.'));
    V.sel.clear(); toast(`${ids.length} laporan diubah ke ${s}.`); render();
  },
  bulkdel() {
    const ids = [...V.sel];
    confirmBox(`Hapus ${ids.length} laporan?`, 'Laporan terpilih akan dihapus permanen dari data demo.', 'Hapus', () => { ids.forEach(Ops.remove); V.sel.clear(); toast(`${ids.length} laporan dihapus.`); render(); });
  },
  create() { formCreate(); },
  edit(el) { formEdit(el.dataset.id); },
  assign(el) { formAssign(el.dataset.id); },
  unit(el) {
    const sel = $('#ao'); if (!sel) return;
    sel.innerHTML = OFFICERS.filter(o => o.unit === el.value).map(o => `<option value="${o.id}">${o.name}</option>`).join('') || '<option value="">Belum ada petugas</option>';
  },
  next(el) {
    const r = rep(el.dataset.id), s = NEXT[r.status]; if (!s) return;
    if (s === 'Diproses' && !r.officerId) return formAssign(r.id);
    Ops.status(r.id, s, U.name); closeModal(); toast(`${pid(r.id)} kini ${s}.`); render();
  },
  del(el) {
    const r = rep(el.dataset.id);
    confirmBox(`Hapus ${pid(r.id)}?`, 'Laporan dan notifikasinya akan dihapus permanen.', 'Hapus laporan', () => { Ops.remove(r.id); closeModal(); toast(`${pid(r.id)} dihapus.`); render(); });
  },
  withdraw(el) {
    const r = rep(el.dataset.id);
    confirmBox(`Tarik ${pid(r.id)}?`, 'Laporan yang belum diverifikasi akan dibatalkan dan dihapus.', 'Tarik laporan', () => { Ops.remove(r.id); closeModal(); toast('Laporan ditarik.'); render(); });
  },
  csv() {
    const a = filtered();
    if (!a.length) return toast('Tidak ada laporan untuk diekspor. Longgarkan filter terlebih dahulu.', 'bad');
    const head = ['nomor', 'kategori', 'kelompok', 'status', 'urgensi', 'kecamatan', 'alamat', 'pelapor', 'tanggal', 'instansi', 'petugas', 'target', 'hari_selesai', 'keterangan'];
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = a.map(r => [pid(r.id), catById(r.cat).name, GROUPS[catById(r.cat).g], r.status, r.priority, r.kec, r.address, r.reporter, r.date, UNITS[r.unit], r.officerId ? officerById(r.officerId).name : '', r.deadline ? dateStr(r.deadline) : '', r.resolvedAt ? dec(resDays(r)) : '', r.desc].map(q).join(';'));
    const blob = new Blob(['\ufeff' + [head.join(';')].concat(body).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), el = document.createElement('a');
    el.href = url; el.download = `pengaduan-${dateStr(Date.now())}.csv`; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`${a.length} laporan diekspor ke CSV.`);
  },
  async photos(el) {
    const files = [...el.files].slice(0, 3 - V.photos.length);
    if (!files.length) return toast('Maksimal 3 foto.');
    for (const f of files) {
      try { V.photos.push(await compressImage(f)); } catch (e) { toast('Satu berkas tidak bisa dibaca.'); }
    }
    el.value = ''; paintShots();
  },
  rmshot(el) { V.photos.splice(+el.dataset.i, 1); paintShots(); },
  copy(el) { copyText(el.dataset.t); }
};
function paintShots() {
  const b = $('#shots'); if (!b) return;
  b.innerHTML = V.photos.map((p, i) => `<figure><img src="${p}" alt="Pratinjau foto ${i + 1}"><button type="button" class="btn ico sm" data-act="rmshot" data-i="${i}" aria-label="Hapus foto ${i + 1}">${ic('x')}</button></figure>`).join('');
}

/* ---------- formulir: submit ---------- */
const FORMS = {
  track(f) { const q = f.q.value.replace(/\D/g, ''); if (!q) return toast('Masukkan nomor laporan.'); go('lacak/' + q); },
  login(f) {
    const u = DB.d.users.find(x => x.email.toLowerCase() === f.email.value.trim().toLowerCase() && x.password === f.password.value);
    if (!u) return toast('Email atau kata sandi salah. Coba akun demo di bawah.', 'bad');
    setSess(u); toast(`Selamat datang, ${u.name.split(' ')[0]}.`); go(u.role === 'admin' ? 'admin' : 'warga');
  },
  register(f) {
    const email = f.email.value.trim().toLowerCase();
    if (DB.d.users.some(u => u.email.toLowerCase() === email)) return toast('Email sudah terdaftar.', 'bad');
    const u = { id: 'u-' + Date.now(), role: 'citizen', name: f.name.value.trim(), email, password: f.password.value, phone: f.phone.value.trim(), kec: f.kec.value };
    DB.d.users.push(u); DB.save(); setSess(u); toast('Akun dibuat. Selamat datang!'); go('warga');
  },
  quick(f) {
    const t = f.q.value.trim(); if (t.length < 4) return toast('Tuliskan masalahnya lebih lengkap.');
    V.sug = t; V.pt = null; V.photos = []; go('warga/baru');
  },
  new(f) {
    const desc = f.desc.value.trim();
    if (desc.length < 15) return toast('Keterangan minimal 15 karakter.', 'bad');
    const kec = f.kec.value, pt = V.pt;
    const r = Ops.create({
      cat: f.cat.value, kec, address: f.address.value.trim(), desc, priority: f.priority.value, date: f.date.value || dateStr(Date.now()),
      citizenId: U.id, reporter: U.name, photos: V.photos.slice(), lat: pt ? pt[0] : null, lng: pt ? pt[1] : null
    }, U.name);
    if (!r) return toast('Penyimpanan peramban penuh. Kurangi foto lalu coba lagi.', 'bad');
    V.photos = []; V.pt = null; V.sug = '';
    render();
    openModal(`<div class="okbox"><span class="okbox-i">${ic('check')}</span><h2>Pengaduan terkirim</h2>
      <p class="muted">Simpan nomor berikut untuk melacak perkembangan laporan Anda.</p>
      <div class="ticket"><b class="mono">${pid(r.id)}</b><button class="btn sm" data-act="copy" data-t="${pid(r.id)}">${ic('copy')} Salin</button></div>
      ${stepper(r)}
      <dl class="rows"><div><dt>Kategori</dt><dd>${esc(catById(r.cat).name)}</dd></div><div><dt>Instansi penanggung jawab</dt><dd>${esc(UNITS[r.unit])}</dd></div>
      <div><dt>Lokasi</dt><dd>${esc(r.address)}, ${esc(r.kec)}</dd></div></dl>
      <div class="dlg-act"><button class="btn" onclick="closeModal()">Tutup</button><a class="btn pri" href="#/warga/laporan" onclick="closeModal()">Lihat pengaduan saya</a></div></div>`, 'sm');
  },
  profile(f) {
    Object.assign(U, { name: f.name.value.trim(), phone: f.phone.value.trim(), kec: f.kec.value });
    DB.d.reports.filter(r => r.citizenId === U.id).forEach(r => r.reporter = U.name);
    DB.save(); toast('Profil diperbarui.'); render();
  },
  pass(f) {
    if (f.old.value !== U.password) return toast('Kata sandi saat ini salah.', 'bad');
    U.password = f.new.value; DB.save(); toast('Kata sandi diperbarui.'); render();
  },
  admcreate(f) {
    const r = Ops.create({ cat: f.cat.value, kec: f.kec.value, address: f.address.value.trim(), desc: f.desc.value.trim(), priority: f.priority.value, date: f.date.value, reporter: f.reporter.value.trim() || 'Laporan langsung', status: f.status.value }, U.name);
    if (!r) return toast('Gagal menyimpan: penyimpanan peramban penuh.', 'bad');
    closeModal(); toast(`Laporan ${pid(r.id)} dibuat.`); render();
  },
  admedit(f) {
    const id = +f.dataset.id, r = rep(id), st = f.status.value;
    Ops.update(id, { cat: f.cat.value, kec: f.kec.value, address: f.address.value.trim(), desc: f.desc.value.trim(), priority: f.priority.value, date: f.date.value, reporter: f.reporter.value.trim(), unit: catById(f.cat.value).unit }, U.name);
    if (st !== r.status) Ops.status(id, st, U.name, 'Status diperbarui admin.');
    closeModal(); toast(`${pid(id)} diperbarui.`); render();
  },
  assign(f) {
    const id = +f.dataset.id, o = f.officer.value;
    if (!o) return toast('Pilih petugas terlebih dahulu.', 'bad');
    Ops.assign(id, o, endOfDay(parseDate(f.deadline.value)), U.name);
    closeModal(); toast(`${pid(id)} ditugaskan ke ${officerById(o).name}.`); render();
  }
};

/* ---------- Smart Complaint ---------- */
function runSuggest() {
  const t = $('#fdesc'); if (!t) return;
  const box = $('#sugbox'), s = classify(t.value);
  if (!s || s.conf < .25) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `${ic('wand')}<div><b>Saran otomatis</b><p class="sm">Kategori <b>${esc(GROUPS[s.cat.g])} → ${esc(s.cat.name)}</b>, ditangani ${esc(UNITS[s.cat.unit])}${s.kec ? `, lokasi terdeteksi <b>${esc(s.kec)}</b>` : ''}. Tingkat kecocokan ${Math.round(s.conf * 100)}%.</p></div>
    <button type="button" class="btn sm pri" id="sugApply">Terapkan</button>`;
  $('#sugApply').onclick = () => {
    $('#fcat').value = s.cat.id;
    if (s.kec) $('#fkec').value = s.kec;
    $('#fpri').value = s.pri;
    box.hidden = true; toast('Saran diterapkan.');
  };
}

/* ---------- pengikat kejadian ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'file')) return;
  const fn = ACT[t.dataset.act];
  if (!fn) return;
  if (t.tagName === 'BUTTON' && !t.type) t.type = 'button';
  if (t.tagName === 'INPUT' && t.type === 'file') return;
  fn(t, e);
});
document.addEventListener('change', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.tagName === 'SELECT' || (t.tagName === 'INPUT' && (t.type === 'date' || t.type === 'file' || t.type === 'checkbox'))) (ACT[t.dataset.act] || (() => { }))(t, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'fdesc') { clearTimeout(runSuggest._t); runSuggest._t = setTimeout(runSuggest, 300); return; }
  if (t.dataset && t.dataset.act && t.tagName === 'INPUT' && (t.type === 'text' || !t.type)) (ACT[t.dataset.act] || (() => { }))(t, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  (FORMS[f.dataset.form] || (() => { }))(f);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOpen()) closeModal(); });
window.addEventListener('hashchange', () => { closeModal(); render(); });

/* ---------- mulai ---------- */
(function start() {
  try { const t = localStorage.getItem('publikone_theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) { }
  DB.load();
  loadSess();
  render();
  if (location.hash === '' || location.hash === '#') history.replaceState(null, '', '#/');
})();
