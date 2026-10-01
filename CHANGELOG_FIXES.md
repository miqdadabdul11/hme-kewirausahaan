# Changelog Fixes

## 2026-10-01

- Perbaiki path CSS module di halaman admin yang berada di route group `(protected)`, agar build Next.js berhasil di lingkungan produksi dan development.
- Hapus nilai default hardcoded credential di halaman login admin agar tidak menyimpan password sampel di UI.
- Arahkan logo navbar, admin, halaman login, favicon, dan metadata ke aset yang benar (`public/logo-hme.png`).
- Ubah alur pembelian dari detail produk agar memilih jumlah lalu menambahkan produk ke keranjang sebelum checkout; sinkronkan cart di navbar, halaman keranjang, dan checkout dengan hydration yang konsisten.
- Ganti identitas kampus menjadi HME FPTI UPI dan gunakan nama file logo konsisten.
- Tambahkan placeholder produk lokal agar katalog demo tidak menampilkan gambar rusak saat produk belum memiliki foto.
- Hubungkan varian produk yang dikelola admin ke pilihan pembeli, harga/stok varian di server, snapshot item order, dan stok katalog.
- Lindungi API baca/tulis produk admin dengan sesi admin di server dan validasi satu atau lebih varian pada penyimpanan.
- Atasi login admin gagal karena hash bcrypt yang tersimpan berisi backslash escape dari `.env`, dan tambahkan CLI reset password interaktif yang menyimpan hash bcryptjs valid langsung ke tabel user.
- Normalisasi SKU varian opsional yang diisi `-` menjadi kosong, validasi SKU ganda dalam satu produk, dan tampilkan pesan aman untuk constraint SKU/slug dan relasi Open Order saat penyimpanan gagal.
- Beri pesan spesifik saat varian edit sudah kedaluwarsa; sertakan kode korelasi dan diagnostik aman di log server untuk kegagalan tak terduga agar error produksi tidak tertutup pesan umum.
- Atasi timeout transaksi simpan produk dengan membuat varian baru secara batch, mengurangi query relasi yang tidak perlu, dan menaikkan timeout interaktif menjadi 15 detik.
- Tampilkan varian yang dipilih pada daftar/detail pesanan admin dan tracking; gunakan kolom `OrderItem.variantName` yang telah menyimpan nama varian agar mudah ditemukan di Supabase.
- Tampilkan produk berstatus `COMING_SOON` di beranda dan katalog dengan penanda serta halaman detail tanpa opsi pemesanan.
- Tambahkan tautan Admin pada navigasi mobile, gunakan logo HME transparan yang dipotong rapat, tampilkan tenggat Open Order dalam WIB, dan rapikan tipografi hero.
- Hapus hash password fallback yang tertanam di source/seed; admin dibuat atau direset melalui CLI, dan hash seed divalidasi sebelum dipakai.
- Tambahkan CLI `npm run create-admin` untuk membuat atau memperbarui akun admin pertama dari environment variable tanpa menaruh secret di source code.
- Dokumentasikan setup dan alur admin di README Indonesia untuk memudahkan onboarding proyek.
- Jaga business logic agar penjualan tidak dibuka secara aktif tanpa Open Order yang valid; semua pemeriksaan penting tetap dilakukan di server-side.
