# HME Kewirausahaan

Website resmi Sub Kewirausahaan HME yang memfasilitasi katalog produk, Open Order, checkout, tracking pesanan, serta panel admin untuk mengelola produk dan pesanan.

## Audit cepat dan asumsi

- Aplikasi ini adalah platform penjualan berbasis periode, bukan marketplace yang selalu aktif. Penjualan hanya dibuka saat ada Open Order aktif.
- Semua keputusan penting seperti status toko, validasi kuota, stok, dan validasi pembayaran harus ditentukan di server agar pengguna tidak bisa memanipulasi data dari client.
- Database menjadi sumber kebenaran utama; UI hanya menampilkan data yang di-izinkan.
- Role admin dibatasi ke server-side supaya hanya akun yang valid dapat masuk ke `/admin/*`.

## Struktur folder

- `src/app` — halaman aplikasi, route API, dan layout Next.js.
- `src/components` — komponen UI bersama seperti navbar, sidebar admin, dan tombol.
- `src/lib` — helper domain seperti `auth`, `catalog`, dan Prisma client.
- `prisma` — schema Prisma dan seed proyek.
- `scripts` — CLI operasional seperti `create-admin`.

## Persyaratan

- Node.js 20.12+
- PostgreSQL
- npm

## Setup lingkungan

1. Salin file `.env.example` menjadi `.env`.
2. Isi variabel database dan secret:

```bash
cp .env.example .env
```

Contoh isi `.env` yang valid:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hme_kewirausahaan?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hme_kewirausahaan?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ganti-dengan-string-rahasia-yang-panjang"
ADMIN_EMAIL="admin@hme.ac.id"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
```

Catatan:
- `ADMIN_PASSWORD` dipakai saat membuat atau mereset admin lewat CLI; simpan hanya di `.env` lokal, jangan di-commit.
- Untuk deployment di Vercel, simpan variabel tersebut di environment variables project.

## Migrasi database

```bash
npx prisma migrate dev --name init
```

Jika belum ada migration local, jalankan:

```bash
npx prisma db push
```

## Seed data

```bash
npx prisma db seed
```

Seed menyiapkan sample Open Order dan produk demo. Untuk membuat atau mereset akun admin, jalankan `npm run create-admin`; seed tidak membuat password default.

## Membuat admin pertama

```bash
npm run create-admin
```

Jika password ingin di-override dari CLI:

```bash
ADMIN_PASSWORD="password-baru" npm run create-admin
```

Atau:

```bash
npm run create-admin -- "password-baru"
```

Untuk mereset password akun admin dari terminal dengan input password tersembunyi:

```bash
npm run reset-admin-password
```

CLI meminta email (Enter memakai `ADMIN_EMAIL`) dan meminta password baru dua kali tanpa menampilkannya; password di-hash menggunakan bcryptjs lalu disimpan ke tabel user.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka URL berikut di browser:

- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Build untuk production

```bash
npm run build
npm run start
```

## Operasional admin

1. Login ke halaman admin dengan email yang dibuat via CLI.
2. Kelola Open Order, produk, dan status pesanan dari sidebar.
3. Di halaman Produk, tambahkan pilihan varian seperti `Ukuran M · Model Oversize`; setiap pilihan dapat memiliki SKU, harga khusus, dan stoknya sendiri.
4. Pembeli memilih varian dan jumlah pada halaman detail, lalu menambahkannya ke keranjang sebelum checkout.
5. Gunakan halaman produk untuk mengatur stok ready stock per varian, target pre-order, foto, kategori, deskripsi, dan status.
6. Pastikan setiap perubahan status pesanan dilakukan secara konsisten dengan aturan order dan payment yang berlaku di aplikasi.

## Deploy ke Vercel

1. Siapkan repository Git.
2. Hubungkan project ke Vercel.
3. Tambahkan semua environment variables dari `.env` ke project settings.
4. Deploy dengan PostgreSQL production dan jalankan migrasi Prisma di environment deployment.
5. Pastikan `NEXTAUTH_SECRET` dan `DATABASE_URL` valid sebelum produksi dibuka.

## Catatan keamanan

- Tidak ada credential hardcoded di UI.
- Session admin disimpan dan dicek di server.
- Semua validasi penting berada di backend.
- Data sensitif seperti NIM, WhatsApp, email, dan bukti pembayaran hanya ditampilkan untuk role admin yang berwenang.
