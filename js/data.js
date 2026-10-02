'use strict';
/* PUBLIK ONE — data, aturan bisnis, dan penyimpanan (localStorage) */

const DAY = 864e5;
const STATUS = ['Menunggu Verifikasi', 'Diverifikasi', 'Diproses', 'Selesai'];
const SKEY = { 'Menunggu Verifikasi': 'wait', 'Diverifikasi': 'verif', 'Diproses': 'proc', 'Selesai': 'done' };

const UNITS = {
  dishub: 'Dinas Perhubungan', pu: 'Dinas Pekerjaan Umum', dlh: 'Dinas Lingkungan Hidup',
  taman: 'Dinas Pertamanan', dukcapil: 'Disdukcapil', izin: 'DPMPTSP', dinkes: 'Dinas Kesehatan', satpol: 'Satpol PP'
};
const GROUPS = { infra: 'Infrastruktur', bersih: 'Kebersihan & Lingkungan', fasum: 'Fasilitas Umum', layanan: 'Pelayanan Instansi', tertib: 'Ketertiban Umum' };
const CATS = [
  { id: 'pju', g: 'infra', name: 'Penerangan Jalan', unit: 'dishub', w: 15, kw: ['lampu jalan', 'lampu', 'penerangan', 'pju', 'gelap', 'padam'] },
  { id: 'jalan', g: 'infra', name: 'Jalan Rusak', unit: 'pu', w: 20, kw: ['jalan rusak', 'berlubang', 'lubang', 'aspal', 'retak', 'amblas', 'jalan'] },
  { id: 'drainase', g: 'infra', name: 'Drainase & Banjir', unit: 'pu', w: 12, kw: ['banjir', 'genangan', 'tergenang', 'menggenang', 'parit', 'selokan', 'drainase', 'gorong'] },
  { id: 'sampah', g: 'bersih', name: 'Sampah Menumpuk', unit: 'dlh', w: 17, kw: ['sampah', 'tps', 'menumpuk', 'diangkut', 'bau'] },
  { id: 'cemar', g: 'bersih', name: 'Pencemaran', unit: 'dlh', w: 4, kw: ['limbah', 'pencemaran', 'asap', 'polusi', 'tercemar'] },
  { id: 'taman', g: 'fasum', name: 'Taman & Pohon', unit: 'taman', w: 5, kw: ['taman', 'pohon', 'tumbang', 'ranting', 'dahan'] },
  { id: 'fasilitas', g: 'fasum', name: 'Fasilitas Publik Rusak', unit: 'dishub', w: 7, kw: ['halte', 'trotoar', 'rambu', 'lampu lalu lintas', 'traffic light', 'zebra cross', 'toilet umum'] },
  { id: 'adminduk', g: 'layanan', name: 'Administrasi Kependudukan', unit: 'dukcapil', w: 8, kw: ['ktp', 'e-ktp', 'kartu keluarga', 'kk', 'akta', 'domisili', 'dukcapil', 'kependudukan'] },
  { id: 'perizinan', g: 'layanan', name: 'Perizinan', unit: 'izin', w: 3, kw: ['izin', 'perizinan', 'pbg', 'imb', 'nib'] },
  { id: 'kesehatan', g: 'layanan', name: 'Layanan Kesehatan', unit: 'dinkes', w: 4, kw: ['puskesmas', 'rumah sakit', 'bpjs', 'obat', 'dokter', 'pasien', 'posyandu'] },
  { id: 'parkir', g: 'tertib', name: 'Parkir Liar', unit: 'dishub', w: 5, kw: ['parkir', 'juru parkir', 'jukir'] },
  { id: 'ketertiban', g: 'tertib', name: 'Gangguan Ketertiban', unit: 'satpol', w: 5, kw: ['pkl', 'kaki lima', 'pungli', 'preman', 'bising', 'kebisingan', 'balap liar'] }
];
const PRIORITIES = ['Rendah', 'Sedang', 'Tinggi'];
/* Pengali lama penanganan per kategori: perbaikan lampu jalan cepat,
   perizinan dan administrasi butuh waktu lebih panjang. */
const SPD = { pju: .55, jalan: 1.4, drainase: 1.75, sampah: .7, cemar: 1.5, taman: .85, fasilitas: 1.15, adminduk: 2.1, perizinan: 2.6, kesehatan: 1.25, parkir: .65, ketertiban: .9 };
const KEC = [
  ['Medan Belawan', 3.772, 98.692, 2], ['Medan Labuhan', 3.725, 98.692, 3], ['Medan Marelan', 3.705, 98.664, 3],
  ['Medan Deli', 3.665, 98.690, 5], ['Medan Helvetia', 3.615, 98.643, 6], ['Medan Timur', 3.607, 98.688, 5],
  ['Medan Perjuangan', 3.604, 98.706, 4], ['Medan Tembung', 3.594, 98.726, 5], ['Medan Barat', 3.598, 98.668, 4],
  ['Medan Petisah', 3.588, 98.653, 4], ['Medan Sunggal', 3.585, 98.624, 6], ['Medan Baru', 3.572, 98.664, 4],
  ['Medan Maimun', 3.579, 98.682, 2], ['Medan Area', 3.585, 98.703, 5], ['Medan Kota', 3.569, 98.692, 4],
  ['Medan Polonia', 3.558, 98.673, 3], ['Medan Denai', 3.560, 98.716, 5], ['Medan Selayang', 3.550, 98.645, 5],
  ['Medan Johor', 3.530, 98.674, 5], ['Medan Amplas', 3.532, 98.714, 4], ['Medan Tuntungan', 3.505, 98.630, 3]
].map(([name, lat, lng, w]) => ({ name, lat, lng, w }));
const OFFICERS = [
  ['o1', 'Budi Santoso', 'dishub'], ['o2', 'Arif Lubis', 'dishub'], ['o3', 'Rahmat Hidayat', 'pu'], ['o4', 'Dedi Kurniawan', 'pu'],
  ['o5', 'Siti Aminah', 'dlh'], ['o6', 'Nina Marpaung', 'dlh'], ['o7', 'Maya Sari', 'taman'], ['o8', 'Lestari Wulandari', 'dukcapil'],
  ['o9', 'Yusuf Harahap', 'izin'], ['o10', 'Fajar Nugroho', 'dinkes'], ['o11', 'Hendra Gunawan', 'satpol']
].map(([id, name, unit]) => ({ id, name, unit }));

const STREETS = ['Jl. Gatot Subroto', 'Jl. Sisingamangaraja', 'Jl. Setia Budi', 'Jl. Sudirman', 'Jl. Iskandar Muda', 'Jl. Juanda',
  'Jl. Brigjend Katamso', 'Jl. Ring Road', 'Jl. Pancing', 'Jl. AR Hakim', 'Jl. Krakatau', 'Jl. Asia', 'Jl. Thamrin', 'Jl. Gajah Mada',
  'Jl. Kapten Muslim', 'Jl. Marelan Raya', 'Jl. Yos Sudarso', 'Jl. Jamin Ginting', 'Jl. Karya Wisata', 'Jl. Pelita', 'Jl. Sei Batang Hari', 'Jl. Bilal'];
const NAMES = ['Rina', 'Fadli', 'Sri', 'Joko', 'Dewi', 'Rizky', 'Putri', 'Agus', 'Wati', 'Hasan', 'Lina', 'Bayu', 'Tono', 'Yuni', 'Irfan', 'Mega', 'Rudi', 'Ani'];
const DESC = {
  pju: ['Lampu jalan mati sejak beberapa hari, kondisi sangat gelap di malam hari.', 'Beberapa tiang PJU padam, rawan kejahatan dan kecelakaan.', 'Lampu penerangan berkedip dan sering padam.'],
  jalan: ['Aspal berlubang cukup dalam dan membahayakan pengendara motor.', 'Jalan retak dan amblas setelah hujan deras.', 'Lubang besar di tengah jalan, sudah ada pengendara yang jatuh.'],
  drainase: ['Air menggenang setinggi betis setiap hujan turun.', 'Parit tersumbat sampah sehingga air meluap ke jalan.', 'Gorong-gorong rusak dan menyebabkan banjir lokal.'],
  sampah: ['Tumpukan sampah belum diangkut selama seminggu dan menimbulkan bau.', 'TPS penuh, sampah meluber ke badan jalan.', 'Sampah rumah tangga dibuang sembarangan di lahan kosong.'],
  cemar: ['Limbah cair dibuang ke parit, air berwarna hitam dan berbau.', 'Asap pembakaran sampah mengganggu pernapasan warga.'],
  taman: ['Pohon besar miring dan rawan tumbang ke jalan.', 'Taman tidak terawat, rumput tinggi dan bangku rusak.'],
  fasilitas: ['Halte rusak, atap bocor dan bangku patah.', 'Trotoar berlubang dan membahayakan pejalan kaki.', 'Lampu lalu lintas di persimpangan mati.'],
  adminduk: ['Pengurusan KTP elektronik belum selesai lebih dari sebulan.', 'Surat domisili belum terbit setelah dua minggu.'],
  perizinan: ['Permohonan izin usaha belum ada kabar setelah tiga minggu.', 'Status PBG tidak berubah di sistem.'],
  kesehatan: ['Antrean puskesmas sangat lama dan petugas terbatas.', 'Obat di puskesmas sering kosong.'],
  parkir: ['Parkir liar memakan badan jalan dan menyebabkan macet.', 'Juru parkir menarik tarif melebihi ketentuan.'],
  ketertiban: ['Pedagang kaki lima menutup trotoar.', 'Kebisingan dari tempat hiburan hingga larut malam.', 'Ada balap liar setiap malam minggu.']
};
const STATUS_NOTE = {
  'Menunggu Verifikasi': 'Laporan diterima sistem dan mendapat nomor.',
  'Diverifikasi': 'Lokasi dan jenis masalah sudah dikonfirmasi petugas.',
  'Diproses': 'Laporan diteruskan ke instansi terkait.',
  'Selesai': 'Masalah sudah ditangani dan diperiksa di lapangan.'
};

const ADMIN = { id: 'u-admin', role: 'admin', name: 'Admin Kota Medan', email: 'admin@publikone.id', password: 'admin123', phone: '', kec: '' };
const CITIZEN = { id: 'u-warga', role: 'citizen', name: 'Andi Saputra', email: 'warga@publikone.id', password: '123456', phone: '0812-0000-0000', kec: 'Medan Barat' };

const catById = id => CATS.find(c => c.id === id) || CATS[0];
const kecByName = n => KEC.find(k => k.name === n);
const officerById = id => OFFICERS.find(o => o.id === id);
const pad = n => String(n).padStart(2, '0');
const dateStr = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const parseDate = s => new Date(s + 'T00:00:00').getTime();
const endOfDay = ts => { const d = new Date(ts); d.setHours(23, 59, 0, 0); return d.getTime(); };

/* ---------- Smart Complaint: klasifikasi kata kunci ---------- */
const URGENT = ['bahaya', 'membahayakan', 'kecelakaan', 'darurat', 'anak', 'sekolah', 'tumbang', 'korban', 'rawan', 'lansia'];
function classify(text) {
  const t = ' ' + String(text).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') + ' ';
  if (t.trim().length < 3) return null;
  const sc = CATS.map(c => ({ c, s: c.kw.reduce((a, k) => a + (t.includes(' ' + k) ? k.length : 0), 0) })).sort((a, b) => b.s - a.s);
  if (!sc[0].s) return null;
  const kec = KEC.find(k => t.includes(' ' + k.name.toLowerCase() + ' '));
  return {
    cat: sc[0].c,
    conf: sc[0].s / (sc[0].s + sc[1].s + 2),
    kec: kec ? kec.name : null,
    pri: URGENT.some(k => t.includes(' ' + k)) ? 'Tinggi' : 'Sedang'
  };
}

/* ---------- Data awal (deterministik) ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function pushStatus(r, s, at, by, note) {
  r.status = s;
  r.history.push({ s, at, by, note: note || STATUS_NOTE[s] });
  r.resolvedAt = s === 'Selesai' ? at : null;
}
function pushAssign(r, oid, deadline, at, by) {
  const o = officerById(oid);
  r.officerId = oid; r.unit = o.unit; r.deadline = deadline;
  r.history.push({ assign: oid, deadline, at, by });
}

function newReport(id, cat, kec, address, desc, at, rand) {
  const j = () => (rand() - .5) * .014;
  return {
    id, citizenId: null, reporter: '', cat, kec: kec.name, address,
    lat: +(kec.lat + j()).toFixed(5), lng: +(kec.lng + j()).toFixed(5),
    desc, photos: [], date: dateStr(at), createdAt: Math.round(at),
    status: STATUS[0], priority: 'Sedang', unit: catById(cat).unit, officerId: null, deadline: null, resolvedAt: null,
    history: [{ s: STATUS[0], at: Math.round(at), by: 'Sistem', note: STATUS_NOTE[STATUS[0]] }]
  };
}

function buildSeed() {
  const R = rng(20261002), now = Date.now();
  const pick = a => a[Math.floor(R() * a.length)];
  const wpick = (a, w) => { let t = R() * a.reduce((s, x) => s + w(x), 0); for (const x of a) { t -= w(x); if (t < 0) return x; } return a[0]; };
  const tier = pairs => wpick(pairs, p => p[1])[0];
  const advance = (r, k, t, oid, dl) => {
    const s = STATUS[k];
    pushStatus(r, s, Math.round(t), 'Admin Kota Medan', k === 2 ? `Diteruskan ke ${UNITS[r.unit]}.` : null);
    if (k === 2) {
      const pool = OFFICERS.filter(o => o.unit === r.unit);
      pushAssign(r, oid || pick(pool).id, dl || endOfDay(t + (2 + Math.floor(R() * 4)) * DAY), Math.round(t), 'Admin Kota Medan');
    }
  };
  const addrFor = (cat, kec) => cat === 'adminduk' ? `Kantor Camat ${kec.name}` : cat === 'kesehatan' ? `Puskesmas ${kec.name.replace('Medan ', '')}`
    : cat === 'perizinan' ? 'Mal Pelayanan Publik Medan' : `${pick(STREETS)} No. ${1 + Math.floor(R() * 240)}`;

  const d = { v: 4, users: [{ ...ADMIN }, { ...CITIZEN }], reports: [], notifs: [], nseq: 0 };
  const N = 1420, START = 10000, D = 186;
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  const day0 = midnight.getTime() - (D - 1) * DAY;
  /* Volume laporan per hari dibuat tidak rata: ada pola musiman (puncak musim
     hujan), hari Senin lebih tinggi, akhir pekan lebih rendah, plus derau. */
  const wd = [];
  for (let i = 0; i < D; i++) {
    const dow = new Date(day0 + i * DAY).getDay();
    const season = 1 + .45 * Math.sin(i / D * Math.PI * 1.7 + .5);
    const week = dow === 0 ? .42 : dow === 6 ? .66 : dow === 1 ? 1.26 : 1;
    wd.push(Math.max(.05, season * week * (.78 + R() * .44)));
  }
  const WT = wd.reduce((s, x) => s + x, 0);
  const plan = wd.map(x => Math.floor(N * x / WT));
  let left = N - plan.reduce((s, x) => s + x, 0);
  [...wd.keys()].sort((a, b) => wd[b] - wd[a]).forEach(i => { if (left > 0) { plan[i]++; left--; } });
  let seq = 0;
  for (let i = 0; i < D; i++) {
    for (let k = 0; k < plan[i]; k++) {
      let created = day0 + i * DAY + (6.5 + R() * 14.5) * 36e5;
      if (created > now - 12e5) created = now - R() * 54e5;
      const age = (now - created) / DAY;
      const cat = wpick(CATS, c => c.w), kec = wpick(KEC, k => k.w);
      const r = newReport(START + seq++, cat.id, kec, addrFor(cat.id, kec), pick(DESC[cat.id]), created, R);
      r.reporter = `${pick(NAMES)} ${pick('ABDHKLMNRSTW'.split(''))}.`;
      r.priority = R() < .2 ? 'Tinggi' : R() < .75 ? 'Sedang' : 'Rendah';
      /* Semakin lama laporan masuk, semakin besar peluang sudah selesai.
         Sisa kecil yang belum selesai menjadi tunggakan yang wajar. */
      const target = age > 40 ? (R() < .993 ? 3 : 2)
        : age > 14 ? (R() < .96 ? 3 : 2)
          : age > 5 ? tier([[3, 55], [2, 27], [1, 10], [0, 8]])
            : tier([[3, 10], [2, 30], [1, 26], [0, 34]]);
      const f = SPD[cat.id] || 1;
      const gaps = [[.08, 1.2], [.2, 1.6], [.4 * f, 5.2 * f]];
      let t = created;
      for (let j = 1; j <= target; j++) {
        const [a, b] = gaps[j - 1], nt = t + (a + R() * (b - a)) * DAY;
        if (nt > now - .03 * DAY) break;
        t = nt; advance(r, j, t);
      }
      d.reports.push(r);
    }
  }
  // Laporan milik akun warga demo
  const mine = (id, cat, kecName, address, desc, ago, pri, oid, dlDays) => {
    const kec = kecByName(kecName);
    const r = newReport(id, cat, kec, address, desc, now - ago[0] * DAY, R);
    r.citizenId = CITIZEN.id; r.reporter = CITIZEN.name; r.priority = pri;
    for (let k = 1; k < ago.length; k++) advance(r, k, now - ago[k] * DAY, oid, dlDays != null ? endOfDay(now + dlDays * DAY) : null);
    d.reports[d.reports.findIndex(x => x.id === id)] = r;
  };
  mine(10482, 'pju', 'Medan Barat', 'Jl. Merdeka No. 10', 'Lampu jalan sudah mati selama 3 hari. Malam hari sangat gelap dan rawan kecelakaan.', [3, 2.6, 2], 'Tinggi', 'o1', 2);
  mine(10481, 'jalan', 'Medan Sunggal', 'Jl. Gatot Subroto No. 221', 'Aspal berlubang dan membahayakan pengendara.', [6, 5.7, 5, 1.2], 'Tinggi', 'o3');
  mine(10480, 'sampah', 'Medan Polonia', 'Jl. Sudirman No. 5', 'Tumpukan sampah belum diangkut selama lima hari.', [2, 1.5], 'Sedang');
  mine(10466, 'drainase', 'Medan Petisah', 'Jl. Gajah Mada No. 30', 'Parit tersumbat, air meluap ke jalan setiap hujan.', [12, 11.5, 10.8, 8], 'Sedang', 'o4');
  mine(10431, 'adminduk', 'Medan Barat', 'Kantor Camat Medan Barat', 'Surat domisili belum terbit setelah dua minggu.', [24, 23.6, 23, 20], 'Rendah', 'o8');

  d.reports.filter(r => r.citizenId).forEach(r => r.history.forEach(ev => {
    const n = notifText(r, ev);
    if (n) d.notifs.push({ id: ++d.nseq, userId: r.citizenId, reportId: r.id, ...n, at: ev.at, read: now - ev.at > 2.2 * DAY });
  }));
  d.notifs.sort((a, b) => b.at - a.at);
  return d;
}

function notifText(r, ev) {
  const id = '#PUB-' + r.id;
  if (ev.assign) { const o = officerById(ev.assign); return { kind: 'assign', text: `Petugas ${o.name} (${UNITS[o.unit]}) telah ditugaskan untuk menangani pengaduan ${id}.` }; }
  if (ev.s === 'Menunggu Verifikasi') return { kind: 'new', text: `Pengaduan ${id} diterima dan sedang menunggu verifikasi.` };
  if (ev.s === 'Diverifikasi') return { kind: 'status', text: `Pengaduan ${id} telah diverifikasi.` };
  if (ev.s === 'Diproses') return { kind: 'status', text: `Pengaduan ${id} sedang diproses oleh ${UNITS[r.unit]}.` };
  if (ev.s === 'Selesai') return { kind: 'done', text: `Pengaduan ${id} telah selesai ditangani.` };
  return null;
}

/* ---------- Penyimpanan ---------- */
const DB_KEY = 'publikone_v4';
const DB = {
  d: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { d = null; }
    if (!d || d.v !== 4) { this.d = buildSeed(); this.save(); } else this.d = d;
    return this.d;
  },
  save() { try { localStorage.setItem(DB_KEY, JSON.stringify(this.d)); return true; } catch (e) { return false; } },
  reset() { localStorage.removeItem(DB_KEY); this.load(); }
};

const rep = id => DB.d.reports.find(r => r.id === +id);
const userById = id => DB.d.users.find(u => u.id === id);

function notify(r, ev) {
  if (!r.citizenId || !userById(r.citizenId)) return;
  const n = notifText(r, ev);
  if (!n) return;
  DB.d.nseq = (DB.d.nseq || 0) + 1;
  DB.d.notifs.unshift({ id: DB.d.nseq, userId: r.citizenId, reportId: r.id, ...n, at: ev.at, read: false });
}

const Ops = {
  create(x, by) {
    const now = Date.now(), kec = kecByName(x.kec);
    const id = Math.max(10000, ...DB.d.reports.map(r => r.id)) + 1;
    const r = newReport(id, x.cat, kec, x.address, x.desc, now, Math.random);
    if (x.lat != null) { r.lat = x.lat; r.lng = x.lng; }
    Object.assign(r, { citizenId: x.citizenId || null, reporter: x.reporter || 'Laporan langsung', photos: x.photos || [], date: x.date || dateStr(now), priority: x.priority || 'Sedang' });
    r.history[0].by = by;
    DB.d.reports.push(r);
    const before = DB.d.notifs.length;
    notify(r, r.history[0]);
    if (x.status && x.status !== STATUS[0]) pushStatus(r, x.status, now, by, 'Status awal ditetapkan admin.');
    if (!DB.save()) { DB.d.reports.pop(); DB.d.notifs.splice(0, DB.d.notifs.length - before); return null; }
    return r;
  },
  update(id, patch, by) {
    const r = rep(id);
    if (patch.kec && patch.kec !== r.kec) { const k = kecByName(patch.kec); r.lat = k.lat; r.lng = k.lng; }
    Object.assign(r, patch);
    r.history.push({ edit: true, at: Date.now(), by, note: 'Data laporan diperbarui.' });
    DB.save(); return r;
  },
  status(id, s, by, note) {
    const r = rep(id);
    if (!r || r.status === s) return r;
    pushStatus(r, s, Date.now(), by, note);
    notify(r, r.history[r.history.length - 1]);
    DB.save(); return r;
  },
  assign(id, oid, deadline, by) {
    const r = rep(id), now = Date.now(), o = officerById(oid);
    r.unit = o.unit;
    if (STATUS.indexOf(r.status) < 2) { pushStatus(r, 'Diproses', now, by, `Diteruskan ke ${UNITS[o.unit]}.`); notify(r, r.history[r.history.length - 1]); }
    pushAssign(r, oid, deadline, now, by);
    notify(r, r.history[r.history.length - 1]);
    DB.save(); return r;
  },
  remove(id) {
    DB.d.reports = DB.d.reports.filter(r => r.id !== +id);
    DB.d.notifs = DB.d.notifs.filter(n => n.reportId !== +id);
    DB.save();
  }
};

/* ---------- Statistik ---------- */
const cnt = (a, s) => a.filter(r => r.status === s).length;
const isActive = r => r.status === 'Diverifikasi' || r.status === 'Diproses';
const resDays = r => r.resolvedAt ? (r.resolvedAt - r.createdAt) / DAY : null;
function avgRes(a) { const d = a.map(resDays).filter(x => x != null); return d.length ? d.reduce((s, x) => s + x, 0) / d.length : 0; }
const isOverdue = r => r.deadline && r.status !== 'Selesai' && r.deadline < Date.now();
