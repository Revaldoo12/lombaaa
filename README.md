# PUBLIK ONE

Prototipe kanal pengaduan layanan publik Kota Medan. Situs statis, tanpa proses build dan tanpa dependensi dari internet.

```
index.html      struktur halaman + pemuat skrip
style.css       seluruh tampilan (token warna, tata letak, mode gelap, cetak)
js/data.js      model data, aturan status, penyimpanan localStorage, data contoh
js/ui.js        helper tampilan: format, ikon, modal, grafik, peta SVG Kota Medan
js/app.js       rute halaman, semua layar warga/admin/publik, aksi
tests/          skrip uji fungsi di peramban (opsional)
```

## Menjalankan secara lokal

Perlu lewat server HTTP, bukan `file://`, karena halaman memuat beberapa berkas JS.

```bash
cd publik-one
python3 -m http.server 8000
# buka http://localhost:8000
```

## Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Warga | `warga@publikone.id` | `123456` |
| Admin | `admin@publikone.id` | `admin123` |

Pendaftaran akun warga baru juga berfungsi (`#/daftar`).

## Fitur

**Warga** — login/daftar/logout, dasbor ringkasan, buat pengaduan (kategori, kecamatan, alamat, tanggal, urgensi, titik peta, foto bukti), nomor laporan `PUB-xxxxx`, daftar pengaduan dengan filter status dan pencarian, rincian + garis waktu penanganan, notifikasi status, tarik laporan yang belum diverifikasi, profil dan ganti kata sandi.

**Admin** — dasbor KPI dan tren, antrean "perlu tindakan" (tunggakan lebih dulu), CRUD penuh atas laporan, ubah status berurutan, penugasan petugas + instansi + target selesai, pencarian dan filter gabungan (status, kategori, kecamatan, rentang tanggal, pengurutan), pilih massal untuk ubah status/hapus, halaman statistik, beban kerja petugas, ekspor CSV sesuai filter aktif.

**Publik, tanpa login** — ringkasan langsung, alur penanganan, tren laporan, lacak laporan lewat nomor, halaman transparansi (status, kategori, kecamatan, waktu penyelesaian), peta sebaran dengan pewarnaan beban per kecamatan.

**Lainnya** — saran kategori otomatis dari teks keluhan (pencocokan kata kunci di `classify()`), peta SVG 21 kecamatan Medan yang dapat digeser dan di-zoom tanpa pustaka luar, mode terang/gelap, responsif dari 360px sampai layar lebar.

## Verifikasi

`tests/ui-test.js` menjalankan 80 pemeriksaan di Chromium headless: seluruh alur warga dan admin, CRUD, filter, ekspor CSV, penjagaan rute, dan pemeriksaan tidak ada geser horizontal pada 390px, 820px, serta 1340px.

```bash
npm i playwright-core
node tests/ui-test.js      # CHROME_PATH=... bila perlu menunjuk peramban
```

## Menayangkan

Unggah seluruh folder (bukan hanya `index.html`).

- **Netlify Drop** — buka <https://app.netlify.com/drop>, seret folder `publik-one`.
- **GitHub Pages** — push folder ini, lalu Settings → Pages → Source → GitHub Actions.
- **Vercel / Cloudflare Pages** — impor repositori, framework *Other*, build command dikosongkan, output directory `.`.

## Batasan yang perlu diketahui

1. **Data tersimpan di peramban masing-masing pengunjung** (`localStorage`, kunci `publikone_v4`). Laporan dari satu orang tidak terlihat oleh orang lain atau oleh admin di perangkat berbeda. Untuk dipakai sungguhan, dibutuhkan backend dan basis data.
2. **Login tidak aman.** Kata sandi tersimpan apa adanya di sisi peramban dan hanya dicocokkan di JavaScript. Cukup untuk demo, tidak untuk produksi.
3. **Data awal adalah data contoh** (1.420 laporan tersebar atas 186 hari dengan pola musiman). Semua angka di dasbor dan halaman transparansi dihitung dari data itu, bukan angka yang ditulis manual.
4. **Peta memakai batas kecamatan pendekatan** yang dibangun dari titik pusat 21 kecamatan, bukan data batas wilayah resmi. Cukup untuk menunjukkan sebaran, bukan untuk pengukuran.
5. Foto bukti dikecilkan di peramban lalu disimpan sebagai data URL; kuota `localStorage` membatasi jumlahnya (maksimal 3 foto per laporan).
