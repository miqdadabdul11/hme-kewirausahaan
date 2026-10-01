# Changelog Fixes

## 2026-10-01

- Perbaiki path CSS module di halaman admin yang berada di route group `(protected)`, agar build Next.js berhasil di lingkungan produksi dan development.
- Hapus nilai default hardcoded credential di halaman login admin agar tidak menyimpan password sampel di UI.
- Tambahkan CLI `npm run create-admin` untuk membuat atau memperbarui akun admin pertama dari environment variable tanpa menaruh secret di source code.
- Dokumentasikan setup dan alur admin di README Indonesia untuk memudahkan onboarding proyek.
- Jaga business logic agar penjualan tidak dibuka secara aktif tanpa Open Order yang valid; semua pemeriksaan penting tetap dilakukan di server-side.
