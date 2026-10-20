# Laporan Praktikum Pertemuan 7

## SQLite, Cache, dan Mode Offline

**Nama:** Ahmad Turmudi  
**NIM:** 60324069  
**Nama proyek:** Jelajah Aman  
**Mata Kuliah:** Pemrograman Berbasis Platform (INF2528)  
**Program Studi:** Informatika Fakultas Sains dan Teknologi  
**Institusi:** UIN K.H. Abdurrahman Wahid Pekalongan  
**Dosen Pengampu:** Reza Iqbal Pramudya, M.Kom  
**Platform pengujian:** Expo Go (Android/iOS) & Expo Web  
**Tanggal pengujian:** 20 Oktober 2026  
**Commit audit MVP (Tag):** `mvp-uts` (`8575ae2`)  
**Commit latihan mandiri:** `59e3da4`

---

## 1. Tujuan Praktikum

Praktikum Pertemuan 7 bertujuan untuk:

1. Mengintegrasikan pustaka `expo-sqlite` ke dalam arsitektur aplikasi mobile berbasis React Native.
2. Menerapkan manajemen skema database lokal berbasis nomor versi menggunakan `PRAGMA user_version`.
3. Mengembangkan pola repositori data (*repository pattern*) berbasis SQL dengan *placeholder* query terproteksi dari *SQL injection*.
4. Mengimplementasikan arsitektur data **Offline-First** dengan aturan *Time-To-Live* (TTL) 30 menit dan *cache invalidation* otomatis (7 hari).
5. Memberikan transparansi status data kepada pengguna melalui indikator sumber data (`jaringan`, `cache-segar`, `cache-basi`) beserta umur timestamp penyimpanan.
6. Menyediakan fitur *invalidation* manual untuk mengosongkan seluruh *cache* cuaca pada Tab Pengaturan.
7. Menyelesaikan latihan mandiri migrasi database ke versi 2 (penambahan kolom `jumlah_dibuka`) tanpa kehilangan data pengguna lama.
8. Melakukan audit kesiapan *Minimum Viable Product* (MVP) menjelang Ujian Tengah Semester (UTS) Pertemuan 8.

---

## 2. Implementasi Teknis

### 2.1 Database SQLite dan Migrasi Skema
Implementasi berada pada berkas [`src/db/database.ts`](./src/db/database.ts).

* Database diinisialisasi melalui `SQLite.openDatabaseAsync("jelajah-aman.db")`.
* Penggunaan pola *singleton* (`dbPromise`) memastikan pembukaan koneksi dan eksekusi migrasi hanya dijalankan satu kali selama siklus hidup aplikasi.
* Migrasi skema diperiksa melalui `PRAGMA user_version`:
  * **Versi 1:** Mengaktifkan mode `PRAGMA journal_mode = 'wal'` dan membuat tabel `cache_cuaca` yang berisi kolom `kunci` (PRIMARY KEY berbasis koordinat `lat,lon` berpresisi 2 desimal), `kota_id`, `nama_kota`, `latitude`, `longitude`, `cuaca_json`, `aqi_json`, dan `disimpan_pada`.
  * **Versi 2 (Latihan Mandiri):** Menambahkan kolom `jumlah_dibuka INTEGER NOT NULL DEFAULT 0` via `ALTER TABLE` tanpa merusak data pengguna yang telah tersimpan.

```ts
// Migrasi versi 1 dan 2 pada src/db/database.ts
if (versiSaatIni < 1) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS cache_cuaca (
      kunci TEXT PRIMARY KEY NOT NULL,
      kota_id INTEGER NOT NULL,
      nama_kota TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      cuaca_json TEXT NOT NULL,
      aqi_json TEXT NOT NULL,
      disimpan_pada INTEGER NOT NULL
    );
  `);
  versiSaatIni = 1;
}

if (versiSaatIni < 2) {
  await db.execAsync(
    "ALTER TABLE cache_cuaca ADD COLUMN jumlah_dibuka INTEGER NOT NULL DEFAULT 0;"
  );
  versiSaatIni = 2;
}
```

### 2.2 Cache Repository (SQL Layer)
Implementasi berada pada berkas [`src/services/cacheRepository.ts`](./src/services/cacheRepository.ts).

* Seluruh kueri interaksi basis data dibungkus dalam fungsi repositori berbahasa Indonesia: `simpanCache()`, `ambilCache()`, `daftarKotaTersimpan()`, `bersihkanCacheLama()`, dan `hapusSemuaCache()`.
* Keamanan SQL dijamin dengan selalu menggunakan tanda tanya (`?`) sebagai parameter *placeholder* terpisah (mencegah *SQL injection*).
* Kunci cache dibentuk melalui `buatKunci(latitude, longitude)` yang membulatkan koordinat menjadi 2 angka di belakang koma (~1,1 km), sehingga variasi pergeseran GPS perangkat tidak memicu duplikasi cache lokasi yang sama.

### 2.3 Repository Offline-First dengan TTL
Implementasi berada pada berkas [`src/services/cuacaRepository.ts`](./src/services/cuacaRepository.ts).

Fungsi utama `ambilCuacaOfflineFirst()` menerapkan 5 kondisi logika *source of truth*:
1. **Cache Segar (< 30 menit):** Jika data lokal ditemukan dan belum melewati batas `TTL_SEGAR_MS` (30 menit) serta opsi `paksaPerbarui` bernilai `false`, data lokal langsung dikembalikan dengan status `cache-segar` tanpa memanggil internet.
2. **Pembaruan Jaringan:** Jika cache kedaluwarsa atau tombol "Perbarui Sekarang" ditekan, pemanggilan data cuaca dan kualitas udara dieksekusi bersamaan via `Promise.all()`.
3. **Cache Basi (Stale Fallback):** Jika panggilan internet gagal (misalnya perangkat berada dalam mode pesawat), data lokal lama tetap ditampilkan dengan status `cache-basi`.
4. **First-run Offline:** Jika internet mati dan belum ada data tersimpan di SQLite, aplikasi melemparkan *error* yang ramah dan terarah.
5. **Penyimpanan Asinkron:** Hasil unduhan baru segera disimpan/diperbarui ke tabel SQLite menggunakan `INSERT OR REPLACE`.

### 2.4 Indikator Status Data
Implementasi berada pada berkas [`src/components/StatusData.tsx`](./src/components/StatusData.tsx).

* Menampilkan status visual yang transparan kepada pengguna:
  * Warna hijau toska (`#EAFBF6`) untuk data segar (`jaringan` atau `cache-segar`).
  * Warna oranye peringatan (`#FEF3E2`) untuk data lama (`cache-basi`) agar pengguna waspada terhadap data cuaca lampau.
* Menampilkan umur data yang dihitung dari timestamp `disimpan_pada` (*baru saja*, *X menit lalu*, atau *X jam lalu*).
* Dilengkapi atribut `accessibilityLabel` untuk pembaca layar (*screen reader*).

### 2.5 Integrasi Beranda & Tab Pengaturan
* **Beranda ([`src/app/(tabs)/index.tsx`](./src/app/(tabs)/index.tsx)):** Menampilkan daftar "Tersimpan di perangkat (bisa dibuka offline)" yang diambil langsung dari SQLite saat aplikasi dibuka, menyematkan kartu status data, tombol "Perbarui Sekarang", serta tombol "Tambahkan ke Favorit".
* **Tab Pengaturan ([`src/app/(tabs)/pengaturan.tsx`](./src/app/(tabs)/pengaturan.tsx)):** Menyediakan tombol "Hapus Data Cuaca Tersimpan" untuk menjalankan *invalidation* manual melalui fungsi `hapusSemuaCache()`.

---

## 3. Hasil Pengujian Tahap 9 (Online – Offline – Online)

Pengujian skenario *offline-first* dilakukan secara berurutan sesuai panduan Tahap 9 modul praktikum:

| No. | Skenario Pengujian | Langkah & Kondisi | Hasil yang Diharapkan | Hasil Nyata | Status |
|:---:|:---|:---|:---|:---|:---:|
| 1 | **Online Data Pertama** | Koneksi aktif, cari kota "Pekalongan" | Muncul label hijau *"Data terbaru dari internet"*, kota masuk ke daftar tersimpan | Berhasil tampil data cuaca & AQI lengkap, label hijau aktif, kota masuk daftar SQLite | **LULUS** |
| 2 | **Online Data Segar** | Ketuk kembali kota "Pekalongan" dari daftar tersimpan (< 30 menit) | Muncul label *"Data tersimpan (masih segar)"*, panggilan API dilewati | Berhasil memuat instan dari SQLite dengan label *"Data tersimpan (masih segar)"* | **LULUS** |
| 3 | **Offline Cache Segar** | Aktifkan mode pesawat, ketuk kota dari daftar tersimpan | Data tetap tampil utuh dari SQLite dengan label *"masih segar"* | Berhasil dibuka tanpa internet dan data tetap tersaji | **LULUS** |
| 4 | **Offline Cache Usang** | Masih offline, tekan tombol *"Perbarui Sekarang"* | Data tetap tampil, label berubah oranye *"Mode offline - data tersimpan mungkin sudah usang"*, tidak crash | Berhasil fallback ke *cache-basi* dengan badge oranye, aplikasi tetap stabil | **LULUS** |
| 5 | **Offline First-Run** | Tab Pengaturan -> *"Hapus Data Cuaca Tersimpan"*, kembali ke Beranda & tekan *"Perbarui Sekarang"* | Pesan error informatif *"Belum ada data tersimpan..."* + tombol *"Coba Lagi"* | Pesan error tertata rapi tanpa force close / crash aplikasi | **LULUS** |
| 6 | **Kembali Online** | Matikan mode pesawat, tekan tombol *"Coba Lagi"* | Data cuaca terbaru berhasil diunduh dari internet, label kembali hijau | Berhasil terhubung kembali ke Open-Meteo API dan memperbarui cache | **LULUS** |
| 7 | **Uji Persistensi** | Tutup total aplikasi (kill task), buka kembali aplikasi | Daftar *"Tersimpan di perangkat"* tetap memuat kota terdahulu | Seluruh kota tersimpan di SQLite tetap bertahan utuh | **LULUS** |

---

## 4. Dokumentasi Tangkapan Layar Pengujian

Berikut adalah dokumentasi tangkapan layar antarmuka hasil implementasi dan pengujian fitur:

### 4.1 Beranda Awal dan Daftar Tersimpan
Tampilan halaman Beranda yang memuat kotak pencarian, tombol lokasi, serta daftar kota yang telah tersimpan di SQLite yang siap dibuka dalam mode *offline*.

![Beranda dan Daftar Tersimpan](./docs/screenshots/01-beranda.png)

### 4.2 Informasi Cuaca, Kualitas Udara, dan Status Data
Tampilan setelah memilih kota: menyajikan kartu cuaca (`WeatherCard`), indikator status data (`StatusData`), informasi angin & rentang suhu harian, serta tombol aksi *"Perbarui Sekarang"* dan *"Tambahkan ke Favorit"*.

![Cuaca, AQI, dan Status Data](./docs/screenshots/02-cuaca-dan-favorit.png)

### 4.3 Modal Tambah Favorit
Modal yang menerima parameter kota dari dynamic route dan menyimpannya secara persisten ke dalam `AsyncStorage`.

![Modal Tambah Favorit](./docs/screenshots/03-modal-tambah-favorit.png)

### 4.4 Tab Riwayat Favorit
Daftar kota favorit yang tersimpan di perangkat, dilengkapi jumlah total tersimpan dan fitur konfirmasi hapus data.

![Tab Riwayat Favorit](./docs/screenshots/04-riwayat-favorit.png)

### 4.5 Fallback Penolakan Izin Lokasi
Penanganan kondisi izin lokasi yang ditolak (`denied`) dengan pesan peringatan yang ramah dan tetap mempertahankan fungsionalitas pencarian kota manual.

![Penanganan Izin Lokasi](./docs/screenshots/05-permission-ditolak.png)

---

## 5. Validasi Teknis dan Audit Kesiapan MVP (Pertemuan 8)

Sesuai daftar periksa (*checklist*) Tahap 10 pada modul praktikum:

### 5.1 Pemeriksaan Kode & Tipe (TypeScript)
Perintah pemeriksaan tipe dijalankan tanpa galat:
```bash
npx tsc --noEmit
# Exit code: 0 (Bersih tanpa error tipe baru)
```

### 5.2 Pemeriksaan Build Export Web
Pustaka `metro.config.js` telah dikonfigurasi dengan `config.resolver.assetExts.push('wasm')` sehingga modul WebAssembly `wa-sqlite` berhasil diekspor tanpa kendala:
```bash
npx expo export --platform web
# Result: Exported static web bundles to dist/ successfully (Exit code: 0)
```

### 5.3 Riwayat Commit dan Tag Git
Riwayat commit telah disusun bertahap, bermakna, dan disinkronkan ke remote GitHub:
```text
59e3da4 feat: tambah migrasi v2 dan dokumentasi status data
8575ae2 (tag: mvp-uts) feat: tambah tombol hapus data cuaca tersimpan
4ecbc6a feat: integrasikan cache offline-first dan status data ke Beranda
49b418c feat: tambah komponen indikator status data
5e63be2 feat: buat repository offline-first dengan TTL 30 menit
bd7a53b feat: buat cache repository untuk SQLite
68d354c feat: tambah tipe data untuk cache dan sumber data
0f0dc11 feat: pasang expo-sqlite dan buat database dengan migrasi
e11005b docs: perbaiki identitas nama dan format laporan praktikum pertemuan 6
71a75f8 docs: sediakan laporan praktikum dalam format Word
f6230e6 docs: tambahkan laporan praktikum pertemuan 6
56de3c6 feat: selesaikan integrasi lokasi dan favorit
```

---

## 6. Latihan Mandiri (Tahap 11)

1. **Migrasi Database Versi 2:**
   Telah diimplementasikan pada [`src/db/database.ts`](./src/db/database.ts) dengan menaikkan `VERSI_DATABASE = 2` dan menyisipkan `ALTER TABLE cache_cuaca ADD COLUMN jumlah_dibuka INTEGER NOT NULL DEFAULT 0`. Data cache lama pengguna tetap aman tanpa kehilangan baris data.
2. **Dokumentasi pada README.md:**
   Berkas [`README.md`](./README.md) repositori telah diperbarui dengan penjelasan mengenai perbedaan `cache-segar`, `cache-basi`, dan `first-run offline`, serta alasan pentingnya label status data bagi pengguna.

---

## 7. Kesimpulan

Seluruh tahapan tugas dan praktikum Pertemuan 7 pada aplikasi **Jelajah Aman** telah berhasil diselesaikan dengan baik. Aplikasi kini memiliki kemampuan *offline-first* yang tangguh memanfaatkan SQLite untuk caching data terstruktur, AsyncStorage untuk preferensi kota favorit, serta antarmuka yang transparan mengenai status kebaruan data. Proyek berada dalam kondisi stabil, bersih dari error tipe TypeScript, dan siap untuk tahap evaluasi MVP pada Ujian Tengah Semester (UTS) Pertemuan 8.
