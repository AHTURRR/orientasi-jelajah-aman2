# Jelajah Aman ⛅

Aplikasi pemantau cuaca dan kualitas udara (AQI) lintas platform (Android, iOS, Web) berbasis lokasi dengan pendekatan arsitektur **Offline-First**.

Dibuat untuk memenuhi tugas praktikum mata kuliah **Pemrograman Berbasis Platform (INF2528)** - Informatika, UIN K.H. Abdurrahman Wahid Pekalongan.

---

## 📖 Status Data dan Mode Offline

Aplikasi menerapkan sistem caching lokal menggunakan SQLite (`expo-sqlite`) dengan aturan:

1. **`cache-segar`**: Data cuaca dan kualitas udara diambil dari penyimpanan lokal perangkat jika umur cache masih berada di bawah ambang batas kesegaran (`TTL_SEGAR_MS` = 30 menit). Aplikasi tidak perlu memanggil API internet sehingga menghemat kuota dan memuat secara instan.
2. **`cache-basi`**: Data cuaca tersimpan yang umurnya sudah melebihi 30 menit (stale) dan digunakan sebagai cadangan darurat saat jaringan internet mati/offline. Data tetap dapat dibaca oleh pengguna daripada menampilkan layar kosong atau error.
3. **`first-run offline`**: Kondisi ketika pengguna membuka kota tertentu untuk pertama kali dalam keadaan tanpa koneksi internet (atau setelah seluruh cache dihapus). Karena belum ada salinan di SQLite, aplikasi secara transparan menampilkan pesan galat yang informatif dan menyediakan tombol "Coba Lagi".

**Mengapa label status data penting bagi pengguna?**
Label status data (seperti *"Data terbaru dari internet"*, *"Data tersimpan (masih segar)"*, dan *"Mode offline - data tersimpan mungkin sudah usang"*) memberikan transparansi informasi yang jujur kepada pengguna. Hal ini memastikan pengguna mengetahui apakah informasi cuaca yang mereka lihat adalah kondisi terkini (*real-time*) atau data historis terdahulu, sehingga pengguna dapat membuat keputusan aktivitas luar ruangan dengan tepat dan aman.

---

## 🚀 Memulai Aplikasi

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Jalankan aplikasi dengan Expo:
   ```bash
   npx expo start
   ```

3. Buka di platform target:
   - Tekan `w` untuk membuka di browser (Expo Web)
   - Pindai QR Code menggunakan aplikasi **Expo Go** pada perangkat Android/iOS
